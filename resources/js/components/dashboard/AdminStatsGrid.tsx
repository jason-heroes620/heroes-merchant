import React from "react";
import {
    CalendarClock,
    Clock,
    Users,
    ShoppingCart,
    CreditCard,
    TrendingUp,
    AlertCircle,
} from "lucide-react";
import FilterButton from "../../components/dashboard/FilterButton";

interface StatsGridProps {
    stats: {
        activeEvents: number;
        pendingEvents: number;
        newSignups7: number;
        newSignups30: number;
        totalPurchasesRm: number;
        totalBookings: number;
        totalFreeCredits: number;
        totalPaidCredits: number;
        payoutPending: number;
        payoutPaid: number;
        payoutTotal: number;
        netEarnings: number;
    };
    signupFilter: 7 | 30;
    onSignupFilterChange: (filter: 7 | 30) => void;
    onEventsClick: () => void;
    onPendingEventsClick: () => void;
    onBookingsClick: () => void;
    onPayoutsClick: () => void;
}

export const AdminStatsGrid: React.FC<StatsGridProps> = ({
    stats,
    signupFilter,
    onSignupFilterChange,
    onEventsClick,
    onPendingEventsClick,
    onBookingsClick,
    onPayoutsClick,
}) => {
    return (
        <>
            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Active Events */}
                <div
                    onClick={onEventsClick}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-green-100 p-3 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                            <CalendarClock
                                className="text-green-600"
                                size={24}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Active Events
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {stats.activeEvents}
                        </p>
                        <p className="text-sm text-gray-500">Live events</p>
                    </div>
                </div>

                {/* Pending Events */}
                <div
                    onClick={onPendingEventsClick}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-yellow-100 p-3 rounded-lg mb-4 group-hover:bg-yellow-200 transition-colors">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Pending Approval
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {stats.pendingEvents}
                        </p>
                        <p className="text-sm text-gray-500">Awaiting review</p>
                    </div>
                </div>

                {/* New Signups */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 p-3 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                New Signups
                            </div>
                            <div className="flex gap-1">
                                <FilterButton
                                    active={signupFilter === 7}
                                    onClick={() => onSignupFilterChange(7)}
                                    className="text-xs px-2 py-1"
                                >
                                    7d
                                </FilterButton>
                                <FilterButton
                                    active={signupFilter === 30}
                                    onClick={() => onSignupFilterChange(30)}
                                    className="text-xs px-2 py-1"
                                >
                                    30d
                                </FilterButton>
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {signupFilter === 7
                                ? stats.newSignups7
                                : stats.newSignups30}
                        </p>
                        <p className="text-sm text-gray-500">
                            Last {signupFilter} days
                        </p>
                    </div>
                </div>

                {/* Total Bookings */}
                <div
                    onClick={onBookingsClick}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-purple-100 p-3 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
                            <ShoppingCart
                                className="text-purple-600"
                                size={24}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Total Bookings
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {stats.totalBookings.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                            Free: {stats.totalFreeCredits.toLocaleString()} •
                            Paid: {stats.totalPaidCredits.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Financial Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Customer Purchases */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-green-100 p-3 rounded-lg mb-4">
                            <CreditCard className="text-green-600" size={24} />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Customer Purchases
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            RM{" "}
                            {stats.totalPurchasesRm.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                </div>

                {/* Pending Payouts */}
                <div
                    onClick={onPayoutsClick}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-orange-100 p-3 rounded-lg mb-4 group-hover:bg-orange-200 transition-colors">
                            <AlertCircle
                                className="text-orange-600"
                                size={24}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Total Payouts
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            RM{" "}
                            {stats.payoutTotal.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        {/* <p className="text-sm text-gray-500">To process</p> */}
                    </div>
                </div>

                {/* Net Earnings */}
                <div className="bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-white/20 p-3 rounded-lg mb-4 backdrop-blur-sm">
                            <TrendingUp className="text-white" size={24} />
                        </div>
                        <div className="text-sm font-semibold text-green-100 uppercase tracking-wide mb-2">
                            Net Platform Earnings
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            RM{" "}
                            {stats.netEarnings.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        <p className="text-sm text-green-100">
                            Revenue - Merchant Payouts
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminStatsGrid;
