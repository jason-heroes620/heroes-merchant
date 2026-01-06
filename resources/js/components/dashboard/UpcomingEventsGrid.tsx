import React from "react";
import { CalendarClock, Eye, Calendar, MapPin } from "lucide-react";
import type { EventType } from "../../types/events";

interface Props {
    events: EventType[];
    userRole: "admin" | "merchant";
    onEventClick: (eventId: number) => void;
}

const UpcomingEventsGrid: React.FC<Props> = ({
    events,
    userRole,
    onEventClick,
}) => {
    const displayEvents = events.slice(0, 3);

    const getEventDateTimeDisplay = (event: EventType) => {
        const now = new Date();

        if (!event.is_recurring) {
            const date = event.dates?.[0];
            const slot = event.slots?.[0];
            if (!date || !slot) return "";
            return `${new Date(date.start_date).toLocaleDateString("en-US", {
                timeZone: "Asia/Kuala_Lumpur",
            })} • ${slot.start_time} - ${slot.end_time}`;
        }

        if (!event.slots || event.slots.length === 0) return "";

        const upcoming = event.slots
            .map((slot) => {
                try {
                    const base = new Date(slot.date);
                    const [h, m] = slot.end_time.split(":");
                    const slotEnd = new Date(base);
                    slotEnd.setHours(Number(h), Number(m), 0, 0);
                    const [sh, sm] = slot.start_time.split(":");
                    const slotStart = new Date(base);
                    slotStart.setHours(Number(sh), Number(sm), 0, 0);
                    return { ...slot, slotStart, slotEnd };
                } catch {
                    return null;
                }
            })
            .filter((slot) => slot && slot.slotEnd >= now) as any[];

        if (!upcoming.length) return "";
        upcoming.sort((a, b) => a.slotEnd.getTime() - b.slotEnd.getTime());

        const next = upcoming[0];
        return `${next.slotStart.toLocaleDateString("en-US", {
            timeZone: "Asia/Kuala_Lumpur",
        })} • ${next.start_time} - ${next.end_time}`;
    };

    const handleNavigate = (eventId: number) => {
        const path =
            userRole === "admin"
                ? `/admin/events/${eventId}`
                : `/merchant/events/${eventId}`;
        onEventClick(eventId);
        console.log("Navigate to:", path);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <CalendarClock className="text-orange-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Upcoming Events
                        </h2>
                        <p className="text-sm text-gray-500">
                            {events?.length ?? 0} active events
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-6">
                {displayEvents.length > 0 ? (
                    displayEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => handleNavigate(Number(event.id))}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-xl hover:border-orange-300 hover:scale-105 transition-all cursor-pointer group"
                        >
                            <div className="relative h-70 bg-linear-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                                {event.media?.[0] ? (
                                    <img
                                        src={`/storage/${event.media[0].file_path}`}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <CalendarClock
                                        size={40}
                                        className="text-white opacity-50"
                                    />
                                )}
                            </div>

                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-900 line-clamp-2 flex-1">
                                    {event.title}
                                </h3>
                                <Eye
                                    className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                                    size={18}
                                />
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar
                                        size={14}
                                        className="text-orange-500 shrink-0"
                                    />
                                    <span className="truncate">
                                        {getEventDateTimeDisplay(event)}
                                    </span>
                                </div>
                                {event.location?.location_name && (
                                    <div className="flex items-center gap-2">
                                        <MapPin
                                            size={14}
                                            className="text-orange-500 shrink-0"
                                        />
                                        <span className="truncate">
                                            {event.location.location_name}
                                        </span>
                                    </div>
                                )}
                                {event.is_recurring ? (
                                    <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold uppercase">
                                        All Ages
                                    </span>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {event.age_groups?.map((group) => (
                                            <span
                                                key={group.id}
                                                className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold uppercase"
                                            >
                                                {group.label} {group.min_age}-
                                                {group.max_age}
                                            </span>
                                        )) ?? null}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                        <CalendarClock
                            className="mx-auto mb-3 text-gray-400"
                            size={48}
                        />
                        <p className="text-lg font-semibold text-gray-900 mb-1">
                            No active events
                        </p>
                        <p className="text-sm">
                            Create your first event to get started
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingEventsGrid;
