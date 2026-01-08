import React from "react";
import { CalendarClock, BarChart3, Wallet } from "lucide-react";

interface Props {
    activeEventsCount: number;
    pastEventsCount: number;
    onCreateEvent: () => void;
    onViewEvents: () => void;
    onViewPayouts: () => void;
}

const QuickActions: React.FC<Props> = ({
    activeEventsCount,
    pastEventsCount,
    onCreateEvent,
    onViewEvents,
    onViewPayouts,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
                onClick={onCreateEvent}
                className="bg-linear-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
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
                onClick={onViewEvents}
                className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
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

            <button
                onClick={onViewPayouts}
                className="bg-linear-to-br from-green-500 to-green-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-xl font-bold mb-1">
                            View Payouts
                        </div>
                        <div className="text-green-100 text-sm">
                            Track your earnings
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Wallet size={28} />
                    </div>
                </div>
            </button>
        </div>
    );
};

export default QuickActions;