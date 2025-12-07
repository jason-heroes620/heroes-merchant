import React, { useMemo, useState } from "react";
import { Users, X, ChevronRight } from "lucide-react";
import FilterButton from "./FilterButton";

interface BookingType {
    id: number;
    booked_at?: string;
    created_at?: string;
    customer?: { user?: { full_name?: string; email?: string } };
    event?: { title?: string };
    quantity?: number;
    total_amount?: number;
}

interface Props {
    todayBookings?: BookingType[];
    weekBookings?: BookingType[];
    monthBookings?: BookingType[];
    userRole: "admin" | "merchant";
    onBookingClick: (id: number) => void;
}

const BookingsSection: React.FC<Props> = ({
    todayBookings = [],
    weekBookings = [],
    monthBookings = [],
    userRole,
    onBookingClick,
}) => {
    const [bookingFilter, setBookingFilter] = useState<
        "today" | "week" | "month"
    >("today");
    const [searchTerm, setSearchTerm] = useState("");

    const safeToday = todayBookings ?? [];
    const safeWeek = weekBookings ?? [];
    const safeMonth = monthBookings ?? [];

    const filteredBookings = useMemo(() => {
        let bookings: BookingType[] = safeToday;

        if (bookingFilter === "week") bookings = safeWeek;
        if (bookingFilter === "month") bookings = safeMonth;

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            bookings = bookings.filter((b) => {
                const name = b.customer?.user?.full_name?.toLowerCase() ?? "";
                const email = b.customer?.user?.email?.toLowerCase() ?? "";
                return (
                    name.includes(search) ||
                    email.includes(search) ||
                    String(b.id).includes(search)
                );
            });
        }

        return bookings ?? [];
    }, [bookingFilter, searchTerm, safeToday, safeWeek, safeMonth]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Users className="text-green-600" size={20} />
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

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <FilterButton
                                active={bookingFilter === "today"}
                                onClick={() => setBookingFilter("today")}
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
                                onClick={() => setBookingFilter("month")}
                            >
                                Month
                            </FilterButton>
                        </div>

                        <button
                            onClick={() =>
                                (window.location.href =
                                    userRole === "admin"
                                        ? "/admin/bookings"
                                        : "/merchant/bookings")
                            }
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm hover:scale-105"
                        >
                            View All <ChevronRight size={16} />
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

            {/* Booking Cards */}
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((b) => (
                        <div
                            key={b.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onBookingClick(b.id)}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-xl hover:border-orange-300 hover:scale-105 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
                                    {b.event?.title ?? "Event"}
                                </div>
                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                    {b.quantity ?? 0}x
                                </div>
                            </div>

                            <div className="text-base font-bold text-gray-900 mb-2 truncate">
                                {b.customer?.user?.full_name ?? "N/A"}
                            </div>
                            <div className="text-sm text-gray-600 truncate mb-2">
                                {b.customer?.user?.email ?? "N/A"}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 font-mono">
                                    #{b.id}
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    RM {(b.total_amount ?? 0).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-12">
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
    );
};

export default BookingsSection;
