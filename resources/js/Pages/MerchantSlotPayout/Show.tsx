import React from "react";
import { ArrowLeft } from "lucide-react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "../../AuthenticatedLayout";

type BookingItem = {
    age_group_label: string;
    quantity: number;
    price_in_rm?: number;
    total_amount: number;
};

type Slot = {
    slot_start?: string | null;
    slot_end?: string | null;
    subtotal: number;
    booking_breakdown?: BookingItem[];
};

type Event = {
    event_id: string;
    event_title: string;
    total_amount: number;
    slots: Slot[];
};

type Props = {
    role: "admin" | "merchant";
    month: string;
    events?: Event[];
    event?: Event;
    merchant_company?: string;
};

const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "N/A";
    const startDate = new Date(start);
    const endDate = new Date(end);

    const dateOptions: Intl.DateTimeFormatOptions = {
        month: "numeric",
        day: "numeric",
        year: "numeric",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    };

    const startDateStr = startDate.toLocaleDateString("en-US", dateOptions);
    const endDateStr = endDate.toLocaleDateString("en-US", dateOptions);
    const startTimeStr = startDate.toLocaleTimeString("en-US", timeOptions);
    const endTimeStr = endDate.toLocaleTimeString("en-US", timeOptions);

    return startDateStr === endDateStr
        ? `${startDateStr}, ${startTimeStr} - ${endTimeStr}`
        : `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
};

const MerchantPayoutShow: React.FC<Props> = ({
    role,
    month,
    events,
    event,
    merchant_company,
}) => {
    const handleBack = () => {
        const routePrefix = role === "admin" ? "/admin" : "/merchant";
        router.get(`${routePrefix}/payouts`, { month });
    };

    // Determine what to render based on role
    const eventList = role === "admin" ? events ?? [] : event ? [event] : [];

    return (
        <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto px-6 py-4">
                <button
                    onClick={handleBack}
                    className="bg-orange-500 flex items-center gap-2 px-5 py-3 rounded-xl  text-white hover:text-orange-100 transition-colors font-medium mb-3"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Payouts</span>
                </button>
            </div>

            <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
                {eventList.map((ev) => (
                    <div
                        key={ev.event_id}
                        className="max-w-7xl mx-auto px-6 py-8 mb-10 bg-white rounded-2xl shadow-sm border border-orange-100"
                    >
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-orange-900 mb-1">
                                    {ev.event_title}
                                </h2>
                                {role === "admin" && (
                                    <p className="text-sm text-gray-600">
                                        Merchant: {merchant_company ?? "N/A"}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">
                                    Total Amount: RM{" "}
                                    {Number(ev.total_amount || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Slots */}
                        {ev.slots.map((slot, idx) => (
                            <div
                                key={idx}
                                className="mb-6 bg-orange-50/30 p-5 rounded-xl border border-orange-100"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {formatDateRange(
                                            slot.slot_start,
                                            slot.slot_end
                                        )}
                                    </p>
                                </div>

                                {/* Booking Breakdown Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-orange-50/50 border-b border-orange-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase tracking-wider">
                                                    Age Group
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-orange-900 uppercase tracking-wider">
                                                    Quantity
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-orange-900 uppercase tracking-wider">
                                                    Price (RM)
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-orange-900 uppercase tracking-wider">
                                                    Subtotal (RM)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-orange-50">
                                            {slot.booking_breakdown?.map(
                                                (b, i) => (
                                                    <tr
                                                        key={i}
                                                        className="hover:bg-orange-50/30 transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            {b.age_group_label ||
                                                                "General"}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {b.quantity}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {b.price_in_rm?.toFixed(
                                                                2
                                                            ) || "0.00"}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            RM{" "}
                                                            {Number(
                                                                b.total_amount ||
                                                                    0
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end me-5">
                                    <p className="text-lg font-bold text-gray-900">
                                        RM{" "}
                                        {Number(slot.subtotal || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </AuthenticatedLayout>
    );
};

export default MerchantPayoutShow;
