import React from "react";
import { Trophy, TrendingUp, MapPin } from "lucide-react";

interface Event {
    id: number;
    title: string;
    bookings_count: number;
    merchant: {
        user: {
            full_name: string;
        };
    };
    media?: Array<{ file_path: string }>;
    location?: {
        location_name: string;
    };
}

interface Props {
    events: Event[];
    onEventClick: (id: number) => void;
}

export const TopPerformingEvents: React.FC<Props> = ({
    events,
    onEventClick,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                        <Trophy className="text-yellow-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Top Performing Events
                        </h2>
                        <p className="text-sm text-gray-500">
                            Most popular events by bookings
                        </p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {events.length > 0 ? (
                    events.map((event, index) => (
                        <div
                            key={event.id}
                            onClick={() => onEventClick(event.id)}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank Badge */}
                                <div
                                    className={`
                                    flex items-center justify-center w-10 h-10 rounded-full font-bold
                                    ${
                                        index === 0
                                            ? "bg-yellow-100 text-yellow-700"
                                            : ""
                                    }
                                    ${
                                        index === 1
                                            ? "bg-gray-100 text-gray-700"
                                            : ""
                                    }
                                    ${
                                        index === 2
                                            ? "bg-orange-100 text-orange-700"
                                            : ""
                                    }
                                    ${
                                        index > 2
                                            ? "bg-blue-100 text-blue-700"
                                            : ""
                                    }
                                `}
                                >
                                    #{index + 1}
                                </div>

                                {/* Event Image */}
                                {event.media?.[0] ? (
                                    <img
                                        src={`/storage/${event.media[0].file_path}`}
                                        alt={event.title}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-linear-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                                        <Trophy
                                            className="text-white"
                                            size={24}
                                        />
                                    </div>
                                )}

                                {/* Event Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        by {event.merchant.user.full_name}
                                    </p>
                                    {event.location && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <MapPin size={12} />
                                            <span className="truncate">
                                                {event.location.location_name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Booking Count */}
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                                        <TrendingUp size={18} />
                                        {event.bookings_count}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        bookings
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center">
                        <Trophy
                            className="mx-auto text-gray-400 mb-3"
                            size={40}
                        />
                        <p className="text-gray-600">No event data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopPerformingEvents;
