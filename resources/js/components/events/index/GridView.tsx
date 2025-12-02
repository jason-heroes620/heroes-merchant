import { Calendar, MapPin, DollarSign, Eye, Edit, BadgeX } from "lucide-react";
import type {
    EventType,
    AgeGroup,
    EventSlot,
    EventDate,
    EventSlotPrice,
} from "../../../types/events";
import { router } from "@inertiajs/react";

interface GridViewProps {
    userRole: string;
    router: typeof router;
    statusColors: Record<
        string,
        {
            bg: string;
            text: string;
            icon: React.ComponentType<{ size?: number }>;
        }
    >;
    filteredEvents: EventType[];
    handleDeactivate: (id: string) => void;
    getEventTypeLabel: (type: string) => string;
    getPriceRange: (
        slots?: EventSlotPrice[],
        userRole?: "admin" | "merchant",
        eventStatus?: string
    ) => React.ReactNode | string;
    getFrequencyLabel: (event?: any) => string;
    formatDate: (date: string) => string;
    formatTime: (time: string) => string;
}

export default function GridView({
    userRole,
    router,
    statusColors,
    filteredEvents,
    handleDeactivate,
    getEventTypeLabel,
    getPriceRange,
    getFrequencyLabel,
    formatDate,
    formatTime,
}: GridViewProps) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
                const statusKey = event.status as keyof typeof statusColors;
                const StatusIcon = statusColors[statusKey]?.icon;
                const statusStyle =
                    statusColors[statusKey] || statusColors.draft;

                return (
                    <div
                        key={event.id}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                    >
                        {/* Image */}
                        <div className="relative h-48 bg-linear-to-br from-orange-400 to-red-400">
                            {event.media?.[0] ? (
                                <img
                                    src={event.media[0].file_path}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Calendar className="h-20 w-20 text-white opacity-50" />
                                </div>
                            )}
                            {event.featured && (
                                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    ⭐ Featured
                                </div>
                            )}
                            <div
                                className={`absolute top-3 left-3 ${statusStyle.bg} ${statusStyle.text} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}
                            >
                                <StatusIcon size={12} />
                                {event.status.charAt(0).toUpperCase() +
                                    event.status.slice(1)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                    {getEventTypeLabel(event.type)}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {event.title}
                            </h3>

                            {userRole === "admin" && (
                                <>
                                    <div className="text-sm font-medium">
                                        {event.merchant?.company_name ??
                                            "No Merchant"}
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {event.merchant?.id}
                                    </div>
                                </>
                            )}

                            {/* Age Groups */}
                            <div className="space-y-2 my-4">
                                {event.is_suitable_for_all_ages ? (
                                    <span className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                        All Ages
                                    </span>
                                ) : event.age_groups &&
                                  event.age_groups.length > 0 ? (
                                    event.age_groups.map(
                                        (group: AgeGroup, idx: number) => (
                                            <span
                                                key={idx}
                                                className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                                            >
                                                {group.label &&
                                                    `${group.label}`}
                                                {group.min_age != null &&
                                                    group.max_age != null &&
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

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin
                                        size={16}
                                        className="text-orange-500 shrink-0"
                                    />
                                    <span className="truncate">
                                        {event.location?.location_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <DollarSign
                                        size={16}
                                        className="text-orange-500 shrink-0"
                                    />
                                    <span>
                                        {getPriceRange(
                                            event.slotPrices,
                                            userRole as "admin" | "merchant",
                                            event.status
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Upcoming Dates */}
                            {(
                                (event.is_recurring
                                    ? event.slots
                                    : event.dates) ?? []
                            ).length > 0 && (
                                <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200 text-sm text-gray-600">
                                    {/* Frequency label */}
                                    <p className="text-xs font-semibold text-orange-800 mb-2">
                                        {getFrequencyLabel(event)}
                                    </p>

                                    <div className="space-y-1">
                                        {(
                                            (event.is_recurring
                                                ? event.slots
                                                : event.dates) ?? []
                                        )
                                            .slice(0, 3)
                                            .map(
                                                (
                                                    slot: EventSlot | EventDate,
                                                    idx: number
                                                ) => {
                                                    const dateDisplay =
                                                        "start_date" in slot &&
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
                                                            : "date" in slot &&
                                                              slot.date
                                                            ? formatDate(
                                                                  slot.date
                                                              )
                                                            : "Date TBD";

                                                    const timeDisplay =
                                                        "start_time" in slot &&
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
                                                        <p
                                                            key={idx}
                                                            className="text-xs text-gray-700"
                                                        >
                                                            {dateDisplay}
                                                            {timeDisplay}
                                                        </p>
                                                    );
                                                }
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() =>
                                        router.visit(
                                            userRole === "admin"
                                                ? `/admin/events/${event.id}`
                                                : `/merchant/events/${event.id}`
                                        )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all font-medium"
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                {userRole === "merchant" && (
                                    <>
                                        <button
                                            onClick={() =>
                                                router.visit(
                                                    `/merchant/events/${event.id}/edit`
                                                )
                                            }
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        {event.status === "active" && (
                                            <button
                                                onClick={() =>
                                                    handleDeactivate(event.id)
                                                }
                                                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                                                title="Deactivate"
                                            >
                                                <BadgeX size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
