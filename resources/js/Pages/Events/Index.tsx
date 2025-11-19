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
    Grid3x3,
    List,
    Repeat,
    Infinity,
    Sun,
} from "lucide-react";
import type {
    Location,
    AgeGroup,
    Price,
    Frequency,
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
    frequencies?: Frequency[];
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
    const [locationFilter, setLocationFilter] = useState("all");
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

    const uniqueLocations = Array.from(
        new Set(
            events.data.map((e) => e.location?.location_name).filter(Boolean)
        )
    );

    const filteredEvents = events.data.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "all" || event.status === statusFilter;
        const matchesType = typeFilter === "all" || event.type === typeFilter;
        const matchesLocation =
            locationFilter === "all" ||
            event.location?.location_name === locationFilter;
        return matchesSearch && matchesStatus && matchesType && matchesLocation;
    });

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
        };
        return labels[type] || type;
    };

    const formatPrice = (prices?: Price[]) => {
        if (!prices || prices.length === 0) return "Free";

        const price = prices[0];

        const toRM = (cents?: number | null) =>
            cents != null && cents > 0 ? `RM${(cents / 100).toFixed(0)}` : null;

        switch (price.pricing_type) {
            case "fixed":
                return toRM(price.fixed_price_in_cents) || "Free";

            case "age_based": {
                const child = toRM(price.weekday_price_in_cents);
                const adult = toRM(price.fixed_price_in_cents);
                if (child && adult)
                    return `${child} (Child) • ${adult} (Adult)`;
                return child || adult || "Free";
            }

            case "day_type": {
                const weekday = toRM(price.weekday_price_in_cents);
                const weekend = toRM(price.weekend_price_in_cents);
                if (weekday && weekend)
                    return `${weekday} (Weekday) • ${weekend} (Weekend)`;
                return weekday || weekend || "Free";
            }

            case "mixed": {
                const parts: string[] = [];
                if (price.weekday_price_in_cents) {
                    parts.push(`Child: ${toRM(price.weekday_price_in_cents)}`);
                }
                if (price.weekend_price_in_cents) {
                    parts.push(`Adult: ${toRM(price.fixed_price_in_cents)}`);
                }
                return parts.length > 0 ? parts.join(" • ") : "Free";
            }

            default:
                return "Free";
        }
    };

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getScheduleInfo = (event: EventType) => {
        if (event.frequencies && event.frequencies.length > 0) {
            const freq = event.frequencies[0];

            const typeLabels: Record<string, string> = {
                one_time: "One-time",
                daily: "Daily",
                weekly: "Weekly",
                biweekly: "Bi-weekly",
                monthly: "Monthly",
                annually: "Annually",
                custom: "Custom",
            };

            const label = typeLabels[freq.type] ?? freq.type;

            // Convert numeric days_of_week to weekday labels
            const days =
                freq.days_of_week
                    ?.map((d) => weekdayLabels[d] ?? "")
                    ?.join(", ") ?? "";

            return {
                type: "frequency" as const,
                label: days ? `${label} (${days})` : label,
                details: freq.end_date
                    ? `${formatFullDate(freq.start_date)} - ${formatFullDate(
                          freq.end_date
                      )}`
                    : `${formatFullDate(freq.start_date)}`,
            };
        }

        // 2️⃣ Handle one-time slots
        if (event.slots && event.slots.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = event.slots
                .filter((slot) => new Date(slot.date) >= today)
                .sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .slice(0, 3);

            if (upcoming.length > 0) {
                return {
                    type: "slots" as const,
                    slots: upcoming,
                };
            }
        }

        return null;
    };

    const formatFullDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatTimeRange = (slot: Slot) => {
        if (slot.is_all_day) {
            return "All Day";
        }
        return `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;
    };

    const formatAgeGroup = (group: AgeGroup) => {
        if (group.min_age !== null && group.max_age !== null) {
            return `${group.label} (${group.min_age}-${group.max_age})`;
        }
        return group.label;
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
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg px-8 py-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                {userRole === "admin"
                                    ? "All Events"
                                    : "My Events"}
                            </h1>
                            <p className="text-orange-100">
                                {userRole === "admin"
                                    ? "Manage and review all events on the platform"
                                    : "Manage your events and programs"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-white rounded-lg p-1 shadow">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`p-2 rounded transition-all ${
                                        viewMode === "table"
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded transition-all ${
                                        viewMode === "grid"
                                            ? "bg-orange-500 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    <Grid3x3 size={18} />
                                </button>
                            </div>
                            {userRole === "merchant" && (
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-all shadow">
                                    <Plus size={18} />
                                    Create Event
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div className="relative">
                            <Filter
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
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
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="event">Events</option>
                            <option value="trial_class">Trial Classes</option>
                            <option value="location_based">Field Trips</option>
                        </select>
                        <div className="relative">
                            <MapPin
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <select
                                value={locationFilter}
                                onChange={(e) =>
                                    setLocationFilter(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Locations</option>
                                {uniqueLocations.map((location, idx) => (
                                    <option key={idx} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Events Display */}
                {filteredEvents.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-3" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            No events found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ||
                            statusFilter !== "all" ||
                            typeFilter !== "all" ||
                            locationFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Create your first event to get started"}
                        </p>
                        {userRole === "merchant" && (
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all">
                                <Plus size={18} />
                                Create Event
                            </button>
                        )}
                    </div>
                ) : viewMode === "table" ? (
                    /* Table View - Simplified with only essential columns */
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                            Event
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredEvents.map((event) => {
                                        const statusKey =
                                            event.status as keyof typeof statusColors;
                                        const StatusIcon =
                                            statusColors[statusKey]?.icon;
                                        const statusStyle =
                                            statusColors[statusKey] ||
                                            statusColors.draft;
                                        const scheduleInfo =
                                            getScheduleInfo(event);

                                        return (
                                            <tr
                                                key={event.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Event Column - More detailed */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-4">
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
                                                                    className="w-20 h-20 object-cover rounded-lg"
                                                                />
                                                            ) : (
                                                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                                                                    <Calendar className="h-8 w-8 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 mb-1">
                                                                {event.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                                                    {getEventTypeLabel(
                                                                        event.type
                                                                    )}
                                                                </span>
                                                                {event.category && (
                                                                    <span className="text-xs text-gray-500">
                                                                        •{" "}
                                                                        {
                                                                            event.category
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1">
                                                                <MapPin
                                                                    size={12}
                                                                    className="text-gray-400 flex-shrink-0 mt-0.5"
                                                                />
                                                                <span className="line-clamp-1">
                                                                    {event
                                                                        .location
                                                                        ?.location_name ||
                                                                        "N/A"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                {event.is_unlimited_capacity ? (
                                                                    <span className="flex items-center gap-1 text-gray-600">
                                                                        <Infinity
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="text-gray-400"
                                                                        />
                                                                        Unlimited Slots
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-gray-600">
                                                                        <Users
                                                                            size={
                                                                                12
                                                                            }
                                                                            className="text-gray-400"
                                                                        />
                                                                        {
                                                                            event.default_capacity
                                                                        }
                                                                    </span>
                                                                )}
                                                                {event.is_suitable_for_all_ages ? (
                                                                    <span className="text-gray-500">
                                                                        • All
                                                                        Ages
                                                                    </span>
                                                                ) : (
                                                                    event.age_groups &&
                                                                    event
                                                                        .age_groups
                                                                        .length >
                                                                        0 && (
                                                                        <span className="text-gray-500">
                                                                            •{" "}
                                                                            {event.age_groups
                                                                                .map(
                                                                                    (
                                                                                        g
                                                                                    ) =>
                                                                                        formatAgeGroup(
                                                                                            g
                                                                                        )
                                                                                )
                                                                                .join(
                                                                                    ", "
                                                                                )}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Schedule Column */}
                                                <td className="px-6 py-4">
                                                    {scheduleInfo ? (
                                                        scheduleInfo.type ===
                                                        "frequency" ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Repeat
                                                                        size={
                                                                            14
                                                                        }
                                                                        className="text-purple-500"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {
                                                                            scheduleInfo.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500">
                                                                    {
                                                                        scheduleInfo.details
                                                                    }
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {scheduleInfo.slots?.map(
                                                                    (
                                                                        slot,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-1.5">
                                                                                {slot.is_all_day && (
                                                                                    <Sun
                                                                                        size={
                                                                                            12
                                                                                        }
                                                                                        className="text-amber-500"
                                                                                    />
                                                                                )}
                                                                                <span className="text-sm font-medium text-gray-900">
                                                                                    {formatFullDate(
                                                                                        slot.date
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs text-gray-500">
                                                                                {formatTimeRange(
                                                                                    slot
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        )
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            No schedule
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Price Column */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatPrice(
                                                            event.prices
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status Column */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 rounded-md text-xs font-medium`}
                                                    >
                                                        <StatusIcon size={14} />
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
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="View"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        {userRole ===
                                                            "merchant" && (
                                                            <>
                                                                <button
                                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Edit"
                                                                >
                                                                    <Edit
                                                                        size={
                                                                            18
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
                                                                                18
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
                    /* Grid View */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredEvents.map((event) => {
                            const statusKey =
                                event.status as keyof typeof statusColors;
                            const StatusIcon = statusColors[statusKey]?.icon;
                            const statusStyle =
                                statusColors[statusKey] || statusColors.draft;
                            const scheduleInfo = getScheduleInfo(event);

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all"
                                >
                                    <div className="relative h-40 bg-gradient-to-br from-orange-400 to-orange-500">
                                        {event.media?.[0] ? (
                                            <img
                                                src={event.media[0].file_path}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Calendar className="h-16 w-16 text-white opacity-50" />
                                            </div>
                                        )}
                                        <div
                                            className={`absolute top-2 left-2 ${statusStyle.bg} ${statusStyle.text} px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1`}
                                        >
                                            <StatusIcon size={12} />
                                            {event.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                event.status.slice(1)}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-3">
                                            <span className="inline-block px-2.5 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium">
                                                {getEventTypeLabel(event.type)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                                            {event.title}
                                        </h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin
                                                    size={14}
                                                    className="text-orange-500 flex-shrink-0 mt-0.5"
                                                />
                                                <span className="text-xs line-clamp-1">
                                                    {
                                                        event.location
                                                            ?.location_name
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <DollarSign
                                                    size={14}
                                                    className="text-orange-500 flex-shrink-0"
                                                />
                                                <span className="text-xs">
                                                    {formatPrice(event.prices)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                {event.is_unlimited_capacity ? (
                                                    <>
                                                        <Infinity
                                                            size={14}
                                                            className="text-orange-500 flex-shrink-0"
                                                        />
                                                        <span className="text-xs">
                                                            Unlimited
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Users
                                                            size={14}
                                                            className="text-orange-500 flex-shrink-0"
                                                        />
                                                        <span className="text-xs">
                                                            Capacity:{" "}
                                                            {
                                                                event.default_capacity
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {scheduleInfo && (
                                            <div className="mb-4 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                                {scheduleInfo.type ===
                                                "frequency" ? (
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Repeat
                                                                size={12}
                                                                className="text-purple-500"
                                                            />
                                                            <p className="text-xs font-semibold text-gray-800">
                                                                {
                                                                    scheduleInfo.label
                                                                }
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-gray-600">
                                                            {
                                                                scheduleInfo.details
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-800 mb-1.5">
                                                            Upcoming:
                                                        </p>
                                                        <div className="space-y-1">
                                                            {scheduleInfo.slots?.map(
                                                                (slot, idx) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            {slot.is_all_day && (
                                                                                <Sun
                                                                                    size={
                                                                                        12
                                                                                    }
                                                                                    className="text-amber-500"
                                                                                />
                                                                            )}
                                                                            <p className="text-xs font-medium text-gray-700">
                                                                                {formatFullDate(
                                                                                    slot.date
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 ml-5">
                                                                            {formatTimeRange(
                                                                                slot
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {event.age_groups &&
                                            event.age_groups.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {event.age_groups
                                                        .slice(0, 2)
                                                        .map((group, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                                                            >
                                                                {formatAgeGroup(
                                                                    group
                                                                )}
                                                            </span>
                                                        ))}
                                                    {event.age_groups.length >
                                                        2 && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                            +
                                                            {event.age_groups
                                                                .length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all text-sm font-medium">
                                                <Eye size={14} />
                                                View
                                            </button>
                                            {userRole === "merchant" && (
                                                <>
                                                    <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium">
                                                        <Edit size={14} />
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
                                                            className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                                                            title="Deactivate"
                                                        >
                                                            <BadgeX size={14} />
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
