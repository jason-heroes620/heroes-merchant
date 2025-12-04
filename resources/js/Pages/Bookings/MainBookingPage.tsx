import { useState } from "react";
import {
    DollarSign,
    Gift,
    CalendarClock,
    User,
    MapPin,
    Calendar,
    XCircle,
    Hash,
    TrendingUp,
    CheckCircle,
    Phone,
    Mail,
    Search,
} from "lucide-react";
import type { Booking } from "../../types/events";

interface PaginatedBookings {
    data: Booking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface MainBookingProps {
    bookings: PaginatedBookings;
}

const MainBookingPage: React.FC<MainBookingProps> = ({ bookings }) => {
    const [statusFilter, setStatusFilter] = useState<
        "all" | "upcoming" | "completed" | "cancelled"
    >("all");
    const [searchTerm, setSearchTerm] = useState("");

    const now = new Date();

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
        };
        return labels[type] || type;
    };

    const filteredBookings = bookings.data.filter((b) => {
        if (statusFilter === "all") {
        } else if (statusFilter === "cancelled") {
            if (!(b.status === "cancelled" || b.status === "refunded"))
                return false;
        } else if (statusFilter === "upcoming") {
            if (!b.slot) return false;
            if (["cancelled", "refunded"].includes(b.status)) return false;

            const slotStart = new Date(`${b.slot.date}T${b.slot.start_time}`);
            if (slotStart < now) return false;
        } else if (statusFilter === "completed") {
            if (!b.slot) return false;
            if (["cancelled", "refunded"].includes(b.status)) return false;

            const slotEnd = new Date(`${b.slot.date}T${b.slot.end_time}`);
            if (slotEnd >= now) return false;
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
            const matchesEvent = b.event?.title?.toLowerCase().includes(search);

            return matchesCustomer || matchesBookingId || matchesEvent;
        }

        return true;
    });

    // Calculate stats
    const stats = {
        total: bookings.data.length,
        upcoming: bookings.data.filter((b) => {
            if (!b.slot) return false;
            const slotStart = new Date(`${b.slot.date}T${b.slot.start_time}`);
            return (
                !["cancelled", "refunded"].includes(b.status) &&
                slotStart >= now
            );
        }).length,
        completed: bookings.data.filter((b) => {
            if (!b.slot) return false;
            const slotEnd = new Date(`${b.slot.date}T${b.slot.end_time}`);
            return (
                !["cancelled", "refunded"].includes(b.status) && slotEnd < now
            );
        }).length,
        cancelled: bookings.data.filter(
            (b) => b.status === "cancelled" || b.status === "refunded"
        ).length,
    };

    const cards = [
        {
            label: "Total Bookings",
            value: stats.total,
            icon: <TrendingUp className="text-orange-600" size={28} />,
            bg: "from-orange-100 to-orange-200",
            border: "border-orange-100",
        },
        {
            label: "Upcoming",
            value: stats.upcoming,
            icon: <Calendar className="text-blue-600" size={28} />,
            bg: "from-blue-100 to-blue-200",
            border: "border-blue-100",
        },
        {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircle className="text-green-600" size={28} />,
            bg: "from-green-100 to-green-200",
            border: "border-green-100",
        },
        {
            label: "Cancelled",
            value: stats.cancelled,
            icon: <XCircle className="text-red-600" size={28} />,
            bg: "from-red-100 to-red-200",
            border: "border-red-100",
        },
    ];

    const bookingsByDateAndSlot: Record<string, Record<string, Booking[]>> = {};
    filteredBookings.forEach((b) => {
        const date = b.slot?.date ?? "Unknown";
        const slotKey = `${b.slot?.start_time} - ${b.slot?.end_time}`;
        if (!bookingsByDateAndSlot[date]) bookingsByDateAndSlot[date] = {};
        if (!bookingsByDateAndSlot[date][slotKey])
            bookingsByDateAndSlot[date][slotKey] = [];
        bookingsByDateAndSlot[date][slotKey].push(b);
    });

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">
            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 to-orange-600 px-8 py-12 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        All Bookings
                    </h1>
                    <p className="text-orange-100">
                        Manage and review all event bookings
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {cards.map((card, idx) => (
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
                            placeholder="Search by customer name, email, phone, booking ID, or event title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700"
                        />
                    </div>
                </div>

                {/* Filter Buttons - Full Width */}
                <div className="grid grid-cols-4 gap-3 mb-8 bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                    {["all", "upcoming", "completed", "cancelled"].map((s) => (
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

                {/* Bookings */}
                <div className="space-y-8">
                    {Object.entries(bookingsByDateAndSlot).map(
                        ([date, slots]) => (
                            <div key={date} className="space-y-4">
                                <div className="flex items-center gap-3 bg-linear-to-r from-orange-100 to-red-100 px-6 py-3 rounded-xl">
                                    <Calendar
                                        className="text-orange-600"
                                        size={20}
                                    />
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {date}
                                    </h2>
                                </div>

                                {Object.entries(slots).map(
                                    ([slotTime, slotBookings]) => (
                                        <div
                                            key={slotTime}
                                            className="ml-4 space-y-3"
                                        >
                                            <div className="flex items-center gap-2 text-orange-700 font-semibold">
                                                <CalendarClock size={18} />
                                                <span>{slotTime}</span>
                                            </div>

                                            <div className="space-y-3">
                                                {slotBookings.map((b) => (
                                                    <div
                                                        key={b.id}
                                                        className="bg-white border border-orange-100 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
                                                    >
                                                        <div className="flex gap-15 p-6">
                                                            {/* LEFT SIDE: Event Details */}
                                                            <div className="flex-1 space-y-4 max-w-[300px]">
                                                                {/* Event Media */}
                                                                {b.event
                                                                    ?.media ? (
                                                                    <img
                                                                        src={
                                                                            b
                                                                                .event
                                                                                .media
                                                                        }
                                                                        alt={
                                                                            b
                                                                                .event
                                                                                ?.title ??
                                                                            "Event"
                                                                        }
                                                                        className="w-100 h-70 rounded-xl object-cover shrink-0 border border-orange-200"
                                                                    />
                                                                ) : (
                                                                    <div className="w-100 h-70 rounded-xl bg-linear-to-br from-orange-100 to-red-100 flex items-center justify-center text-orange-400 text-sm font-medium">
                                                                        No Image
                                                                    </div>
                                                                )}

                                                                {/* Event Title & Details */}
                                                                <div className="flex-1 space-y-3">
                                                                    <h3 className="text-2xl font-bold text-gray-900">
                                                                        {b.event
                                                                            ?.title ??
                                                                            "Untitled Event"}
                                                                    </h3>

                                                                    {/* Type & Category */}
                                                                    <div className="flex items-center gap-3">
                                                                        {b.event
                                                                            ?.type && (
                                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                                                                {getEventTypeLabel(
                                                                                    b
                                                                                        .event
                                                                                        .type
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                        {b.event
                                                                            ?.category && (
                                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                                                                                {
                                                                                    b
                                                                                        .event
                                                                                        .category
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Location */}
                                                                    {b.event
                                                                        ?.location && (
                                                                        <div className="flex items-center gap-2 text-gray-600">
                                                                            <MapPin
                                                                                size={
                                                                                    16
                                                                                }
                                                                                className="shrink-0"
                                                                            />
                                                                            <span className="text-sm">
                                                                                {
                                                                                    b
                                                                                        .event
                                                                                        .location
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 space-y-4 max-w-[800px]">
                                                                {b.customer && (
                                                                    <div className="bg-orange-50 rounded-xl p-4 space-y-3">
                                                                        <div className="text-sm font-bold text-gray-700">
                                                                            Customer
                                                                            Details
                                                                        </div>

                                                                        {/* Customer Profile */}
                                                                        <div className="flex items-center gap-3">
                                                                            {b
                                                                                .customer
                                                                                .profile_picture ? (
                                                                                <img
                                                                                    src={`/storage/${b.customer.profile_picture}`}
                                                                                    alt={
                                                                                        b
                                                                                            .customer
                                                                                            .name
                                                                                    }
                                                                                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-200"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                                                                                    <User
                                                                                        size={
                                                                                            20
                                                                                        }
                                                                                        className="text-orange-600"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <div>
                                                                                <div className="font-semibold text-gray-900">
                                                                                    {
                                                                                        b
                                                                                            .customer
                                                                                            .name
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Email */}
                                                                        <div className="bg-white rounded-lg p-3 flex items-center justify-between gap-3">
                                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                <Mail
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                    className="text-gray-500 shrink-0"
                                                                                />
                                                                                <span className="text-xs text-gray-700 truncate">
                                                                                    {
                                                                                        b
                                                                                            .customer
                                                                                            .email
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <a
                                                                                href={`mailto:${b.customer.email}`}
                                                                                className="p-1.5 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors shrink-0"
                                                                                title="Send email"
                                                                            >
                                                                                <Mail
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                    className="text-orange-600"
                                                                                />
                                                                            </a>
                                                                        </div>

                                                                        {/* Phone */}
                                                                        {b
                                                                            .customer
                                                                            .phone && (
                                                                            <div className="bg-white rounded-lg p-3 flex items-center justify-between gap-3">
                                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                    <Phone
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                        className="text-gray-500 shrink-0"
                                                                                    />
                                                                                    <span className="text-xs text-gray-700 truncate">
                                                                                        {
                                                                                            b
                                                                                                .customer
                                                                                                .phone
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <a
                                                                                    href={`tel:${b.customer.phone}`}
                                                                                    className="p-1.5 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors shrink-0"
                                                                                    title="Call customer"
                                                                                >
                                                                                    <Phone
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                        className="text-orange-600"
                                                                                    />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Booking Details */}
                                                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                                    <div className="text-sm font-bold text-gray-700">
                                                                        Booking
                                                                        Details
                                                                    </div>

                                                                    {/* Booking ID */}
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Hash
                                                                            size={
                                                                                14
                                                                            }
                                                                            className="text-gray-500"
                                                                        />
                                                                        <span className="text-gray-600">
                                                                            ID:
                                                                        </span>
                                                                        <span className="font-mono font-semibold text-gray-900">
                                                                            {b.booking_id ||
                                                                                `BKG-${b.id}`}
                                                                        </span>
                                                                    </div>

                                                                    {/* Quantity & Items */}
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm text-gray-600">
                                                                                Quantity:
                                                                            </span>
                                                                            <span className="font-bold text-orange-600 text-lg">
                                                                                {
                                                                                    b.quantity
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        {b.items &&
                                                                            b
                                                                                .items
                                                                                .length >
                                                                                0 && (
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {b.items.map(
                                                                                        (
                                                                                            i
                                                                                        ) => (
                                                                                            <span
                                                                                                key={
                                                                                                    i.age_group_label
                                                                                                }
                                                                                                className="px-2 py-1 bg-white text-orange-700 text-xs font-semibold rounded-lg border border-orange-200"
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

                                                                {/* Transactions */}
                                                                {b.transactions &&
                                                                    b
                                                                        .transactions
                                                                        .length >
                                                                        0 && (
                                                                        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                                                                            <div className="text-sm font-bold text-gray-700 mb-2">
                                                                                Transactions
                                                                            </div>
                                                                            {b.transactions.map(
                                                                                (
                                                                                    t
                                                                                ) => {
                                                                                    const isRefund =
                                                                                        t.type ===
                                                                                        "refund";
                                                                                    return (
                                                                                        <div
                                                                                            key={
                                                                                                t.id
                                                                                            }
                                                                                            className="bg-white rounded-lg p-3 space-y-1"
                                                                                        >
                                                                                            <div
                                                                                                className={`flex items-center gap-2 text-xs font-bold ${
                                                                                                    isRefund
                                                                                                        ? "text-red-600"
                                                                                                        : "text-green-600"
                                                                                                }`}
                                                                                            >
                                                                                                {isRefund
                                                                                                    ? "REFUND"
                                                                                                    : "BOOKING"}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="flex items-center gap-1 text-sm">
                                                                                                    <Gift
                                                                                                        size={
                                                                                                            12
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
                                                                                                            12
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
                                                                                                <span className="text-gray-400 text-xs ml-auto">
                                                                                                    {
                                                                                                        t.created_at
                                                                                                    }
                                                                                                </span>
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
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MainBookingPage;
