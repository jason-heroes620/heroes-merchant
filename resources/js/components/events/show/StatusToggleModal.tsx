import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { Clock, AlertCircle, Info, Calendar, Copy } from "lucide-react";
import type {
    Event,
    Conversion,
    UserRole,
    EventSlot,
    EventSlotPrice,
    AgeGroup,
} from "../../../types/events";
import StatusBadge from "./StatusBadge";

type EventStatus = "draft" | "pending" | "active" | "inactive" | "rejected";

interface Props {
    event: Event;
    userRole: UserRole;
    conversion: Conversion | null;
    onClose: () => void;
}

const StatusToggleModal: React.FC<Props> = ({
    event,
    userRole,
    conversion,
    onClose,
}) => {
    const [newStatus, setNewStatus] = useState(event.status);
    const [rejectedReason, setRejectedReason] = useState("");
    const [bulkPaidCredits, setBulkPaidCredits] = useState<number | "">("");
    const [bulkFreeCredits, setBulkFreeCredits] = useState<number | "">("");
    const [applyToAll, setApplyToAll] = useState(false);

    const ageGroups = event.age_groups || [];

    const slotPrices: (EventSlotPrice & { event_slot_id: string })[] = useMemo(
        () =>
            event.slots?.flatMap(
                (slot) =>
                    slot.prices?.map((price) => ({
                        ...price,
                        event_slot_id: slot.id!,
                    })) || []
            ) || [],
        [event.slots]
    );

    // Calculate recommended credits with proper rounding
    const calculateCredits = (priceInRM: number) => {
        if (!conversion) return { paid: 0, free: 0 };

        const paid = Math.ceil(priceInRM * conversion.credits_per_rm);
        const free = Math.ceil(
            (paid / conversion.paid_credit_percentage) *
                conversion.free_credit_percentage
        );

        return { paid, free };
    };

    // const recommended_paid_credits = conversion?.credits_per_rm ?? 0;
    // const recommended_free_credits = conversion
    //     ? Math.ceil(
    //           (recommended_paid_credits / conversion.paid_credit_percentage) *
    //               conversion.free_credit_percentage
    //       )
    //     : 0;

    // Initialize credits with recommended values
    const [credits, setCredits] = useState(
        slotPrices.map((sp) => {
            const recommended = calculateCredits(sp.price_in_rm ?? 0);
            return {
                id: sp.id,
                paid_credits: sp.paid_credits ?? recommended.paid,
                free_credits: sp.free_credits ?? recommended.free,
            };
        })
    );

    const isMerchant = userRole === "merchant";
    const isAdmin = userRole === "admin";

    const getAllowedStatuses = (): EventStatus[] => {
        if (isMerchant) {
            if (event.status === "draft") return ["pending"];
            if (event.status === "active") return ["inactive"];
            return [];
        } else if (isAdmin) {
            if (event.status === "pending") return ["active", "rejected"];
            if (event.status === "active") return ["inactive"];
            return [];
        }
        return [];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        return `${day}/${month}/${year} (${weekday})`;
    };

    const slotsByDate: Record<string, EventSlot[]> = useMemo(() => {
        if (!event.slots) return {};
        return event.slots
            .filter((s): s is EventSlot & { date: string } => !!s.date)
            .reduce((acc, slot) => {
                if (!acc[slot.date]) acc[slot.date] = [];
                acc[slot.date].push(slot);
                return acc;
            }, {} as Record<string, EventSlot[]>);
    }, [event.slots]);

    const sortedDates = Object.keys(slotsByDate).sort();

    const updateCreditsValue = (
        priceRowId: string,
        field: "paid_credits" | "free_credits",
        value: number | ""
    ) => {
        setCredits((prev) =>
            prev.map((c) =>
                c.id === priceRowId ? { ...c, [field]: value || 0 } : c
            )
        );
    };

    const applyBulkCredits = () => {
        if (bulkPaidCredits === "" && bulkFreeCredits === "") {
            toast.error("Please enter values for paid and/or free credits");
            return;
        }

        const updated = [...credits];
        let hasError = false;

        for (let i = 0; i < slotPrices.length; i++) {
            const minPaidCredits = conversion
                ? Math.ceil(
                      (slotPrices[i].price_in_rm ?? 0) *
                          conversion.credits_per_rm
                  )
                : 0;

            if (bulkPaidCredits !== "" && bulkPaidCredits < minPaidCredits) {
                toast.error(
                    `Paid credits (${bulkPaidCredits}) is below minimum for slot ${
                        i + 1
                    } (RM ${
                        slotPrices[i].price_in_rm
                    } requires ${minPaidCredits} credits)`
                );
                hasError = true;
                break;
            }

            if (bulkPaidCredits !== "") {
                updated[i].paid_credits = bulkPaidCredits;
            }
            if (bulkFreeCredits !== "") {
                updated[i].free_credits = bulkFreeCredits;
            }
        }

        if (!hasError) {
            setCredits(updated);
            toast.success("Credits applied to all slots!");
        }
    };

    const handleConfirm = () => {
        let statusToUpdate = newStatus;

        if (isMerchant) {
            if (event.status === "draft") statusToUpdate = "pending";
            else if (event.status === "active") statusToUpdate = "inactive";
            else return;
        } else if (isAdmin) {
            if (!["active", "rejected", "inactive"].includes(statusToUpdate)) {
                toast.error("Please select a valid status");
                return;
            }
        }

        if (statusToUpdate === "rejected" && !rejectedReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        // Validate paid credits are not below minimum
        if (statusToUpdate === "active" && conversion) {
            for (let i = 0; i < slotPrices.length; i++) {
                const minPaidCredits = Math.ceil(
                    (slotPrices[i].price_in_rm ?? 0) * conversion.credits_per_rm
                );

                if (credits[i].paid_credits < minPaidCredits) {
                    toast.error(
                        `Slot ${
                            i + 1
                        }: Paid credits must be at least ${minPaidCredits}`
                    );
                    return;
                }
            }
        }

        const payload: Record<string, any> = {
            status: statusToUpdate,
        };

        if (statusToUpdate === "rejected") {
            payload.rejected_reason = rejectedReason;
        }

        if (statusToUpdate === "active") {
            payload.slot_prices = credits;
        }

        const routeName = isAdmin
            ? `admin.events.updateStatus`
            : `merchant.events.updateStatus`;

        router.post(route(routeName, event.id), payload, {
            preserveState: true,
            onSuccess: () => {
                event.status = statusToUpdate;
                toast.success("Event status updated!");
                onClose();
            },
            onError: (errors) => {
                if (errors.status) toast.error(errors.status);
            },
        });
    };

    const renderSlotCredits = (slot: EventSlot, ageGroups: AgeGroup[]) => {
        // All prices belonging to this slot
        const pricesForSlot = slotPrices.filter(
            (p) => p.event_slot_id === slot.id
        );

        return (
            <div
                key={slot.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
            >
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">
                            {slot.start_time} - {slot.end_time}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {pricesForSlot.map((priceRow) => {
                        const ageGroup = ageGroups.find(
                            (ag: AgeGroup) =>
                                ag.id === priceRow.event_age_group_id
                        );

                        const priceInRM = Number(priceRow.price_in_rm) || 0;
                        const recommended = calculateCredits(priceInRM);
                        const current = credits.find(
                            (c) => c.id === priceRow.id
                        );

                        const minPaidCredits = conversion
                            ? Math.ceil(priceInRM * conversion.credits_per_rm)
                            : 0;

                        return (
                            <div
                                key={priceRow.id}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {ageGroup
                                            ? ageGroup.label
                                            : "General Pricing"}
                                    </span>
                                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                        RM {priceInRM.toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Paid Credits{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2 items-start">
                                        <input
                                            type="number"
                                            min={minPaidCredits}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={
                                                current?.paid_credits ??
                                                recommended.paid
                                            }
                                            onChange={(e) =>
                                                updateCreditsValue(
                                                    priceRow.id,
                                                    "paid_credits",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs whitespace-nowrap text-center">
                                            <div className="text-blue-600 font-medium">
                                                Recommended
                                            </div>
                                            <div className="text-blue-800 font-bold">
                                                {recommended.paid} PAID CREDITS
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum:{" "}
                                        <span className="font-semibold text-red-600">
                                            {minPaidCredits}
                                        </span>{" "}
                                        credits
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                        Free Credits
                                    </label>
                                    <div className="flex gap-2 items-start">
                                        <input
                                            type="number"
                                            min={0}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            value={
                                                current?.free_credits ??
                                                recommended.free
                                            }
                                            onChange={(e) =>
                                                updateCreditsValue(
                                                    priceRow.id,
                                                    "free_credits",
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs whitespace-nowrap text-center">
                                            <div className="text-green-600 font-medium">
                                                Recommended
                                            </div>
                                            <div className="text-green-800 font-bold">
                                                {recommended.free} FREE CREDITS
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 to-red-500 px-6 py-5 text-white">
                    <h3 className="text-2xl font-bold">Update Event Status</h3>
                    <p className="text-orange-100 text-sm mt-1">
                        Review and modify event status and credits
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Status Section */}
                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Status
                                </label>
                                <StatusBadge status={event.status} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) =>
                                        setNewStatus(
                                            e.target.value as EventStatus
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                >
                                    <option value={event.status}>
                                        Select new status
                                    </option>
                                    {getAllowedStatuses().map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {newStatus === "rejected" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                            <label className="block text-sm font-medium text-red-900 mb-2">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Rejection Reason{" "}
                                <span className="text-red-600">*</span>
                            </label>
                            <textarea
                                value={rejectedReason}
                                onChange={(e) =>
                                    setRejectedReason(e.target.value)
                                }
                                className="w-full border border-red-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Provide a detailed reason for rejecting this event..."
                            />
                        </div>
                    )}

                    {/* Credit Conversion Info */}
                    {isAdmin &&
                        newStatus === "active" &&
                        conversion && (
                            <div className="bg-linear-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-5">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-orange-900 mb-2">
                                            Credit Conversion Settings
                                        </p>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="bg-white rounded-lg p-3 border border-orange-200">
                                                <div className="text-gray-600 text-xs">
                                                    Rate
                                                </div>
                                                <div className="font-bold text-orange-700">
                                                    1 RM ={" "}
                                                    {conversion.credits_per_rm}{" "}
                                                    credits
                                                </div>
                                            </div>
                                            {/* <div className="bg-white rounded-lg p-3 border border-orange-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <div className="flex gap-1 text-gray-600 text-xs">
                                                        <span>
                                                            Paid Credits
                                                        </span>
                                                    </div>
                                                    <span className="text-orange-700 font-bold">
                                                        {
                                                            conversion.paid_credit_percentage
                                                        }
                                                        %
                                                    </span>
                                                </div>
                                                <span className="text-orange-700 font-bold text-2xl">
                                                    {recommended_paid_credits}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <div className="flex gap-1 text-gray-600 text-xs">
                                                        <span>
                                                            Free Credits
                                                        </span>
                                                    </div>
                                                    <span className="text-orange-700 font-bold">
                                                        {
                                                            conversion.free_credit_percentage
                                                        }
                                                        %
                                                    </span>
                                                </div>
                                                <span className="text-orange-700 font-bold text-2xl">
                                                    {recommended_free_credits}
                                                </span>
                                            </div>
                                        </div> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    {/* Slot Credits */}
                    {isAdmin && newStatus === "active" && (
                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-600" />
                                Configure Slot Credits
                            </h4>

                            {/* Bulk Apply Section */}
                            <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="applyToAll"
                                        checked={applyToAll}
                                        onChange={(e) =>
                                            setApplyToAll(e.target.checked)
                                        }
                                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                                    />
                                    <label
                                        htmlFor="applyToAll"
                                        className="text-sm font-semibold text-gray-900 cursor-pointer"
                                    >
                                        Apply same credits to all slots
                                    </label>
                                </div>

                                {applyToAll && (
                                    <div className="space-y-3 mt-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Paid Credits for All Slots
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Enter amount"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={bulkPaidCredits}
                                                    onChange={(e) =>
                                                        setBulkPaidCredits(
                                                            e.target.value ===
                                                                ""
                                                                ? ""
                                                                : Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Free Credits for All Slots
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    placeholder="Enter amount"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={bulkFreeCredits}
                                                    onChange={(e) =>
                                                        setBulkFreeCredits(
                                                            e.target.value ===
                                                                ""
                                                                ? ""
                                                                : Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={applyBulkCredits}
                                            className="w-full px-4 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Apply to All Slots
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* One-time Event */}
                            {!event.is_recurring && (
                                <div className="space-y-3">
                                    {event.slots?.map((slot) =>
                                        renderSlotCredits(slot, ageGroups)
                                    )}
                                </div>
                            )}

                            {/* Recurring Event */}
                            {event.is_recurring && (
                                <div className="space-y-4">
                                    {sortedDates.map((date) => (
                                        <div
                                            key={date}
                                            className="border-l-4 border-orange-500 pl-4"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <Calendar className="w-4 h-4 text-orange-600" />
                                                <h5 className="font-semibold text-gray-900">
                                                    {formatDate(date)}
                                                </h5>
                                            </div>
                                            <div className="space-y-3">
                                                {slotsByDate[date].map((slot) =>
                                                    renderSlotCredits(
                                                        slot,
                                                        ageGroups
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={newStatus === event.status}
                        className="flex-1 px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                    >
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusToggleModal;
