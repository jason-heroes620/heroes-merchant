import { useState } from "react";
import type { Booking, EventType } from "../../types/events";
import {
    DollarSign,
    Gift,
    User,
    CalendarClock,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Search,
    MapPin,
    Calendar,
    Clock,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import type { PageProps } from "../../types/index";
import { router, usePage } from "@inertiajs/react";

type EventBookingPageProps = PageProps & {
    event: EventType;
    bookings: Booking[];
    currentFilter: string;
};

const EventBookingPage: React.FC = () => {
    const { props } = usePage<EventBookingPageProps>();

    const event = props.event;
    const bookings = props.bookings ?? [];
    const currentFilter = props.currentFilter || "all";

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            workshop: "Event / Workshop",
            trial: "Trial Class",
            pass: "Ticket / Pass",
        };
        return labels[type] || type;
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const now = new Date();

    const handleStatusChange = (status: string) => {
        const params = status !== "all" ? { status } : {};
        router.get(window.location.pathname, params, {
            preserveState: false,
            replace: false,
        });
    };

    const filteredBookings = bookings.filter((b) => {
        // Date filter
        if (selectedDate && b.slot?.date !== selectedDate) {
            return false;
        }

        // Search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            const matchesCustomer =
                b.customer?.name?.toLowerCase().includes(search) ||
                b.customer?.email?.toLowerCase().includes(search) ||
                b.customer?.phone?.toLowerCase().includes(search);
            const matchesBookingId = b.booking_code
                ?.toLowerCase()
                .includes(search);

            return matchesCustomer || matchesBookingId;
        }

        return true;
    });

    // Calculate stats
    const stats = {
        total: bookings.length,
        upcoming: bookings.filter((b) => {
            if (!b.slot) return false;
            const slotStart = new Date(`${b.slot.date}T${b.slot.start_time}`);
            return (
                !["cancelled", "refunded"].includes(b.status) &&
                slotStart >= now
            );
        }).length,
        completed: bookings.filter((b) => {
            if (!b.slot) return false;
            const slotEnd = new Date(`${b.slot.date}T${b.slot.end_time}`);
            return (
                !["cancelled", "refunded"].includes(b.status) && slotEnd < now
            );
        }).length,
        cancelled: bookings.filter(
            (b) => b.status === "cancelled" || b.status === "refunded"
        ).length,
        totalAttendees: bookings.reduce((sum, b) => {
            return sum + (b.claim?.summary?.claimed ?? 0);
        }, 0),
    };

    // Group by slot
    const bookingsBySlot: Record<string, Booking[]> = {};
    filteredBookings.forEach((b) => {
        const slotKey = `${b.slot?.date}|${b.slot?.start_time} - ${b.slot?.end_time}`;
        if (!bookingsBySlot[slotKey]) bookingsBySlot[slotKey] = [];
        bookingsBySlot[slotKey].push(b);
    });

    // Get unique dates for filter
    const uniqueDates = Array.from(
        new Set(bookings.map((b) => b.slot?.date).filter(Boolean))
    ).sort();

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">
                {/* Event Header */}
                <div className="bg-linear-to-r from-orange-500 to-red-500 px-8 py-8 shadow-lg">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex gap-6">
                            {/* Event Image */}
                            {event.media && event.media.length > 0 ? (
                                <img
                                    src={
                                        typeof event.media[0] === "string"
                                            ? event.media[0]
                                            : event.media[0].url ||
                                              `/storage/${event.media[0].file_path}`
                                    }
                                    alt={event.title}
                                    className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                                    <Calendar
                                        className="text-white"
                                        size={40}
                                    />
                                </div>
                            )}

                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {event.title}
                                </h1>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                        {getEventTypeLabel(event.type)}
                                    </span>
                                    {event.category && (
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                                            {event.category}
                                        </span>
                                    )}
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-2 text-white text-sm">
                                        <MapPin size={16} />
                                        <span>
                                            {event.location.location_name}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            {
                                label: "Total",
                                value: stats.total,
                                icon: <TrendingUp size={20} />,
                                bg: "from-orange-100 to-orange-200",
                                border: "border-orange-200",
                                iconColor: "text-orange-600",
                            },
                            {
                                label: "Upcoming",
                                value: stats.upcoming,
                                icon: <Calendar size={20} />,
                                bg: "from-amber-100 to-amber-200",
                                border: "border-amber-200",
                                iconColor: "text-amber-600",
                            },
                            {
                                label: "Completed",
                                value: stats.completed,
                                icon: <CheckCircle size={20} />,
                                bg: "from-green-100 to-green-200",
                                border: "border-green-200",
                                iconColor: "text-green-600",
                            },
                            {
                                label: "Cancelled",
                                value: stats.cancelled,
                                icon: <XCircle size={20} />,
                                bg: "from-red-100 to-red-200",
                                border: "border-red-200",
                                iconColor: "text-red-600",
                            },
                        ].map((card, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-xl p-4 border ${card.border} shadow-sm hover:shadow-md transition-shadow flex items-center gap-3`}
                            >
                                <div
                                    className={`p-2.5 bg-linear-to-br ${card.bg} rounded-lg`}
                                >
                                    <div className={card.iconColor}>
                                        {card.icon}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600 font-medium">
                                        {card.label}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {card.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search & Filters */}
                    <div className="mb-6 space-y-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search by customer name, email, phone, or booking code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex gap-3">
                            {/* Status Filter */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-orange-100">
                                {[
                                    "all",
                                    "upcoming",
                                    "completed",
                                    "cancelled",
                                ].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            currentFilter === s
                                                ? "bg-orange-500 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filter */}
                            {uniqueDates.length > 0 && (
                                <select
                                    value={selectedDate || ""}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value || null)
                                    }
                                    className="px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white shadow-sm text-sm font-medium text-gray-700"
                                >
                                    <option value="">All Dates</option>
                                    {uniqueDates.map((date) => (
                                        <option key={date} value={date}>
                                            {date}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Bookings by Slot */}
                    <div className="space-y-6">
                        {Object.entries(bookingsBySlot).map(
                            ([slotKey, slotBookings]) => {
                                const [date, timeRange] = slotKey.split("|");

                                return (
                                    <div
                                        key={slotKey}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
                                    >
                                        {/* Slot Header */}
                                        <div className="bg-linear-to-r from-orange-100 to-red-100 px-5 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CalendarClock
                                                    size={20}
                                                    className="text-orange-600"
                                                />
                                                <div>
                                                    <span className="font-bold text-gray-900 text-lg">
                                                        {date}
                                                    </span>
                                                    <span className="text-sm text-gray-600 ml-3">
                                                        {timeRange}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center px-4 py-1 bg-white rounded-lg shadow-sm">
                                                <div className="text-xs text-gray-600">
                                                    Bookings
                                                </div>
                                                <div className="text-xl font-bold text-orange-600">
                                                    {slotBookings.length}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bookings */}
                                        <div className="p-5 space-y-3">
                                            {slotBookings.map((b) => (
                                                <div
                                                    key={b.id}
                                                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="grid grid-cols-12 gap-4">
                                                        {/* Booking Details */}
                                                        <div className="col-span-3">
                                                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                                Booking
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-600">
                                                                        Code:
                                                                    </span>
                                                                    <span className="font-mono text-xs font-bold text-gray-900">
                                                                        {
                                                                            b.booking_code
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-600">
                                                                        Booked:
                                                                    </span>
                                                                    <span className="text-xs text-green-600 font-semibold">
                                                                        {formatDateTime(
                                                                            b.booked_at
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {b.cancelled_at && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-600">
                                                                            Cancelled:
                                                                        </span>
                                                                        <span className="text-xs text-red-500 font-semibold">
                                                                            {formatDateTime(
                                                                                b.cancelled_at
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-600">
                                                                        Qty:
                                                                    </span>
                                                                    <span className="text-lg font-bold text-orange-600">
                                                                        {
                                                                            b.quantity
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {b.items?.map(
                                                                        (
                                                                            item,
                                                                            idx
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="px-2 py-0.5 bg-white text-orange-700 text-xs font-semibold rounded border border-orange-200"
                                                                            >
                                                                                {
                                                                                    item.age_group_label
                                                                                }{" "}
                                                                                ×{" "}
                                                                                {
                                                                                    item.quantity
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Customer Info - 3 cols */}
                                                        <div className="col-span-3">
                                                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                                Customer
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {b.customer
                                                                    ?.profile_picture ? (
                                                                    <img
                                                                        src={`/storage/${b.customer.profile_picture}`}
                                                                        alt={
                                                                            b
                                                                                .customer
                                                                                .name
                                                                        }
                                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                                                        <User
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-orange-600"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-semibold text-gray-900 truncate">
                                                                        {b
                                                                            .customer
                                                                            ?.name ||
                                                                            "Unknown"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                    <Mail
                                                                        size={
                                                                            11
                                                                        }
                                                                        className="shrink-0"
                                                                    />
                                                                    <span className="truncate">
                                                                        {
                                                                            b
                                                                                .customer
                                                                                ?.email
                                                                        }
                                                                    </span>
                                                                </div>
                                                                {b.customer
                                                                    ?.phone && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                        <Phone
                                                                            size={
                                                                                11
                                                                            }
                                                                            className="shrink-0"
                                                                        />
                                                                        <span>
                                                                            {
                                                                                b
                                                                                    .customer
                                                                                    .phone
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Transaction  */}
                                                        <div className="col-span-3">
                                                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                                Payment
                                                            </div>
                                                            {b.transactions &&
                                                            b.transactions
                                                                .length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {b.transactions.map(
                                                                        (t) => (
                                                                            <div
                                                                                key={
                                                                                    t.id
                                                                                }
                                                                                className="space-y-1.5"
                                                                            >
                                                                                <div
                                                                                    className={`text-xs font-bold ${
                                                                                        t.type ===
                                                                                        "refund"
                                                                                            ? "text-red-600"
                                                                                            : "text-green-600"
                                                                                    }`}
                                                                                >
                                                                                    {t.type.toUpperCase()}
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs">
                                                                                    <Gift
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                        className="text-gray-500"
                                                                                    />
                                                                                    <span className="font-medium text-gray-700">
                                                                                        {Math.abs(
                                                                                            t.delta_free
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-gray-500">
                                                                                        free
                                                                                        credits
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs">
                                                                                    <DollarSign
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                        className="text-gray-500"
                                                                                    />
                                                                                    <span className="font-medium text-gray-700">
                                                                                        {Math.abs(
                                                                                            t.delta_paid
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-gray-500">
                                                                                        paid
                                                                                        credits
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-400 mt-1">
                                                                                    {
                                                                                        t.created_at
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    No
                                                                    transactions
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Claim Summary */}
                                                        <div className="col-span-3">
                                                            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                                                                Claim
                                                            </div>
                                                            {b.claim ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-green-600"
                                                                        />
                                                                        <span className="text-xs text-gray-600">
                                                                            Claimed:
                                                                        </span>
                                                                        <span className="font-bold text-green-600">
                                                                            {
                                                                                b
                                                                                    .claim
                                                                                    .summary
                                                                                    .claimed
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-yellow-600"
                                                                        />
                                                                        <span className="text-xs text-gray-600">
                                                                            Pending:
                                                                        </span>
                                                                        <span className="font-bold text-yellow-600">
                                                                            {
                                                                                b
                                                                                    .claim
                                                                                    .summary
                                                                                    .pending
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {b.claim
                                                                        .summary
                                                                        .absent >
                                                                        0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <XCircle
                                                                                size={
                                                                                    14
                                                                                }
                                                                                className="text-red-600"
                                                                            />
                                                                            <span className="text-xs text-gray-600">
                                                                                Absent:
                                                                            </span>
                                                                            <span className="font-bold text-red-600">
                                                                                {
                                                                                    b
                                                                                        .claim
                                                                                        .summary
                                                                                        .absent
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    No records
                                                                    yet
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    {Object.keys(bookingsBySlot).length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Users
                                className="mx-auto mb-4 text-gray-300"
                                size={48}
                            />
                            <p>No bookings found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EventBookingPage;
