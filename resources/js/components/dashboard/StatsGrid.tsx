import React from "react";
import { CalendarClock, Users, Sparkles, Clock } from "lucide-react";

interface Props {
    activeEvents: number;
    todayBookings: number;
    attendeesToday: number;
    availablePayouts: number;
    pendingPayouts: number;
    onEventsClick: () => void;
    onBookingsClick: () => void;
    onPayoutClick: () => void;
}

const StatsGrid: React.FC<Props> = ({
    activeEvents,
    todayBookings,
    attendeesToday,
    availablePayouts,
    pendingPayouts,
    onEventsClick,
    onBookingsClick,
    onPayoutClick,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Events */}
            <div
                onClick={onEventsClick}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-orange-100 p-3 rounded-lg mb-4 group-hover:bg-orange-200 transition-colors">
                        <CalendarClock className="text-orange-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Active Events
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {activeEvents}
                    </p>
                    <p className="text-sm text-gray-500">
                        {activeEvents} this week
                    </p>
                </div>
            </div>

            {/* Today's Bookings */}
            <div
                onClick={onBookingsClick}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-green-100 p-3 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                        <Users className="text-green-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Today's Bookings
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        {todayBookings}
                    </p>
                    <p className="text-sm text-gray-500">
                        {attendeesToday} attendees
                    </p>
                </div>
            </div>

            {/* Available Payouts */}
            <div
                onClick={onPayoutClick}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-100 p-3 rounded-lg mb-4 group-hover:bg-yellow-200 transition-colors">
                        <Sparkles className="text-yellow-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Available to Claim
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        RM {availablePayouts.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Ready for payout</p>
                </div>
            </div>

            {/* Pending Payouts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-lg mb-4">
                        <Clock className="text-blue-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Pending Payouts
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        RM {pendingPayouts.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Processing</p>
                </div>
            </div>
        </div>
    );
};

export default StatsGrid;
