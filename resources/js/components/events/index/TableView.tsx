import { Calendar, MapPin, Eye, Edit, BadgeX, Star } from "lucide-react";
import { router } from "@inertiajs/react";
import type { EventType, EventDate, EventSlot } from "../../../types/events";

interface TableViewProps {
    filteredEvents: EventType[];
    statusColors: Record<
        string,
        {
            bg: string;
            text: string;
            icon: React.ComponentType<{ size?: number }>;
        }
    >;
    getEventTypeLabel: (type: string) => string;
    userRole: string;
    formatDate: (date: string) => string;
    formatTime: (time: string) => string;
    router: typeof router;
    handleDeactivate: (id: string) => void;
}

export default function TableView({
    filteredEvents,
    statusColors,
    getEventTypeLabel,
    userRole,
    formatDate,
    formatTime,
    router,
    handleDeactivate,
}: TableViewProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-linear-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                        <tr>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Event
                            </th>
                            <th className="px-15 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Age Groups
                            </th>
                            <th className="px-16 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                Upcoming Dates
                            </th>

                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredEvents.map((event) => {
                            const statusKey =
                                event.status as keyof typeof statusColors;
                            const StatusIcon = statusColors[statusKey]?.icon;
                            const statusStyle =
                                statusColors[statusKey] || statusColors.draft;

                            return (
                                <tr
                                    key={event.id}
                                    className="hover:bg-orange-50/30 transition-colors"
                                >
                                    {/* Event Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                {event.media?.[0] ? (
                                                    <img
                                                        src={
                                                            event.media[0]
                                                                .file_path
                                                        }
                                                        alt={event.title}
                                                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 bg-linear-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                                                        <Calendar className="h-8 w-8 text-white" />
                                                    </div>
                                                )}
                                                {event.featured && (
                                                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                                                        <Star
                                                            size={12}
                                                            className="text-yellow-900"
                                                            fill="currentColor"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {event.category}
                                                </p>

                                                {userRole === "admin" && (
                                                    <div className="pt-1 space-y-0.5">
                                                        <p className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                                                            <span className="font-semibold text-gray-900">
                                                                {event.merchant
                                                                    ?.company_name ??
                                                                    "No Merchant"}
                                                            </span>
                                                        </p>

                                                        <p className="text-[10px] text-gray-400 tracking-wide">
                                                            {event.merchant?.id}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Type Column */}
                                    <td className="px-6 py-4">
                                        <span className="inline-block items-center px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                            {getEventTypeLabel(event.type)}
                                        </span>
                                    </td>

                                    {/* Location Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                                            <MapPin
                                                size={14}
                                                className="text-orange-500 shrink-0 mt-0.5"
                                            />
                                            <div className="truncate">
                                                <p className="font-medium truncate">
                                                    {event.location
                                                        ?.location_name ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Age Groups Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {event.is_suitable_for_all_ages ? (
                                                <span className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                                    All Ages
                                                </span>
                                            ) : event.age_groups &&
                                              event.age_groups.length > 0 ? (
                                                event.age_groups.map(
                                                    (group, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                                                        >
                                                            {group.label &&
                                                                `${group.label}`}
                                                            {group.min_age !=
                                                                null &&
                                                                group.max_age !=
                                                                    null &&
                                                                ` (${group.min_age}-${group.max_age})`}
                                                        </span>
                                                    )
                                                )
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No age groups
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Upcoming Dates Column */}
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {(
                                                (event.is_recurring
                                                    ? event.slots
                                                    : event.dates) ?? []
                                            ).length > 0 ? (
                                                (
                                                    (event.is_recurring
                                                        ? event.slots
                                                        : event.dates) ?? []
                                                ).map(
                                                    (
                                                        slot:
                                                            | EventSlot
                                                            | EventDate,
                                                        idx: number
                                                    ) => {
                                                        // Date display
                                                        const dateDisplay =
                                                            "start_date" in
                                                                slot &&
                                                            slot.start_date
                                                                ? slot.start_date ===
                                                                  slot.end_date
                                                                    ? formatDate(
                                                                          slot.start_date
                                                                      )
                                                                    : `${formatDate(
                                                                          slot.start_date
                                                                      )} - ${formatDate(
                                                                          slot.end_date
                                                                      )}`
                                                                : "date" in
                                                                      slot &&
                                                                  slot.date
                                                                ? formatDate(
                                                                      slot.date
                                                                  )
                                                                : "Date TBD";

                                                        // Time display (works for both EventSlot and EventDate)
                                                        const timeDisplay =
                                                            "start_time" in
                                                                slot &&
                                                            slot.start_time
                                                                ? ` • ${formatTime(
                                                                      slot.start_time
                                                                  )}${
                                                                      slot.end_time
                                                                          ? ` - ${formatTime(
                                                                                slot.end_time
                                                                            )}`
                                                                          : ""
                                                                  }`
                                                                : "";

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {
                                                                        dateDisplay
                                                                    }
                                                                </span>
                                                                {timeDisplay && (
                                                                    <span className="text-xs text-gray-400">
                                                                        {
                                                                            timeDisplay
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    No upcoming dates
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status Column */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} px-3 py-1 rounded-full text-xs font-bold`}
                                        >
                                            <StatusIcon size={12} />
                                            {event.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                event.status.slice(1)}
                                        </span>
                                    </td>

                                    {/* Actions Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        userRole === "admin"
                                                            ? `/admin/events/${event.id}`
                                                            : `/merchant/events/${event.id}`
                                                    )
                                                }
                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {userRole === "merchant" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/merchant/events/${event.id}/edit`
                                                            )
                                                        }
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    {event.status ===
                                                        "active" && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeactivate(
                                                                    event.id
                                                                )
                                                            }
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                            title="Deactivate"
                                                        >
                                                            <BadgeX size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
