import React from "react";
import { CalendarClock, Package, Wallet } from "lucide-react";

interface Props {
    activeEvents: number;
    monthBookings: number;
    thisMonthPayout: number;
    payoutDate: string;
    onEventsClick: () => void;
    onBookingsClick: () => void;
}

const StatsGrid: React.FC<Props> = ({
    activeEvents,
    monthBookings,
    thisMonthPayout,
    payoutDate,
    onEventsClick,
    onBookingsClick,
}) => {
    const stats = [
        {
            label: "Active Events",
            value: activeEvents,
            icon: CalendarClock,
            bgColor: "bg-blue-100",
            textColor: "text-blue-600",
            onClick: onEventsClick,
        },
        {
            label: "Bookings This Month",
            value: monthBookings,
            icon: Package,
            bgColor: "bg-green-100",
            textColor: "text-green-600",
            onClick: onBookingsClick,
        },
        {
            label: "Payout This Month",
            value: `RM ${(thisMonthPayout ?? 0).toFixed(2)}`,
            sublabel: `Paid on ${payoutDate}`,
            icon: Wallet,
            bgColor: "bg-purple-100",
            textColor: "text-purple-600",
            onClick: undefined,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    onClick={stat.onClick}
                    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all ${
                        stat.onClick ? "cursor-pointer" : ""
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`${stat.bgColor} p-4 rounded-xl shrink-0`}>
                            <stat.icon className={stat.textColor} size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-600 mb-1">
                                {stat.label}
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                {stat.value}
                            </div>
                            {stat.sublabel && (
                                <div className="text-xs text-gray-500 truncate">
                                    {stat.sublabel}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsGrid;