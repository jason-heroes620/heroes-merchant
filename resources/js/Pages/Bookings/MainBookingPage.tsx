import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import type { PageProps } from "../../types/index";
import type { Booking } from "../../types/events";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import CustomerDetails from "@/components/bookings/CustomerDetails";
import BookingDetails from "@/components/bookings/BookingDetails";
import AttendanceDetails from "@/components/bookings/AttendanceDetails";
import {
    Calendar,
    CalendarClock,
    TrendingUp,
    CheckCircle,
    XCircle,
    Search,
    MapPin,
} from "lucide-react";

type PaginatedBookings = PageProps & {
    bookings: {
        data: Booking[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        upcoming: number;
        completed: number;
        cancelled: number;
    };
};

const MainBookingPage: React.FC = () => {
    const { props } = usePage<PaginatedBookings>();
    const { bookings, stats } = props;

    const [statusFilter, setStatusFilter] = useState<
        "all" | "upcoming" | "completed" | "cancelled"
    >((props.status as any) || "all");
    const [searchTerm, setSearchTerm] = useState(
        (props.search as string) || ""
    );

    // --- Handle tab click ---
    const handleStatusChange = (
        status: "all" | "upcoming" | "completed" | "cancelled"
    ) => {
        setStatusFilter(status);

        router.get(
            route("bookings.index"),
            {
                ...(status !== "all" && { status }),
                ...(searchTerm.trim() && { search: searchTerm }),
            },
            { preserveState: true, replace: true }
        );
    };

    // --- Handle search input ---
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get(
            route("bookings.index"),
            {
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(value.trim() && { search: value }),
            },
            { preserveState: true, replace: true }
        );
    };

    // --- Group bookings by date and slot ---
    const bookingsByDateAndSlot: Record<string, Record<string, Booking[]>> = {};
    bookings.data.forEach((b) => {
        const date = b.slot?.date ?? "Unknown";
        const slotKey = `${b.slot?.start_time ?? "Unknown"} - ${
            b.slot?.end_time ?? "Unknown"
        }`;
        if (!bookingsByDateAndSlot[date]) bookingsByDateAndSlot[date] = {};
        if (!bookingsByDateAndSlot[date][slotKey])
            bookingsByDateAndSlot[date][slotKey] = [];
        bookingsByDateAndSlot[date][slotKey].push(b);
    });

    // --- Stats cards ---
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

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            event: "Event",
            trial_class: "Trial Class",
            location_based: "Field Trip",
        };
        return labels[type] || type;
    };

    return (
        <AuthenticatedLayout>
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

                    {/* Search */}
                    <div className="mb-6 bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                        <div className="relative">
                            <Search
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Search by customer, booking ID, or event title..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-4 gap-3 mb-8 bg-white p-2 rounded-xl shadow-sm border border-orange-100">
                        {["all", "upcoming", "completed", "cancelled"].map(
                            (s) => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s as any)}
                                    className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                                        statusFilter === s
                                            ? "bg-linear-to-r from-orange-500 to-red-500 text-white shadow-md"
                                            : "text-gray-600 hover:bg-orange-50"
                                    }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            )
                        )}
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
                                                                            No
                                                                            Image
                                                                        </div>
                                                                    )}

                                                                    {/* Event Title + Labels */}
                                                                    <div className="flex-1 space-y-3">
                                                                        <h3 className="text-2xl font-bold text-gray-900">
                                                                            {b
                                                                                .event
                                                                                ?.title ??
                                                                                "Untitled Event"}
                                                                        </h3>
                                                                        <div className="flex items-center gap-3">
                                                                            {b
                                                                                .event
                                                                                ?.type && (
                                                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                                                                                    {getEventTypeLabel(
                                                                                        b
                                                                                            .event
                                                                                            .type
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            {b
                                                                                .event
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

                                                                {/* Customer + Booking + Attendance */}
                                                                <div className="flex-1 space-y-4 max-w-[800px]">
                                                                    <CustomerDetails
                                                                        customer={
                                                                            b.customer
                                                                        }
                                                                    />
                                                                    <BookingDetails
                                                                        booking={
                                                                            b
                                                                        }
                                                                    />
                                                                    {(statusFilter ===
                                                                        "completed" ||
                                                                        statusFilter ===
                                                                            "all") &&
                                                                        b.attendance && (
                                                                            <AttendanceDetails
                                                                                attendance={
                                                                                    b.attendance
                                                                                }
                                                                            />
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
        </AuthenticatedLayout>
    );
};

export default MainBookingPage;
