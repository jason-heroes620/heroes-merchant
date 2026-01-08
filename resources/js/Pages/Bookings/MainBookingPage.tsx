import { useState } from "react";
import { router, usePage, Link } from "@inertiajs/react";
import type { PageProps } from "../../types/index";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import {
    Calendar,
    Users,
    Search,
    MapPin,
    TrendingUp,
    CheckCircle,
    XCircle,
    ChevronRight,
    Ban,
    Clock,
} from "lucide-react";

type SlotSummary = {
    slot_id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_completed: boolean;
    confirmed_count: number;
    expected_attendees: number;
    cancelled_count: number;
    actual_attendees: number | null;
    absent_count: number | null;
};

type EventSummary = {
    event: {
        id: string;
        title: string;
        type: string;
        category: string;
        location: string;
        media: string | null;
    };
    slots: SlotSummary[];
    summary: {
        total_slots: number;
        confirmed: number;
        expected: number;
        cancelled: number;
    };
};

type MainBookingPageProps = PageProps & {
    eventSummaries: EventSummary[];
    stats: {
        total: number;
        confirmed: number;
        cancelled: number;
    };
    currentFilter: string;
    userRole: "admin" | "merchant";
};

const MainBookingPage = () => {
    const { props } = usePage<MainBookingPageProps>();
    const { eventSummaries = [], stats, currentFilter = "all" } = props;
    const user = props.auth?.userRole;

    const [searchTerm, setSearchTerm] = useState("");

    const filteredEvents = eventSummaries.filter((eventSummary) => {
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            return (
                eventSummary.event.title.toLowerCase().includes(search) ||
                eventSummary.event.location?.toLowerCase().includes(search)
            );
        }
        return true;
    });

    const handleStatusChange = (status: string) => {
        const params = status !== "all" ? { status } : {};
        router.get(window.location.pathname, params, {
            preserveState: false,
            replace: false,
        });
    };

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            workshop: "Event / Workshop",
            trial: "Trial Class",
            pass: "Ticket / Pass",
        };
        return labels[type] || type;
    };

    const getBookingUrl = (eventId: string) => {
        return user === "admin"
            ? `/admin/bookings/event/${eventId}`
            : `/merchant/bookings/event/${eventId}`;
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 to-orange-600 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 shadow-lg rounded-2xl">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            Booking Dashboard
                        </h1>
                        <p className="text-sm sm:text-base text-orange-100">
                            Quick overview of all event bookings
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {/* Global Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 mb-6 sm:mb-8">
                        {[
                            {
                                label: "Total Bookings",
                                value: stats.total,
                                icon: <TrendingUp size={24} />,
                                iconBg: "bg-orange-100",
                                iconColor: "text-orange-600",
                                border: "border-orange-200",
                            },
                            {
                                label: "Confirmed",
                                value: stats.confirmed,
                                icon: <CheckCircle size={24} />,
                                iconBg: "bg-green-100",
                                iconColor: "text-green-600",
                                border: "border-green-200",
                            },
                            {
                                label: "Cancelled",
                                value: stats.cancelled,
                                icon: <XCircle size={24} />,
                                iconBg: "bg-red-100",
                                iconColor: "text-red-600",
                                border: "border-red-200",
                            },
                        ].map((card, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl p-5 sm:p-6 border ${card.border} shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 sm:gap-6`}
                            >
                                <div
                                    className={`p-3 sm:p-4 ${card.iconBg} ${card.iconColor} rounded-xl shrink-0`}
                                >
                                    {card.icon}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                                        {card.label}
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                        {card.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 space-y-3">
                        <div className="relative">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search events by title or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
                            />
                        </div>

                        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-orange-100 overflow-x-auto">
                            {["all", "upcoming", "completed", "cancelled"].map(
                                (s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex-1 whitespace-nowrap ${
                                            currentFilter === s
                                                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md"
                                                : "text-gray-600 hover:bg-orange-50"
                                        }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Events Summary - 3 Cards Per Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((eventSummary) => (
                            <div
                                key={eventSummary.event.id}
                                className="bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="p-4 sm:p-6">
                                    {/* Event Image */}
                                    {eventSummary.event.media ? (
                                        <img
                                            src={eventSummary.event.media}
                                            alt={eventSummary.event.title}
                                            className="w-full h-32 sm:h-40 rounded-xl object-cover border-2 border-orange-200 mb-4"
                                        />
                                    ) : (
                                        <div className="w-full h-32 sm:h-40 rounded-xl bg-linear-to-br from-orange-100 to-red-100 flex items-center justify-center mb-4">
                                            <Calendar
                                                className="text-orange-400"
                                                size={32}
                                            />
                                        </div>
                                    )}

                                    {/* Event Details */}
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                        {eventSummary.event.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            {getEventTypeLabel(
                                                eventSummary.event.type
                                            )}
                                        </span>
                                        {eventSummary.event.category && (
                                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                                {eventSummary.event.category}
                                            </span>
                                        )}
                                    </div>
                                    {eventSummary.event.location && (
                                        <div className="flex items-start gap-2 text-gray-600 text-xs sm:text-sm mb-4">
                                            <MapPin
                                                size={14}
                                                className="mt-0.5 shrink-0"
                                            />
                                            <span className="line-clamp-2">
                                                {eventSummary.event.location}
                                            </span>
                                        </div>
                                    )}

                                    {/* Event Summary Stats - Icons on Left */}
                                    <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 mb-4">
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                                            <div className="flex items-center text-center gap-4 p-2 sm:p-3 bg-white rounded-lg">
                                                <Clock
                                                    size={24}
                                                    className="text-gray-600 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Total Slots
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                                                        {
                                                            eventSummary.summary
                                                                .total_slots
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-center gap-4 p-2 sm:p-3 bg-white rounded-lg">
                                                <CheckCircle
                                                    size={24}
                                                    className="text-green-600 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Confirmed
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-bold text-green-600">
                                                        {
                                                            eventSummary.summary
                                                                .confirmed
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-center gap-4 p-2 sm:p-3 bg-white rounded-lg">
                                                <Users
                                                    size={24}
                                                    className="text-blue-600 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Expected
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-bold text-blue-600">
                                                        {
                                                            eventSummary.summary
                                                                .expected
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-center gap-4 p-2 sm:p-3 bg-white rounded-lg">
                                                <Ban
                                                    size={24}
                                                    className="text-red-600 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Cancelled
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-bold text-red-600">
                                                        {
                                                            eventSummary.summary
                                                                .cancelled
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <Link
                                        href={getBookingUrl(
                                            eventSummary.event.id
                                        )}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm sm:text-base font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                                    >
                                        View Details
                                        <ChevronRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border border-orange-100">
                            <Calendar
                                className="mx-auto mb-4 text-orange-200"
                                size={48}
                            />
                            <p className="text-gray-600 font-medium">
                                No events found
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Try adjusting your filters or search
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MainBookingPage;
