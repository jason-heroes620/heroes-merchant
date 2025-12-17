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
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
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
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 to-orange-600 px-8 py-8 shadow-lg">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Booking Dashboard
                        </h1>
                        <p className="text-orange-100">
                            Quick overview of all event bookings
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-6">
                    {/* Global Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            {
                                label: "Total Bookings",
                                value: stats.total,
                                icon: <TrendingUp size={20} />,
                                bg: "from-orange-100 to-orange-200",
                                border: "border-orange-200",
                            },
                            {
                                label: "Confirmed",
                                value: stats.confirmed,
                                icon: <CheckCircle size={20} />,
                                bg: "from-green-100 to-green-200",
                                border: "border-green-200",
                            },
                            {
                                label: "Cancelled",
                                value: stats.cancelled,
                                icon: <XCircle size={20} />,
                                bg: "from-red-100 to-red-200",
                                border: "border-red-200",
                            },
                        ].map((card, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-xl p-5 border ${card.border} shadow-sm hover:shadow-md transition-shadow flex items-center gap-4`}
                            >
                                <div
                                    className={`p-3 bg-linear-to-br ${card.bg} rounded-lg`}
                                >
                                    <div className="text-gray-700">
                                        {card.icon}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 font-medium">
                                        {card.label}
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
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
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
                            />
                        </div>

                        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-orange-100">
                            {["all", "upcoming", "completed", "cancelled"].map(
                                (s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex-1 ${
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

                    {/* Events Summary */}
                    <div className="space-y-4">
                        {filteredEvents.map((eventSummary) => (
                            <div
                                key={eventSummary.event.id}
                                className="bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="grid grid-cols-12 gap-6 p-6">
                                   
                                    <div className="col-span-4 border-r border-gray-200 pr-6">
                                        {/* Event Image */}
                                        {eventSummary.event.media ? (
                                            <img
                                                src={eventSummary.event.media}
                                                alt={eventSummary.event.title}
                                                className="w-full h-40 rounded-xl object-cover border-2 border-orange-200 mb-4"
                                            />
                                        ) : (
                                            <div className="w-full h-40 rounded-xl bg-linear-to-br from-orange-100 to-red-100 flex items-center justify-center mb-4">
                                                <Calendar
                                                    className="text-orange-400"
                                                    size={40}
                                                />
                                            </div>
                                        )}

                                        {/* Event Details */}
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">
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
                                                    {
                                                        eventSummary.event
                                                            .category
                                                    }
                                                </span>
                                            )}
                                        </div>
                                        {eventSummary.event.location && (
                                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                                                <MapPin size={14} />
                                                <span>
                                                    {
                                                        eventSummary.event
                                                            .location
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Event Summary - Improved Layout */}
                                        <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Total Slots
                                                    </div>
                                                    <div className="text-xl font-bold text-gray-900">
                                                        {
                                                            eventSummary.summary
                                                                .total_slots
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex  p-2 bg-white rounded-lg">
                                                    <CheckCircle
                                                        size={25}
                                                        className="text-green-600"
                                                    />
                                                    <div className="ml-2">
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            Confirmed Bookings
                                                        </div>
                                                        <div className="text-xl font-bold text-green-600">
                                                            {
                                                                eventSummary
                                                                    .summary
                                                                    .confirmed
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <Users
                                                        size={14}
                                                        className="text-blue-600"
                                                    />
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Expected Attendees
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-600">
                                                        {
                                                            eventSummary.summary
                                                                .expected
                                                        }
                                                    </div>
                                                </div>
                                                <div className="text-center p-2 bg-white rounded-lg">
                                                    <Ban
                                                        size={14}
                                                        className="text-red-600"
                                                    />
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Cancelled
                                                    </div>
                                                    <div className="text-xl font-bold text-red-600">
                                                        {
                                                            eventSummary.summary
                                                                .cancelled
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <Link
                                            href={getBookingUrl(
                                                eventSummary.event.id
                                            )}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            View Details
                                            <ChevronRight size={18} />
                                        </Link>
                                    </div>
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
