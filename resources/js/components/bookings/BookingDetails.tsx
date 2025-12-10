import { DollarSign, Gift } from "lucide-react";
import type { Booking } from "../../types/events";

type Props = {
    booking: Booking;
};

const BookingDetails: React.FC<Props> = ({ booking }) => {
    return (
        <>
            {/* Booking Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-sm font-bold text-gray-700">
                    Booking Details
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Booking Code:</span>
                    <span className="font-mono font-semibold text-gray-900">
                        {booking.booking_code}
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <span className="font-bold text-orange-600 text-lg">
                            {booking.quantity}
                        </span>
                    </div>

                    {booking.items?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {booking.items.map((i) => (
                                <span
                                    key={i.age_group_label}
                                    className="px-2 py-1 bg-white text-orange-700 text-xs font-semibold rounded-lg border border-orange-200"
                                >
                                    {i.age_group_label} × {i.quantity}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions */}
            {booking.transactions && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    <div className="text-sm font-bold text-gray-700 mb-2">
                        Transactions
                    </div>
                    {booking.transactions.map((t) => {
                        const isRefund = t.type === "refund";
                        return (
                            <div
                                key={t.id}
                                className="bg-white rounded-lg p-3 space-y-1"
                            >
                                <div
                                    className={`flex items-center gap-2 text-xs font-bold ${
                                        isRefund
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {isRefund ? "REFUND" : "BOOKING"}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Gift
                                            size={12}
                                            className="text-gray-500"
                                        />
                                        <span className="font-medium text-gray-700">
                                            {Math.abs(t.delta_free)}
                                        </span>{" "}
                                        free credits
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                        <DollarSign
                                            size={12}
                                            className="text-gray-500"
                                        />
                                        <span className="font-medium text-gray-700">
                                            {Math.abs(t.delta_paid)}
                                        </span>{" "}
                                        paid credits
                                    </div>
                                    <span className="text-gray-400 text-xs ml-auto">
                                        {t.created_at}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default BookingDetails;
