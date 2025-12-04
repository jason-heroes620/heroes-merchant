import { useState } from "react";
import type { Booking, Event } from "../../types/events";
import {
    DollarSign,
    Gift,
    User,
    CalendarClock,
    MapPin,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Hash,
    Phone,
    Mail,
    Search,
} from "lucide-react";

interface EventBookingProps {
    event: Event;
    bookings: Booking[];
}

const EventBookingPage: React.FC<EventBookingProps> = ({ event, bookings }) => {
    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
        };
        return labels[type] || type;
    };

    const [statusFilter, setStatusFilter] = useState<
        "all" | "upcoming" | "completed" | "cancelled"
    >("all");
    const [searchTerm, setSearchTerm] = useState("");
    const now = new Date();

    const isRecurring = event.is_recurring ?? false;
    const availableFilters = isRecurring
        ? ["all", "upcoming", "completed", "cancelled"]
        : ["all", "cancelled"];

    const filteredBookings = bookings.filter((b) => {
        // Status filter
        if (statusFilter === "all") {
            // Apply search only
        } else if (statusFilter === "cancelled") {
            if (!(b.status === "cancelled" || b.status === "refunded"))
                return false;
        } else if (b.slot) {
            const slotStart = new Date(`${b.slot.date}T${b.slot.start_time}`);
            const slotEnd = new Date(`${b.slot.date}T${b.slot.end_time}`);

            if (statusFilter === "upcoming") {
                if (
                    ["cancelled", "refunded"].includes(b.status) ||
                    slotStart < now
                )
                    return false;
            } else if (statusFilter === "completed") {
                if (
                    ["cancelled", "refunded"].includes(b.status) ||
                    slotEnd >= now
                )
                    return false;
            }
        }

        // Search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            const matchesCustomer =
                b.customer?.name?.toLowerCase().includes(search) ||
                b.customer?.email?.toLowerCase().includes(search) ||
                b.customer?.phone?.toLowerCase().includes(search);
            const matchesBookingId =
                b.booking_id?.toLowerCase().includes(search) ||
                `BKG-${b.id}`.toLowerCase().includes(search);

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
            if (!b.attendance || !Array.isArray(b.attendance)) return sum;
            const bookingAttended = b.attendance.reduce(
                (subSum, a) => subSum + (a.attended_count ?? 0),
                0
            );
            return sum + bookingAttended;
        }, 0),
    };

    const bookingsBySlot: Record<string, Booking[]> = {};
    filteredBookings.forEach((b) => {
        const slotKey = `${b.slot?.date} ${b.slot?.start_time} - ${b.slot?.end_time}`;
        if (!bookingsBySlot[slotKey]) bookingsBySlot[slotKey] = [];
        bookingsBySlot[slotKey].push(b);
    });

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50">
            {/* Event Header */}
            <div className="bg-linear-to-r from-orange-500 to-red-500 px-8 py-12 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-start gap-6">
                        {event.media && event.media.length > 0 ? (
                            <img
                                src={`/storage/${event.media[0].file_path}`}
                                alt={event.title}
                                className="w-48 h-36 rounded-2xl object-cover shadow-xl border-4 border-white/30 shrink-0"
                            />
                        ) : (
                            <div className="w-48 h-36 rounded-2xl bg-white/20 flex items-center justify-center text-white/60 text-sm font-medium shrink-0">
                                No Image
                            </div>
                        )}

                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-white mb-3">
                                {event.title}
                            </h1>
                            <div className="space-y-2">
                                {event.location && (
                                    <div className="flex items-center gap-2 text-orange-100">
                                        <MapPin size={18} />
                                        <span className="text-lg">
                                            {event.location}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                        {getEventTypeLabel(event.type)}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: "Total Bookings",
                            value: stats.total,
                            icon: (
                                <TrendingUp
                                    className="text-orange-600"
                                    size={28}
                                />
                            ),
                            bg: "from-orange-100 to-orange-200",
                            border: "border-orange-100",
                        },
                        {
                            label: "Total Attendees",
                            value: stats.totalAttendees,
                            icon: (
                                <Users className="text-purple-600" size={28} />
                            ),
                            bg: "from-purple-100 to-purple-200",
                            border: "border-purple-100",
                        },
                        isRecurring
                            ? {
                                  label: "Upcoming",
                                  value: stats.upcoming,
                                  icon: (
                                      <CalendarClock
                                          className="text-blue-600"
                                          size={28}
                                      />
                                  ),
                                  bg: "from-blue-100 to-blue-200",
                                  border: "border-blue-100",
                              }
                            : null,
                        {
                            label: "Completed",
                            value: stats.completed,
                            icon: (
                                <CheckCircle
                                    className="text-green-600"
                                    size={28}
                                />
                            ),
                            bg: "from-green-100 to-green-200",
                            border: "border-green-100",
                        },
                        {
                            label: "Cancelled",
                            value: stats.cancelled,
                            icon: (
                                <XCircle className="text-red-600" size={28} />
                            ),
                            bg: "from-red-100 to-red-200",
                            border: "border-red-100",
                        },
                    ]
                        .filter(
                            (card): card is NonNullable<typeof card> =>
                                card !== null
                        )
                        .map((card, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-2xl p-8 ${card.border} shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center`}
                            >
                                <div
                                    className={`p-3 bg-linear-to-br ${card.bg} rounded-xl mb-4`}
                                >
                                    {card.icon}
                                </div>
                                <div className="text-gray-500 text-sm font-medium mb-1">
                                    {card.label}
                                </div>
                                <div className="text-4xl font-bold text-gray-900">
                                    {card.value}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Search Bar */}
                <div className="mb-6 bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                    <div className="relative">
                        <Search
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Search by customer name, email, phone, or booking ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700"
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div
                    className={`grid grid-cols-${availableFilters.length} gap-3 mb-8 bg-white p-2 rounded-xl shadow-sm border border-orange-100`}
                >
                    {availableFilters.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s as any)}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                                statusFilter === s
                                    ? "bg-linear-to-r from-orange-500 to-red-500 text-white shadow-md"
                                    : "text-gray-600 hover:bg-orange-50"
                            }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Bookings by Slot */}
                <div className="space-y-6">
                    {Object.entries(bookingsBySlot).map(
                        ([slotTime, slotBookings]) => (
                            <div key={slotTime} className="space-y-3">
                                <div className="flex items-center gap-3 bg-linear-to-r from-orange-100 to-red-100 px-6 py-3 rounded-xl">
                                    <CalendarClock
                                        size={20}
                                        className="text-orange-600"
                                    />
                                    <h2 className="text-lg font-bold text-gray-800">
                                        {slotTime}
                                    </h2>
                                </div>

                                <div className="space-y-3 ml-4">
                                    {slotBookings.map((b) => (
                                        <div
                                            key={b.id}
                                            className="bg-white border border-orange-100 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
                                        >
                                            <div className="grid grid-cols-3 gap-6 p-6">
                                                {/* LEFT: Booking Details */}
                                                <div className="space-y-4">
                                                    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                                        <div className="text-sm font-bold text-gray-700">
                                                            Booking Details
                                                        </div>

                                                        {/* Booking ID */}
                                                        <div className="flex gap-2 text-sm">
                                                            <Hash
                                                                size={14}
                                                                className="text-gray-500"
                                                            />
                                                            <span className="text-gray-900">
                                                                ID:
                                                            </span>
                                                            <span className="font-mono font-semibold text-gray-600">
                                                                {b.booking_id ||
                                                                    `BKG-${b.id}`}
                                                            </span>
                                                        </div>

                                                        {/* Booked At */}
                                                        <div className="text-xs text-green-600 font-semibold">
                                                            Booked:{" "}
                                                            {b.booked_at}
                                                        </div>

                                                        {/* Cancelled At */}
                                                        {b.cancelled_at && (
                                                            <div className="text-xs text-red-500 font-semibold">
                                                                Cancelled:{" "}
                                                                {b.cancelled_at}
                                                            </div>
                                                        )}

                                                        {/* Quantity */}
                                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                                            <span className="text-sm text-gray-600">
                                                                Quantity:
                                                            </span>
                                                            <span className="font-bold text-orange-600 text-lg">
                                                                {b.quantity}
                                                            </span>
                                                        </div>

                                                        {/* Age Groups */}
                                                        {b.items &&
                                                            b.items.length >
                                                                0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {b.items.map(
                                                                        (i) => (
                                                                            <span
                                                                                key={
                                                                                    i.age_group_label
                                                                                }
                                                                                className="px-3 py-1 bg-white text-orange-700 text-xs font-semibold rounded-lg border border-orange-200"
                                                                            >
                                                                                {
                                                                                    i.age_group_label
                                                                                }{" "}
                                                                                ×{" "}
                                                                                {
                                                                                    i.quantity
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>

                                                {/* MIDDLE: Customer Details */}
                                                <div className="space-y-4">
                                                    <div className="text-sm font-bold text-gray-700 mb-3">
                                                        Customer Details
                                                    </div>

                                                    {b.customer ? (
                                                        <>
                                                            {/* Customer Profile */}
                                                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                                                                {b.customer
                                                                    .profile_picture ? (
                                                                    <img
                                                                        src={`/storage/${b.customer.profile_picture}`}
                                                                        alt={
                                                                            b
                                                                                .customer
                                                                                .name
                                                                        }
                                                                        className="w-14 h-14 rounded-full object-cover border-2 border-orange-200"
                                                                    />
                                                                ) : (
                                                                    <div className="w-14 h-14 rounded-full bg-orange-200 flex items-center justify-center">
                                                                        <User
                                                                            size={
                                                                                24
                                                                            }
                                                                            className="text-orange-600"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-semibold text-gray-900 text-base">
                                                                        {
                                                                            b
                                                                                .customer
                                                                                .name
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Email */}
                                                            <div className="bg-orange-50 rounded-lg p-3 flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <Mail
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="text-gray-500 shrink-0"
                                                                    />
                                                                    <span className="text-sm text-gray-700 truncate">
                                                                        {
                                                                            b
                                                                                .customer
                                                                                .email
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <a
                                                                    href={`mailto:${b.customer.email}`}
                                                                    className="p-2 bg-orange-200 hover:bg-orange-300 rounded-lg transition-colors shrink-0"
                                                                    title="Send email"
                                                                >
                                                                    <Mail
                                                                        size={
                                                                            16
                                                                        }
                                                                        className="text-orange-700"
                                                                    />
                                                                </a>
                                                            </div>

                                                            {/* Phone */}
                                                            {b.customer
                                                                .phone && (
                                                                <div className="bg-orange-50 rounded-lg p-3 flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <Phone
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="text-gray-500 shrink-0"
                                                                        />
                                                                        <span className="text-sm text-gray-700 truncate">
                                                                            {
                                                                                b
                                                                                    .customer
                                                                                    .phone
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <a
                                                                        href={`tel:${b.customer.phone}`}
                                                                        className="p-2 bg-orange-200 hover:bg-orange-300 rounded-lg transition-colors shrink-0"
                                                                        title="Call customer"
                                                                    >
                                                                        <Phone
                                                                            size={
                                                                                16
                                                                            }
                                                                            className="text-orange-700"
                                                                        />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">
                                                            No customer
                                                            information
                                                        </div>
                                                    )}
                                                </div>

                                                {/* RIGHT: Transactions */}
                                                <div className="space-y-4">
                                                    {b.transactions &&
                                                        b.transactions.length >
                                                            0 && (
                                                            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                                                                <div className="text-sm font-bold text-gray-700 mb-2">
                                                                    Transactions
                                                                </div>
                                                                {b.transactions.map(
                                                                    (t) => {
                                                                        const isRefund =
                                                                            t.type ===
                                                                            "refund";
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    t.id
                                                                                }
                                                                                className="bg-white rounded-lg p-3 space-y-2"
                                                                            >
                                                                                <div
                                                                                    className={`text-xs font-bold ${
                                                                                        isRefund
                                                                                            ? "text-red-600"
                                                                                            : "text-green-600"
                                                                                    }`}
                                                                                >
                                                                                    {isRefund
                                                                                        ? "REFUND"
                                                                                        : "BOOKING"}
                                                                                </div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="flex items-center gap-1 text-sm">
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
                                                                                        free
                                                                                        credits
                                                                                    </div>
                                                                                    <div className="flex items-center gap-1 text-sm">
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
                                                                                        paid
                                                                                        credits
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {
                                                                                        t.created_at
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventBookingPage;
