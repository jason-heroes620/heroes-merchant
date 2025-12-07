import React from "react";
import { CalendarClock, CreditCard, BarChart3 } from "lucide-react";

interface Props {
    availablePayouts: number;
    activeEventsCount: number;
    pastEventsCount: number;
    onCreateEvent: () => void;
    onRequestPayout: () => void;
    onViewEvents: () => void;
}

const QuickActions: React.FC<Props> = ({
    availablePayouts,
    activeEventsCount,
    pastEventsCount,
    onCreateEvent,
    onRequestPayout,
    onViewEvents,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
                onClick={onCreateEvent}
                className="bg-linear-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-orange-100 mb-2">
                            Quick Action
                        </div>
                        <div className="text-xl font-bold mb-1">
                            Create New Event
                        </div>
                        <div className="text-orange-100 text-sm">
                            Start earning more today
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <CalendarClock size={28} />
                    </div>
                </div>
            </button>

            <button
                onClick={onRequestPayout}
                className="bg-linear-to-br from-yellow-400 to-yellow-500 text-yellow-900 rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-yellow-800 mb-2">
                            Available Now
                        </div>
                        <div className="text-xl font-bold mb-1">
                            Request Payout
                        </div>
                        <div className="text-yellow-800 text-sm">
                            RM {availablePayouts.toFixed(2)} ready
                        </div>
                    </div>
                    <div className="bg-white/30 p-3 rounded-lg group-hover:bg-white/40 transition-colors">
                        <CreditCard size={28} />
                    </div>
                </div>
            </button>

            <button
                onClick={onViewEvents}
                className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-purple-100 mb-2">
                            Manage
                        </div>
                        <div className="text-xl font-bold mb-1">
                            View All Events
                        </div>
                        <div className="text-purple-100 text-sm">
                            {activeEventsCount + pastEventsCount} total events
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <BarChart3 size={28} />
                    </div>
                </div>
            </button>
        </div>
    );
};

export default QuickActions;
