import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import {
    CalendarClock,
    Users,
    ArrowUpRight,
    TrendingUp,
    Eye,
    ChevronRight,
    Sparkles,
    Clock,
    Home,
    BarChart3,
    Calendar,
    CreditCard,
    X,
    DollarSign,
} from "lucide-react";

interface EventType {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
    featured?: boolean;
    like_count?: number;
    click_count?: number;
    location?: {
        location_name: string;
    };
    dates?: Array<{
        start_date: string;
        end_date: string;
    }>;
    slots?: Array<{
        date: string;
    }>;
    slot?: {
        date: string;
    };
    media?: Array<{
        file_path: string;
    }>;
}

interface BookingType {
    id: number;
    booking_id?: string;
    event?: {
        title: string;
    };
    customer?: {
        user?: {
            full_name: string;
            email: string;
        };
    };
    quantity?: number;
    total_amount?: number;
    booked_at: string;
    created_at: string;
}

interface DashboardProps {
    activeEvents: EventType[];
    pastEvents: EventType[];
    allBookings: BookingType[];
    todayBookings: BookingType[];
    weekBookings: BookingType[];
    monthlySales: number;
    lastMonthSales: number;
    percentageIncrease?: number;
    userRole: "admin" | "merchant";
    pendingPayouts?: number;
    availablePayouts?: number;
    totalBookingsThisMonth?: number;
}

const MerchantDashboard: React.FC<DashboardProps> = ({
    activeEvents,
    pastEvents,
    allBookings,
    todayBookings,
    weekBookings,
    monthlySales,
    percentageIncrease,
    userRole,
    pendingPayouts = 0,
    availablePayouts = 0,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [bookingFilter, setBookingFilter] = useState("today");
    const [revenueFilter, setRevenueFilter] = useState("month");

    const handleNavigate = (path: string) => {
        router.visit(path);
    };

    // Calculate weekly revenue from weekBookings
    const weeklyRevenue = useMemo(() => {
        return weekBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    }, [weekBookings]);

    // Get month bookings from allBookings
    const monthBookings = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
        );

        return allBookings.filter((b) => {
            const bookingDate = new Date(b.booked_at || b.created_at);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
        });
    }, [allBookings]);

    // Calculate upcoming events this week
    const upcomingEventsThisWeek = useMemo(() => {
        const now = new Date();
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return activeEvents.filter((event) => {
            if (event.dates && event.dates.length > 0) {
                const eventDate = new Date(event.dates[0].start_date);
                return eventDate >= now && eventDate <= weekEnd;
            }
            return false;
        }).length;
    }, [activeEvents]);

    // Filter bookings based on selected period
    const filteredBookings = useMemo(() => {
        let bookings = todayBookings;

        // Apply time filter
        if (bookingFilter === "week") {
            bookings = weekBookings;
        } else if (bookingFilter === "month") {
            bookings = monthBookings;
        }

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            bookings = bookings.filter(
                (b) =>
                    b.customer?.user?.full_name
                        ?.toLowerCase()
                        .includes(search) ||
                    b.customer?.user?.email?.toLowerCase().includes(search) ||
                    String(b.id).toLowerCase().includes(search)
            );
        }

        return bookings;
    }, [bookingFilter, searchTerm, todayBookings, weekBookings, monthBookings]);

    const totalAttendeesToday = todayBookings.reduce(
        (sum, b) => sum + (b.quantity || 0),
        0
    );

    const displayUpcomingEvents = activeEvents.slice(0, 3);

    const FilterButton = ({
        active,
        children,
        onClick,
    }: {
        active: boolean;
        children: React.ReactNode;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                active
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50">
            {/* Orange to Red Gradient Header */}
            <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                <Home size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold mb-1">
                                    Dashboard
                                </h1>
                                <p className="text-orange-100">
                                    Welcome back! Here's your business overview
                                </p>
                            </div>
                        </div>
                        <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
                            <div className="text-sm text-orange-100 mb-1">
                                {new Date().toLocaleDateString("en-US", {
                                    weekday: "long",
                                    timeZone: "Asia/Kuala_Lumpur",
                                })}
                            </div>
                            <div className="text-lg font-semibold">
                                {new Date().toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    timeZone: "Asia/Kuala_Lumpur",
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                <div className="md:col-span-2 bg-linear-to-br from-orange-500 to-red-500 text-white rounded-3xl shadow-2xl p-8 relative overflow-hidden cursor-pointer hover:shadow-3xl transition-all hover:scale-[1.02] group">
                    <div className="absolute top-0 right-0 opacity-10">
                        <DollarSign size={120} className="text-yellow-100" />
                    </div>
                    {/* Revenue Card with Filter */}
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold uppercase tracking-wide text-orange-100">
                                Revenue
                            </span>
                            <ArrowUpRight
                                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                size={24}
                            />
                            <div className="flex items-center gap-2">
                                <FilterButton
                                    active={revenueFilter === "week"}
                                    onClick={() => setRevenueFilter("week")}
                                >
                                    Week
                                </FilterButton>
                                <FilterButton
                                    active={revenueFilter === "month"}
                                    onClick={() => setRevenueFilter("month")}
                                >
                                    Month
                                </FilterButton>
                            </div>
                        </div>
                        <p className="text-6xl font-bold mb-3">
                            RM{" "}
                            {monthlySales.toLocaleString("en-MY", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                        <div className="flex items-center gap-2 text-orange-100">
                            <div className="flex gap-2 items-center">
                                <TrendingUp size={18} />
                                <span className="font-semibold">
                                    {percentageIncrease != null
                                        ? `{displayPercentage(${percentageIncrease.toFixed(
                                              1
                                          )}})%`
                                        : "No last month data"}
                                </span>
                            </div>
                            <span> vs last {revenueFilter}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Active Events */}
                    <div
                        onClick={() => handleNavigate("/merchant/events")}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <CalendarClock
                                    className="text-orange-600"
                                    size={24}
                                />
                            </div>
                            <ChevronRight
                                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                size={20}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Active Events
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {activeEvents.length}
                        </p>
                        <p className="text-sm text-gray-500">
                            {upcomingEventsThisWeek} this week
                        </p>
                    </div>

                    {/* Today's Bookings */}
                    <div
                        onClick={() => handleNavigate("/merchant/bookings")}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                                <Users className="text-green-600" size={24} />
                            </div>
                            <ChevronRight
                                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                size={20}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Today's Bookings
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            {todayBookings.length}
                        </p>
                        <p className="text-sm text-gray-500">
                            {totalAttendeesToday} attendees
                        </p>
                    </div>

                    {/* Available Payouts */}
                    <div
                        onClick={() => handleNavigate("/merchant/payouts")}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-yellow-100 p-3 rounded-lg group-hover:bg-yellow-200 transition-colors">
                                <Sparkles
                                    className="text-yellow-600"
                                    size={24}
                                />
                            </div>
                            <ChevronRight
                                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                size={20}
                            />
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Available to Claim
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            RM {availablePayouts.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                            Ready for payout
                        </p>
                    </div>

                    {/* Pending Payouts */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Clock className="text-blue-600" size={24} />
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                            Pending Payouts
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">
                            RM {pendingPayouts.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Processing</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() =>
                            handleNavigate("/merchant/events/create")
                        }
                        className="bg-linear-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <div className="text-sm font-semibold uppercase tracking-wide text-orange-100 mb-2">
                                    Quick Action
                                </div>
                                <div className="text-xl font-bold mb-1">
                                    Create New Event
                                </div>
                                <div className="text-orange-100 text-sm">
                                    Start earning more today
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                                <CalendarClock size={28} />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleNavigate("/merchant/payouts")}
                        className="bg-linear-to-br from-yellow-400 to-yellow-500 text-yellow-900 rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <div className="text-sm font-semibold uppercase tracking-wide text-yellow-800 mb-2">
                                    Available Now
                                </div>
                                <div className="text-xl font-bold mb-1">
                                    Request Payout
                                </div>
                                <div className="text-yellow-800 text-sm">
                                    RM {availablePayouts.toFixed(2)} ready
                                </div>
                            </div>
                            <div className="bg-white/30 p-3 rounded-lg group-hover:bg-white/40 transition-colors">
                                <CreditCard size={28} />
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleNavigate("/merchant/events")}
                        className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <div className="text-sm font-semibold uppercase tracking-wide text-purple-100 mb-2">
                                    Manage
                                </div>
                                <div className="text-xl font-bold mb-1">
                                    View All Events
                                </div>
                                <div className="text-purple-100 text-sm">
                                    {activeEvents.length + pastEvents.length}{" "}
                                    total events
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                                <BarChart3 size={28} />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <CalendarClock
                                    className="text-orange-600"
                                    size={20}
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Upcoming Events
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {activeEvents.length} active events
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                handleNavigate(
                                    userRole === "admin"
                                        ? "/admin/events"
                                        : "/merchant/events"
                                )
                            }
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm hover:scale-105"
                        >
                            View All
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="p-6 grid md:grid-cols-3 gap-6">
                        {displayUpcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                onClick={() =>
                                    handleNavigate(
                                        userRole === "admin"
                                            ? `/admin/events/${event.id}`
                                            : `/merchant/events/${event.id}`
                                    )
                                }
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-xl hover:border-orange-300 hover:scale-105 transition-all cursor-pointer group"
                            >
                                <div className="relative h-32 bg-linear-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                                    {event?.media?.[0] ? (
                                        <img
                                            src={`/storage/${event.media[0].file_path}`}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <CalendarClock
                                            size={40}
                                            className="text-white opacity-50"
                                        />
                                    )}
                                </div>
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-base font-bold text-gray-900 line-clamp-2 flex-1">
                                        {event.title}
                                    </h3>
                                    <Eye
                                        className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                                        size={18}
                                    />
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    {event.dates?.[0] && (
                                        <div className="flex items-center gap-2">
                                            <Calendar
                                                size={14}
                                                className="text-orange-500 shrink-0"
                                            />
                                            <span className="truncate">
                                                {new Date(
                                                    event.dates[0].start_date
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {event.location?.location_name && (
                                        <div className="flex items-center gap-2">
                                            <Users
                                                size={14}
                                                className="text-orange-500 shrink-0"
                                            />
                                            <span className="truncate">
                                                {event.location.location_name}
                                            </span>
                                        </div>
                                    )}
                                    {event.category && (
                                        <div className="mt-2">
                                            <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">
                                                {event.category}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {activeEvents.length === 0 && (
                            <div className="col-span-3 text-center py-12 text-gray-500">
                                <CalendarClock
                                    className="mx-auto mb-3 text-gray-400"
                                    size={48}
                                />
                                <p className="text-lg font-semibold text-gray-900 mb-1">
                                    No active events
                                </p>
                                <p className="text-sm">
                                    Create your first event to get started
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bookings Section with Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Users
                                        className="text-green-600"
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Bookings
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {filteredBookings.length} bookings found
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <FilterButton
                                        active={bookingFilter === "today"}
                                        onClick={() =>
                                            setBookingFilter("today")
                                        }
                                    >
                                        Today
                                    </FilterButton>
                                    <FilterButton
                                        active={bookingFilter === "week"}
                                        onClick={() => setBookingFilter("week")}
                                    >
                                        Week
                                    </FilterButton>
                                    <FilterButton
                                        active={bookingFilter === "month"}
                                        onClick={() =>
                                            setBookingFilter("month")
                                        }
                                    >
                                        Month
                                    </FilterButton>
                                </div>
                                <button
                                    onClick={() =>
                                        handleNavigate(
                                            userRole === "admin"
                                                ? "/admin/bookings"
                                                : "/merchant/bookings"
                                        )
                                    }
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm hover:scale-105"
                                >
                                    View All
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by customer name, email, or booking ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white text-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                onClick={() =>
                                    handleNavigate(
                                        userRole === "admin"
                                            ? `/admin/bookings/${booking.id}`
                                            : `/merchant/bookings/${booking.id}`
                                    )
                                }
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-xl hover:border-orange-300 hover:scale-105 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
                                        {booking.event?.title || "Event"}
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {booking.quantity || 0}x
                                    </div>
                                </div>
                                <div className="text-base font-bold text-gray-900 mb-2 truncate">
                                    {booking.customer?.user?.full_name || "N/A"}
                                </div>
                                <div className="text-sm text-gray-600 truncate mb-2">
                                    {booking.customer?.user?.email || "N/A"}
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 font-mono">
                                        #{booking.id}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                        RM{" "}
                                        {booking.total_amount?.toFixed(2) ||
                                            "0.00"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredBookings.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-gray-400" size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                No bookings found
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {searchTerm
                                    ? "Try adjusting your search"
                                    : `No bookings for ${bookingFilter}`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MerchantDashboard;
