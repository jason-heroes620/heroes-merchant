import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import {
    AlertCircle,
    Info,
    X,
    CheckCircle2,
    Calendar,
    Clock,
} from "lucide-react";
import type {
    Event,
    Conversion,
    UserRole,
    EventSlot,
    EventSlotPrice,
} from "../../../types/events";
import StatusBadge from "./StatusBadge";

type EventStatus = "draft" | "pending" | "active" | "inactive" | "rejected";

interface Props {
    event: Event;
    userRole: UserRole;
    conversion: Conversion | null;
    onClose: () => void;
}

interface CreditRow {
    id: string;
    activation_mode: "keep_rm" | "custom_free_credits" | "convert_credits";
    paid_credits: number | null;
    free_credits: number | null;
}

interface SelectProps {
    value: string;
    onValueChange: (value: EventStatus | string) => void;
    children: React.ReactNode;
    className?: string;
}

interface InputProps {
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
}

interface RadioOption {
    value: string;
    label: string;
}

interface RadioGroupProps {
    value: string;
    onValueChange: (value: string) => void;
    options: RadioOption[];
}

const Select: React.FC<SelectProps> = ({
    value,
    onValueChange,
    children,
    className = "",
}) => (
    <select
        value={value}
        onChange={(e) => onValueChange(e.target.value as EventStatus)}
        className={`w-full h-9 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
    >
        {children}
    </select>
);

const Input: React.FC<InputProps> = ({
    type = "text",
    value,
    onChange,
    placeholder = "",
    className = "",
}) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${className}`}
    />
);

const RadioGroup: React.FC<RadioGroupProps> = ({
    value,
    onValueChange,
    options,
}) => (
    <div className="space-y-2">
        {options.map((option) => (
            <label
                key={option.value}
                className="flex items-start gap-3 cursor-pointer group"
            >
                <input
                    type="radio"
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => onValueChange(e.target.value)}
                    className="mt-0.5 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-orange-600">
                        {option.label}
                    </div>
                </div>
            </label>
        ))}
    </div>
);

const StatusToggleModal: React.FC<Props> = ({
    event,
    userRole,
    conversion,
    onClose,
}) => {
    const [newStatus, setNewStatus] = useState<EventStatus>(event.status);
    const [rejectedReason, setRejectedReason] = useState("");
    const [activationMode, setActivationMode] = useState("keep_rm");
    const [bulkPaidCredits, setBulkPaidCredits] = useState<number | "">("");
    const [bulkFreeCredits, setBulkFreeCredits] = useState<number | "">("");
    const [applyToAll, setApplyToAll] = useState(false);
    const [bulkApplyMode, setBulkApplyMode] = useState<
        "all" | "age_group" | "day_type"
    >("all");
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("");
    const [selectedDayType, setSelectedDayType] = useState<
        "weekday" | "weekend"
    >("weekday");

    const ageGroups = event.age_groups || [];

    // Calculate credits based on conversion service logic
    const calculateCredits = (priceInRM: number) => {
        if (!conversion) return { paid: 0, free: 0 };

        const paid = Math.ceil(priceInRM * conversion.credits_per_rm);
        const free = Math.ceil(
            (paid / conversion.paid_credit_percentage) *
                conversion.free_credit_percentage
        );

        return { paid, free };
    };

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

    const [credits, setCredits] = useState<CreditRow[]>(
        slotPrices.map((sp) => {
            const recommended = calculateCredits(sp.price_in_rm ?? 0);
            const mode = sp.activation_mode ?? "keep_rm";
            return {
                id: sp.id,
                activation_mode: mode,
                paid_credits:
                    mode === "custom_free_credits" || mode === "keep_rm"
                        ? null
                        : sp.paid_credits ?? recommended.paid,
                free_credits:
                    mode === "keep_rm"
                        ? null
                        : sp.free_credits ??
                          (mode === "custom_free_credits"
                              ? 0
                              : recommended.free),
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

    const updatePaidCredits = (priceRowId: string, paidValue: number) => {
        setCredits((prev) =>
            prev.map((c) =>
                c.id === priceRowId
                    ? {
                          ...c,
                          paid_credits:
                              c.activation_mode === "custom_free_credits"
                                  ? null
                                  : paidValue,
                      }
                    : c
            )
        );
    };

    const updateFreeCredits = (priceRowId: string, freeValue: number) => {
        setCredits((prev) =>
            prev.map((c) =>
                c.id === priceRowId ? { ...c, free_credits: freeValue } : c
            )
        );
    };

    // Check if date is weekend
    const isWeekend = (dateString: string): boolean => {
        const date = new Date(dateString);
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    // Apply bulk credits based on mode
    const applyBulkCredits = () => {
        if (bulkPaidCredits === "" && bulkFreeCredits === "") {
            toast.error("Please enter values for paid and/or free credits");
            return;
        }

        setCredits((prev) =>
            prev.map((c) => {
                const slotPrice = slotPrices.find((sp) => sp.id === c.id);
                if (!slotPrice) return c;

                let shouldApply = true;

                if (bulkApplyMode === "age_group" && selectedAgeGroup) {
                    shouldApply =
                        slotPrice.event_age_group_id === selectedAgeGroup;
                } else if (bulkApplyMode === "day_type") {
                    const slot = event.slots?.find(
                        (s) => s.id === slotPrice.event_slot_id
                    );
                    if (slot?.date) {
                        const isSlotWeekend = isWeekend(slot.date);
                        shouldApply =
                            selectedDayType === "weekend"
                                ? isSlotWeekend
                                : !isSlotWeekend;
                    }
                }

                if (!shouldApply) return c;

                const updated: CreditRow = {
                    ...c,
                    activation_mode: activationMode as
                        | "keep_rm"
                        | "custom_free_credits"
                        | "convert_credits",
                };

                switch (activationMode) {
                    case "custom_free_credits":
                        updated.paid_credits = null;
                        if (bulkFreeCredits !== "") {
                            updated.free_credits = Number(bulkFreeCredits);
                        }
                        break;
                    case "convert_credits":
                        if (bulkPaidCredits !== "") {
                            updated.paid_credits = Number(bulkPaidCredits);
                        }
                        if (bulkFreeCredits !== "") {
                            updated.free_credits = Number(bulkFreeCredits);
                        }
                        break;
                    case "keep_rm":
                        updated.paid_credits = null;
                        updated.free_credits = null;
                        break;
                }

                return updated;
            })
        );

        const modeText =
            bulkApplyMode === "all"
                ? "all slots"
                : bulkApplyMode === "age_group"
                ? `${
                      ageGroups.find((ag) => ag.id === selectedAgeGroup)
                          ?.label || "selected"
                  } age group`
                : `${selectedDayType} slots`;

        toast.success(`Credits applied to ${modeText}!`);
    };

    // Calculate conversion display
    const conversionDisplay = useMemo(() => {
        if (!conversion) return null;
        const { paid, free } = calculateCredits(1);
        return { paid, free };
    }, [conversion]);

    const handleConfirm = () => {
        let statusToUpdate: EventStatus = newStatus;

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

        const parseCredit = (value: number | null | undefined) =>
            value == null ? null : Number(value);

        const slot_prices = credits.map((c) => {
            switch (activationMode) {
                case "custom_free_credits":
                    return {
                        id: c.id,
                        paid_credits: null,
                        free_credits: parseCredit(c.free_credits),
                        activation_mode: activationMode,
                    };
                case "convert_credits":
                    return {
                        id: c.id,
                        paid_credits: parseCredit(c.paid_credits),
                        free_credits: parseCredit(c.free_credits),
                        activation_mode: activationMode,
                    };
                case "keep_rm":
                    return {
                        id: c.id,
                        paid_credits: null,
                        free_credits: null,
                        activation_mode: activationMode,
                    };
            }
        });

        const payload: Record<string, any> = {
            status: statusToUpdate,
            slot_prices,
        };

        if (statusToUpdate === "rejected") {
            payload.rejected_reason = rejectedReason;
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with linear */}
                <div className="bg-linear-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            Update Event Status
                        </h3>
                        <p className="text-orange-100 text-xs mt-0.5">
                            Configure status and pricing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/90 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Status Selection */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    Current Status
                                </label>
                                <StatusBadge status={event.status} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                    New Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={newStatus}
                                    onValueChange={(val) =>
                                        setNewStatus(val as EventStatus)
                                    }
                                >
                                    <option value="">Select status</option>
                                    {getAllowedStatuses().map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {newStatus === "rejected" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <label className="text-sm font-medium text-red-900 mb-2 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                Rejection Reason{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectedReason}
                                onChange={(e) =>
                                    setRejectedReason(e.target.value)
                                }
                                className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                rows={3}
                                placeholder="Provide detailed reason for rejection..."
                            />
                        </div>
                    )}

                    {/* Activation Mode */}
                    {isAdmin &&
                        (newStatus === "active" || event.status === "active") &&
                        conversion && (
                            <>
                                <div className="bg-linear-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <span className="text-sm font-semibold text-orange-900 block mb-3">
                                                Pricing Configuration
                                            </span>
                                            <RadioGroup
                                                value={activationMode}
                                                onValueChange={
                                                    setActivationMode
                                                }
                                                options={[
                                                    {
                                                        value: "keep_rm",
                                                        label: "Keep RM Pricing",
                                                    },
                                                    {
                                                        value: "custom_free_credits",
                                                        label: "Keep RM Pricing + Free Rewards",
                                                    },
                                                    {
                                                        value: "convert_credits",
                                                        label: "Convert to Credits",
                                                    },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {activationMode === "convert_credits" &&
                                        conversionDisplay && (
                                            <div className="mt-3 pt-3 border-t border-orange-200">
                                                <div className="bg-white rounded-lg p-3 border border-orange-200">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600 font-medium">
                                                            Conversion Rate:
                                                        </span>
                                                        <span className="font-bold text-orange-700">
                                                            RM 1 ={" "}
                                                            <span className="font-bold text-blue-700">
                                                                {
                                                                    conversionDisplay.paid
                                                                }{" "}
                                                                Paid Credits
                                                            </span>{" "}
                                                            +{" "}
                                                            <span className="font-bold text-green-700">
                                                                {
                                                                    conversionDisplay.free
                                                                }{" "}
                                                                Free Credits
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Credit Configuration - Show for both convert_credits and custom_free_credits */}
                                {(activationMode === "convert_credits" ||
                                    activationMode ===
                                        "custom_free_credits") && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-orange-600" />
                                            {activationMode ===
                                            "custom_free_credits"
                                                ? "Add Free Rewards"
                                                : "Review Credit Conversion"}
                                        </h4>

                                        {/* Bulk Apply Section - Only show Free Credits field for custom mode */}
                                        <div className="bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <input
                                                    type="checkbox"
                                                    id="applyToAll"
                                                    checked={applyToAll}
                                                    onChange={(e) =>
                                                        setApplyToAll(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="h-4 w-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                                                />
                                                <label
                                                    htmlFor="applyToAll"
                                                    className="text-sm font-semibold text-gray-900 cursor-pointer"
                                                >
                                                    Apply same credits to
                                                    multiple slots
                                                </label>
                                            </div>

                                            {applyToAll && (
                                                <div className="space-y-3 mt-3">
                                                    {/* Apply Mode Selection */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-2">
                                                            Apply To
                                                        </label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setBulkApplyMode(
                                                                        "all"
                                                                    )
                                                                }
                                                                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                    bulkApplyMode ===
                                                                    "all"
                                                                        ? "bg-blue-600 text-white"
                                                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                All Slots
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setBulkApplyMode(
                                                                        "age_group"
                                                                    )
                                                                }
                                                                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                    bulkApplyMode ===
                                                                    "age_group"
                                                                        ? "bg-blue-600 text-white"
                                                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                Age Group
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setBulkApplyMode(
                                                                        "day_type"
                                                                    )
                                                                }
                                                                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                    bulkApplyMode ===
                                                                    "day_type"
                                                                        ? "bg-blue-600 text-white"
                                                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                }`}
                                                            >
                                                                Day Type
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Age Group Selection */}
                                                    {bulkApplyMode ===
                                                        "age_group" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                                Select Age Group
                                                            </label>
                                                            <Select
                                                                value={
                                                                    selectedAgeGroup
                                                                }
                                                                onValueChange={
                                                                    setSelectedAgeGroup
                                                                }
                                                            >
                                                                <option value="">
                                                                    Choose age
                                                                    group
                                                                </option>
                                                                {ageGroups.map(
                                                                    (ag) => (
                                                                        <option
                                                                            key={
                                                                                ag.id
                                                                            }
                                                                            value={
                                                                                ag.id
                                                                            }
                                                                        >
                                                                            {
                                                                                ag.label
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                            </Select>
                                                        </div>
                                                    )}

                                                    {/* Day Type Selection */}
                                                    {bulkApplyMode ===
                                                        "day_type" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                                Select Day Type
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedDayType(
                                                                            "weekday"
                                                                        )
                                                                    }
                                                                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                        selectedDayType ===
                                                                        "weekday"
                                                                            ? "bg-green-600 text-white"
                                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Weekdays
                                                                    (Mon-Fri)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedDayType(
                                                                            "weekend"
                                                                        )
                                                                    }
                                                                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                                                        selectedDayType ===
                                                                        "weekend"
                                                                            ? "bg-purple-600 text-white"
                                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                                    }`}
                                                                >
                                                                    Weekends
                                                                    (Sat-Sun)
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Credit Input Fields */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {activationMode ===
                                                            "convert_credits" && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                                    Paid Credits
                                                                </label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter amount"
                                                                    value={
                                                                        bulkPaidCredits
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setBulkPaidCredits(
                                                                            e
                                                                                .target
                                                                                .value ===
                                                                                ""
                                                                                ? ""
                                                                                : Number(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  )
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <div
                                                            className={
                                                                activationMode ===
                                                                "custom_free_credits"
                                                                    ? "col-span-2"
                                                                    : ""
                                                            }
                                                        >
                                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                                {activationMode ===
                                                                "custom_free_credits"
                                                                    ? "Free Rewards"
                                                                    : "Free Credits"}
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                value={
                                                                    bulkFreeCredits
                                                                }
                                                                onChange={(e) =>
                                                                    setBulkFreeCredits(
                                                                        e.target
                                                                            .value ===
                                                                            ""
                                                                            ? ""
                                                                            : Number(
                                                                                  e
                                                                                      .target
                                                                                      .value
                                                                              )
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            applyBulkCredits
                                                        }
                                                        disabled={
                                                            (bulkApplyMode ===
                                                                "age_group" &&
                                                                !selectedAgeGroup) ||
                                                            (bulkPaidCredits ===
                                                                "" &&
                                                                bulkFreeCredits ===
                                                                    "")
                                                        }
                                                        className="w-full px-4 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Apply Credits
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compact Table View */}
                                        <div className="space-y-3">
                                            {!event.is_recurring && (
                                                <div className="space-y-2">
                                                    {event.slots?.map(
                                                        (slot) => {
                                                            const pricesForSlot =
                                                                slotPrices.filter(
                                                                    (p) =>
                                                                        p.event_slot_id ===
                                                                        slot.id
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        slot.id
                                                                    }
                                                                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors"
                                                                >
                                                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                                                        <Clock className="w-4 h-4 text-orange-600" />
                                                                        <span className="text-xs font-semibold text-gray-700">
                                                                            {
                                                                                slot.start_time
                                                                            }{" "}
                                                                            -{" "}
                                                                            {
                                                                                slot.end_time
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="p-3 space-y-2">
                                                                        {pricesForSlot.map(
                                                                            (
                                                                                priceRow
                                                                            ) => {
                                                                                const ageGroup =
                                                                                    ageGroups.find(
                                                                                        (
                                                                                            ag
                                                                                        ) =>
                                                                                            ag.id ===
                                                                                            priceRow.event_age_group_id
                                                                                    );
                                                                                const priceInRM =
                                                                                    Number(
                                                                                        priceRow.price_in_rm
                                                                                    ) ||
                                                                                    0;
                                                                                const recommended =
                                                                                    calculateCredits(
                                                                                        priceInRM
                                                                                    );
                                                                                const current =
                                                                                    credits.find(
                                                                                        (
                                                                                            c
                                                                                        ) =>
                                                                                            c.id ===
                                                                                            priceRow.id
                                                                                    );

                                                                                if (
                                                                                    activationMode ===
                                                                                    "custom_free_credits"
                                                                                ) {
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                priceRow.id
                                                                                            }
                                                                                            className="flex items-center gap-3 text-sm"
                                                                                        >
                                                                                            <div className="w-23 text-xs font-medium text-gray-600">
                                                                                                {ageGroup
                                                                                                    ? `${
                                                                                                          ageGroup.label
                                                                                                      }${
                                                                                                          ageGroup.min_age !=
                                                                                                              null ||
                                                                                                          ageGroup.max_age !=
                                                                                                              null
                                                                                                              ? ` (${
                                                                                                                    ageGroup.min_age ??
                                                                                                                    "–"
                                                                                                                }–${
                                                                                                                    ageGroup.max_age ??
                                                                                                                    "+"
                                                                                                                })`
                                                                                                              : ""
                                                                                                      }`
                                                                                                    : "General"}
                                                                                            </div>
                                                                                            <div className="w-20 font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                                                                                                RM{" "}
                                                                                                {priceInRM.toFixed(
                                                                                                    2
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex-1">
                                                                                                <label className="block text-xs text-blue-600 mb-1 font-bold">
                                                                                                    Free
                                                                                                    Rewards
                                                                                                </label>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    value={
                                                                                                        current?.free_credits ??
                                                                                                        0
                                                                                                    }
                                                                                                    onChange={(
                                                                                                        e
                                                                                                    ) =>
                                                                                                        updateFreeCredits(
                                                                                                            priceRow.id,
                                                                                                            Number(
                                                                                                                e
                                                                                                                    .target
                                                                                                                    .value
                                                                                                            )
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder="0"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                } else {
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                priceRow.id
                                                                                            }
                                                                                            className="flex items-center gap-3 text-sm"
                                                                                        >
                                                                                            <div className="w-23 text-xs font-medium text-gray-600">
                                                                                                {ageGroup
                                                                                                    ? `${
                                                                                                          ageGroup.label
                                                                                                      }${
                                                                                                          ageGroup.min_age !=
                                                                                                              null ||
                                                                                                          ageGroup.max_age !=
                                                                                                              null
                                                                                                              ? ` (${
                                                                                                                    ageGroup.min_age ??
                                                                                                                    "–"
                                                                                                                }–${
                                                                                                                    ageGroup.max_age ??
                                                                                                                    "+"
                                                                                                                })`
                                                                                                              : ""
                                                                                                      }`
                                                                                                    : "General"}
                                                                                            </div>
                                                                                            <div className="w-20 font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                                                                                                RM{" "}
                                                                                                {priceInRM.toFixed(
                                                                                                    2
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                                                                <div>
                                                                                                    <label className="block text-xs text-blue-600 mb-1 font-bold">
                                                                                                        Paid
                                                                                                        Credits{" "}
                                                                                                        <span className="text-gray-600 font-normal text-xs">
                                                                                                            (Suggested:{" "}
                                                                                                            {
                                                                                                                recommended.paid
                                                                                                            }

                                                                                                            )
                                                                                                        </span>
                                                                                                    </label>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        value={
                                                                                                            current?.paid_credits ??
                                                                                                            recommended.paid
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e
                                                                                                        ) =>
                                                                                                            updatePaidCredits(
                                                                                                                priceRow.id,
                                                                                                                Number(
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder=""
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <label className="block text-xs text-green-600 mb-1 font-bold">
                                                                                                        Free
                                                                                                        Credits{" "}
                                                                                                        <span className="text-gray-600 font-normal text-xs">
                                                                                                            (Suggested:{" "}
                                                                                                            {
                                                                                                                recommended.free
                                                                                                            }

                                                                                                            )
                                                                                                        </span>
                                                                                                    </label>
                                                                                                    <Input
                                                                                                        type="number"
                                                                                                        value={
                                                                                                            current?.free_credits ??
                                                                                                            recommended.free
                                                                                                        }
                                                                                                        onChange={(
                                                                                                            e
                                                                                                        ) =>
                                                                                                            updateFreeCredits(
                                                                                                                priceRow.id,
                                                                                                                Number(
                                                                                                                    e
                                                                                                                        .target
                                                                                                                        .value
                                                                                                                )
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder=""
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}

                                            {event.is_recurring && (
                                                <div className="space-y-3">
                                                    {sortedDates.map((date) => (
                                                        <div
                                                            key={date}
                                                            className="border-l-4 border-orange-500 pl-3"
                                                        >
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Calendar className="w-4 h-4 text-orange-600" />
                                                                <h5 className="text-sm font-bold text-gray-900">
                                                                    {formatDate(
                                                                        date
                                                                    )}
                                                                </h5>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {slotsByDate[
                                                                    date
                                                                ].map(
                                                                    (slot) => {
                                                                        const pricesForSlot =
                                                                            slotPrices.filter(
                                                                                (
                                                                                    p
                                                                                ) =>
                                                                                    p.event_slot_id ===
                                                                                    slot.id
                                                                            );

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    slot.id
                                                                                }
                                                                                className="border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition-colors"
                                                                            >
                                                                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                                                    <span className="text-xs font-semibold text-gray-700">
                                                                                        {
                                                                                            slot.start_time
                                                                                        }{" "}
                                                                                        -{" "}
                                                                                        {
                                                                                            slot.end_time
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <div className="p-3 space-y-2">
                                                                                    {pricesForSlot.map(
                                                                                        (
                                                                                            priceRow
                                                                                        ) => {
                                                                                            const ageGroup =
                                                                                                ageGroups.find(
                                                                                                    (
                                                                                                        ag
                                                                                                    ) =>
                                                                                                        ag.id ===
                                                                                                        priceRow.event_age_group_id
                                                                                                );
                                                                                            const priceInRM =
                                                                                                Number(
                                                                                                    priceRow.price_in_rm
                                                                                                ) ||
                                                                                                0;
                                                                                            const recommended =
                                                                                                calculateCredits(
                                                                                                    priceInRM
                                                                                                );
                                                                                            const current =
                                                                                                credits.find(
                                                                                                    (
                                                                                                        c
                                                                                                    ) =>
                                                                                                        c.id ===
                                                                                                        priceRow.id
                                                                                                );

                                                                                            if (
                                                                                                activationMode ===
                                                                                                "custom_free_credits"
                                                                                            ) {
                                                                                                return (
                                                                                                    <div
                                                                                                        key={
                                                                                                            priceRow.id
                                                                                                        }
                                                                                                        className="flex items-center gap-3 text-sm"
                                                                                                    >
                                                                                                        <div className="w-23 text-xs font-medium text-gray-600">
                                                                                                            {ageGroup
                                                                                                                ? `${
                                                                                                                      ageGroup.label
                                                                                                                  }${
                                                                                                                      ageGroup.min_age !=
                                                                                                                          null ||
                                                                                                                      ageGroup.max_age !=
                                                                                                                          null
                                                                                                                          ? ` (${
                                                                                                                                ageGroup.min_age ??
                                                                                                                                "–"
                                                                                                                            }–${
                                                                                                                                ageGroup.max_age ??
                                                                                                                                "+"
                                                                                                                            })`
                                                                                                                          : ""
                                                                                                                  }`
                                                                                                                : "General"}
                                                                                                        </div>
                                                                                                        <div className="w-20 font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                                                                                                            RM{" "}
                                                                                                            {priceInRM.toFixed(
                                                                                                                2
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className="flex-1">
                                                                                                            <label className="block text-xs text-blue-600 mb-1 font-bold">
                                                                                                                Free
                                                                                                                Rewards
                                                                                                            </label>
                                                                                                            <Input
                                                                                                                type="number"
                                                                                                                value={
                                                                                                                    current?.free_credits ??
                                                                                                                    0
                                                                                                                }
                                                                                                                onChange={(
                                                                                                                    e
                                                                                                                ) =>
                                                                                                                    updateFreeCredits(
                                                                                                                        priceRow.id,
                                                                                                                        Number(
                                                                                                                            e
                                                                                                                                .target
                                                                                                                                .value
                                                                                                                        )
                                                                                                                    )
                                                                                                                }
                                                                                                                placeholder="0"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            } else {
                                                                                                return (
                                                                                                    <div
                                                                                                        key={
                                                                                                            priceRow.id
                                                                                                        }
                                                                                                        className="flex items-center gap-3 text-sm"
                                                                                                    >
                                                                                                        <div className="w-23 text-xs font-medium text-gray-600">
                                                                                                            {ageGroup
                                                                                                                ? `${
                                                                                                                      ageGroup.label
                                                                                                                  }${
                                                                                                                      ageGroup.min_age !=
                                                                                                                          null ||
                                                                                                                      ageGroup.max_age !=
                                                                                                                          null
                                                                                                                          ? ` (${
                                                                                                                                ageGroup.min_age ??
                                                                                                                                "–"
                                                                                                                            }–${
                                                                                                                                ageGroup.max_age ??
                                                                                                                                "+"
                                                                                                                            })`
                                                                                                                          : ""
                                                                                                                  }`
                                                                                                                : "General"}
                                                                                                        </div>
                                                                                                        <div className="w-20 font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                                                                                                            RM{" "}
                                                                                                            {priceInRM.toFixed(
                                                                                                                2
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                                                                                            <div>
                                                                                                                <label className="block text-xs text-blue-600 mb-1 font-bold">
                                                                                                                    Paid
                                                                                                                    Credits{" "}
                                                                                                                    <span className="text-gray-600 font-normal text-xs">
                                                                                                                        (Suggested:{" "}
                                                                                                                        {
                                                                                                                            recommended.paid
                                                                                                                        }

                                                                                                                        )
                                                                                                                    </span>
                                                                                                                </label>
                                                                                                                <Input
                                                                                                                    type="number"
                                                                                                                    value={
                                                                                                                        current?.paid_credits ??
                                                                                                                        recommended.paid
                                                                                                                    }
                                                                                                                    onChange={(
                                                                                                                        e
                                                                                                                    ) =>
                                                                                                                        updatePaidCredits(
                                                                                                                            priceRow.id,
                                                                                                                            Number(
                                                                                                                                e
                                                                                                                                    .target
                                                                                                                                    .value
                                                                                                                            )
                                                                                                                        )
                                                                                                                    }
                                                                                                                    placeholder=""
                                                                                                                />
                                                                                                            </div>
                                                                                                            <div>
                                                                                                                <label className="block text-xs text-green-600 mb-1 font-bold">
                                                                                                                    Free
                                                                                                                    Credits{" "}
                                                                                                                    <span className="text-gray-600 font-normal text-xs">
                                                                                                                        (Suggested:{" "}
                                                                                                                        {
                                                                                                                            recommended.free
                                                                                                                        }

                                                                                                                        )
                                                                                                                    </span>
                                                                                                                </label>
                                                                                                                <Input
                                                                                                                    type="number"
                                                                                                                    value={
                                                                                                                        current?.free_credits ??
                                                                                                                        recommended.free
                                                                                                                    }
                                                                                                                    onChange={(
                                                                                                                        e
                                                                                                                    ) =>
                                                                                                                        updateFreeCredits(
                                                                                                                            priceRow.id,
                                                                                                                            Number(
                                                                                                                                e
                                                                                                                                    .target
                                                                                                                                    .value
                                                                                                                            )
                                                                                                                        )
                                                                                                                    }
                                                                                                                    placeholder=""
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                        }
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-5 py-4 flex gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="flex-1 h-9 px-4 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 h-9 px-4 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none flex items-center justify-center gap-1.5"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusToggleModal;
