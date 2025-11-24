import { useState } from "react";
import type { PageProps } from "../../types/index";
import { usePage, router } from "@inertiajs/react";
import {
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Eye,
    Edit,
    BadgeX,
    Plus,
    Search,
    Filter,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Star,
    TrendingUp,
    Grid3x3,
    List,
} from "lucide-react";
import type {
    Location,
    AgeGroup,
    Price,
    Slot,
    Media,
} from "../../types/events";

interface EventType {
    id: string;
    title: string;
    type: string;
    category?: string;
    status: string;
    featured: boolean;
    location?: Location;
    default_capacity?: number;
    is_unlimited_capacity: boolean;
    media?: Media[];
    is_suitable_for_all_ages: boolean;
    age_groups?: AgeGroup[];
    prices?: Price[];
    slots?: Slot[];
    created_at: string;
    like_count?: number;
    click_count?: number;
}

interface EventsProps extends PageProps {
    events: {
        data: EventType[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    role: string;
}

export default function EventsIndexPage() {
    const { props } = usePage<EventsProps>();
    const { events, role: userRole } = props;

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const statusColors = {
        active: {
            bg: "bg-green-100",
            text: "text-green-800",
            icon: CheckCircle,
        },
        pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
        inactive: { bg: "bg-gray-100", text: "text-gray-800", icon: BadgeX },
        rejected: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
        draft: { bg: "bg-blue-100", text: "text-blue-800", icon: AlertCircle },
    } as const;

    const filteredEvents = events.data.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || event.status === statusFilter;
        const matchesType = typeFilter === "all" || event.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
        };
        return labels[type] || type;
    };

    const formatPrice = (price?: Price) => {
        if (!price) return "Free";

        const format = (value?: number | null) =>
            value != null ? `RM ${(value / 100).toFixed(2)}` : "Free";

        switch (price.pricing_type) {
            case "fixed":
                return `RM ${(price.fixed_price_in_cents ?? 0) / 100}`;

            case "age_based":
                return `Children RM ${
                    (price.weekday_price_in_cents ?? 0) / 100
                } / Adult RM ${(price.fixed_price_in_cents ?? 0) / 100}`;

            case "day_type":
                const weekdayPrice = format(price.weekday_price_in_cents);
                const weekendPrice = format(price.weekend_price_in_cents);
                return `Weekday ${weekdayPrice} / Weekend ${weekendPrice}`;

            case "mixed":
                return `Children RM ${
                    (price.weekday_price_in_cents ?? 0) / 100
                } (Weekday) / RM ${
                    (price.weekend_price_in_cents ?? 0) / 100
                } (Weekend)
Adult RM ${(price.fixed_price_in_cents ?? 0) / 100} (Weekday) / RM ${
                    (price.weekend_price_in_cents ?? 0) / 100
                } (Weekend)`;
            default:
                return "Free";
        }
    };

    const getUpcomingDates = (slots?: Slot[]) => {
        if (!slots || slots.length === 0) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return slots
            .filter((slot) => new Date(slot.date) >= today)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, 3);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return "";
        const [hours, minutes] = timeString.split(":");
        return `${hours}:${minutes}`;
    };

    const handleDeactivate = (id: string) => {
        if (
            !confirm(
                "Are you sure you want to deactivate this event? This action cannot be undone."
            )
        )
            return;

        router.post(
            `/merchant/events/${id}/deactivate`,
            {},
            {
                onSuccess: () => {
                    alert("Event deactivated successfully!");
                },
                onError: (errors) => {
                    console.error(errors);
                    alert("Failed to deactivate event.");
                },
            }
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    {userRole === "admin"
                                        ? "All Events"
                                        : "My Events"}
                                </h1>
                                <p className="text-orange-50 text-lg">
                                    {userRole === "admin"
                                        ? "Manage and review all events on the platform"
                                        : "Manage your events and programs"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* View Toggle */}
                                <div className="flex bg-white rounded-xl p-1 shadow-lg">
                                    <button
                                        onClick={() => setViewMode("table")}
                                        className={`px-4 py-2 rounded-lg transition-all ${
                                            viewMode === "table"
                                                ? "bg-orange-500 text-white"
                                                : "text-gray-600 hover:bg-orange-50"
                                        }`}
                                    >
                                        <List size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`px-4 py-2 rounded-lg transition-all ${
                                            viewMode === "grid"
                                                ? "bg-orange-500 text-white"
                                                : "text-gray-600 hover:bg-orange-50"
                                        }`}
                                    >
                                        <Grid3x3 size={20} />
                                    </button>
                                </div>

                                {userRole === "merchant" && (
                                    <button
                                        onClick={() =>
                                            router.visit(
                                                "/merchant/events/create"
                                            )
                                        }
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        <Plus size={20} />
                                        Create Event
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        <div className="relative">
                            <Filter
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                                <option value="rejected">Rejected</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="event">Events</option>
                            <option value="trial_class">Trial Classes</option>
                            <option value="location_based">Field Trips</option>
                        </select>
                    </div>
                </div>

                {/* Events Display */}
                {filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            No events found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ||
                            statusFilter !== "all" ||
                            typeFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Create your first event to get started"}
                        </p>
                        {userRole === "merchant" && (
                            <button
                                onClick={() =>
                                    router.visit("/merchant/events/create")
                                }
                                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all"
                            >
                                <Plus size={20} />
                                Create Event
                            </button>
                        )}
                    </div>
                ) : viewMode === "table" ? (
                    /* Table View */
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Event
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Age Groups
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Upcoming Dates
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Capacity
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEvents.map((event) => {
                                        const statusKey =
                                            event.status as keyof typeof statusColors;
                                        const StatusIcon =
                                            statusColors[statusKey]?.icon;
                                        const statusStyle =
                                            statusColors[statusKey] ||
                                            statusColors.draft;
                                        const upcomingDates = getUpcomingDates(
                                            event.slots
                                        );

                                        return (
                                            <tr
                                                key={event.id}
                                                className="hover:bg-orange-50/30 transition-colors"
                                            >
                                                {/* Event Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            {event
                                                                .media?.[0] ? (
                                                                <img
                                                                    src={
                                                                        event
                                                                            .media[0]
                                                                            .file_path
                                                                    }
                                                                    alt={
                                                                        event.title
                                                                    }
                                                                    className="w-20 h-20 object-cover rounded-lg shadow-md"
                                                                />
                                                            ) : (
                                                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                                                                    <Calendar className="h-8 w-8 text-white" />
                                                                </div>
                                                            )}
                                                            {event.featured && (
                                                                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                                                                    <Star
                                                                        size={
                                                                            12
                                                                        }
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
                                                            {event.like_count ||
                                                            event.click_count ? (
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <TrendingUp
                                                                            size={
                                                                                12
                                                                            }
                                                                        />
                                                                        {event.click_count ||
                                                                            0}{" "}
                                                                        views
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type Column */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                                        {getEventTypeLabel(
                                                            event.type
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Location Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                                                        <MapPin
                                                            size={14}
                                                            className="text-orange-500 flex-shrink-0 mt-0.5"
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
                                                          event.age_groups
                                                              .length > 0 ? (
                                                            event.age_groups.map(
                                                                (
                                                                    group,
                                                                    idx
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            idx
                                                                        }
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
                                                        {upcomingDates.length >
                                                        0 ? (
                                                            upcomingDates.map(
                                                                (slot, idx) => {
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <span className="text-xs font-medium text-gray-700">
                                                                                {formatDate(
                                                                                    slot.date
                                                                                )}
                                                                            </span>
                                                                            <span className="text-xs text-gray-400">
                                                                                {formatTime(
                                                                                    slot.start_time
                                                                                )}{" "}
                                                                                -{" "}
                                                                                {formatTime(
                                                                                    slot.end_time
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-gray-400">
                                                                No upcoming
                                                                dates
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Capacity Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users
                                                            size={14}
                                                            className="text-orange-500"
                                                        />
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {event.default_capacity ||
                                                                "∞"}
                                                        </span>
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
                                                            event.status.slice(
                                                                1
                                                            )}
                                                    </span>
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                router.visit(
                                                                    userRole ===
                                                                        "admin"
                                                                        ? `/admin/events/${event.id}`
                                                                        : `/merchant/events/${event.id}`
                                                                )
                                                            }
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="View"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        {userRole ===
                                                            "merchant" && (
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
                                                                    <Edit
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
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
                                                                        <BadgeX
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
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
                ) : (
                    /* Grid View - Compact Cards */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => {
                            const statusKey =
                                event.status as keyof typeof statusColors;
                            const StatusIcon = statusColors[statusKey]?.icon;
                            const statusStyle =
                                statusColors[statusKey] || statusColors.draft;
                            const upcomingDates = getUpcomingDates(event.slots);

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-400">
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
                                            {event.status
                                                .charAt(0)
                                                .toUpperCase() +
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

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin
                                                    size={16}
                                                    className="text-orange-500 flex-shrink-0"
                                                />
                                                <span className="truncate">
                                                    {
                                                        event.location
                                                            ?.location_name
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <DollarSign
                                                    size={16}
                                                    className="text-orange-500 flex-shrink-0"
                                                />
                                                <span>
                                                    {formatPrice(
                                                        event.prices?.[0]
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users
                                                    size={16}
                                                    className="text-orange-500 flex-shrink-0"
                                                />
                                                <span>
                                                    Capacity:{" "}
                                                    {event.default_capacity ||
                                                        "Unlimited"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Upcoming Dates */}
                                        {upcomingDates.length > 0 && (
                                            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                <p className="text-xs font-semibold text-orange-800 mb-2">
                                                    Upcoming:
                                                </p>
                                                <div className="space-y-1">
                                                    {upcomingDates.map(
                                                        (slot, idx) => (
                                                            <p
                                                                key={idx}
                                                                className="text-xs text-gray-700"
                                                            >
                                                                {formatDate(
                                                                    slot.date
                                                                )}{" "}
                                                                •{" "}
                                                                {
                                                                    slot.start_time
                                                                }
                                                            </p>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Age Groups */}
                                        {event.age_groups &&
                                            event.age_groups.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {event.age_groups
                                                        .slice(0, 2)
                                                        .map((group, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium"
                                                            >
                                                                {group.label}
                                                                {group.min_age !=
                                                                    null &&
                                                                    group.max_age !=
                                                                        null &&
                                                                    ` (${group.min_age}-${group.max_age})`}
                                                            </span>
                                                        ))}
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
                                                    {event.status ===
                                                        "active" && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeactivate(
                                                                    event.id
                                                                )
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
                )}

                {/* Pagination */}
                {events.links.length > 3 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        {events.links.map((link, index) =>
                            link.url ? (
                                <button
                                    key={index}
                                    onClick={() => router.get(link.url!)}
                                    disabled={link.active}
                                    className={`px-4 py-2 border-2 rounded-lg transition-all font-medium ${
                                        link.active
                                            ? "bg-orange-500 text-white border-orange-500"
                                            : "bg-white border-gray-200 hover:border-orange-500 hover:text-orange-600"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label.replace(
                                            /&laquo;|&raquo;/g,
                                            (match) =>
                                                match === "&laquo;" ? "←" : "→"
                                        ),
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="px-4 py-2 text-gray-400 cursor-not-allowed"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label.replace(
                                            /&laquo;|&raquo;/g,
                                            (match) =>
                                                match === "&laquo;" ? "←" : "→"
                                        ),
                                    }}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
