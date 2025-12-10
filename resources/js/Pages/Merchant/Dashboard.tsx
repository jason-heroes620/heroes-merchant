import { useMemo } from "react";
import { router } from "@inertiajs/react";
import BookingsSection from "../../components/dashboard/BookingsSection";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import QuickActions from "../../components/dashboard/QuickActions";
import RevenueCard from "../../components/dashboard/RevenueCard";
import StatsGrid from "../../components/dashboard/StatsGrid";
import UpcomingEventsGrid from "../../components/dashboard/UpcomingEventsGrid";
import type { EventType, BookingType } from "../../types/events";
import AuthenticatedLayout from "../../AuthenticatedLayout";

interface DashboardProps {
    activeEvents: EventType[];
    pastEvents: EventType[];
    allBookings: BookingType[];
    todayBookings: BookingType[];
    weekBookings: BookingType[];
    monthlySales: number;
    lastMonthSales: number;
    weeklyPercentageIncrease?: number;
    monthlyPercentageIncrease?: number;
    pendingPayouts: number;
    availablePayouts: number;
    totalBookingsThisMonth: number;
}

const MerchantDashboard: React.FC<DashboardProps> = ({
    activeEvents,
    pastEvents,
    allBookings,
    todayBookings,
    weekBookings,
    monthlySales,
    weeklyPercentageIncrease,
    monthlyPercentageIncrease,
    pendingPayouts,
    availablePayouts,
}) => {
    // Calculate monthly bookings locally since backend doesn't send it
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
            const d = new Date(b.booked_at || b.created_at);
            return d >= monthStart && d <= monthEnd;
        });
    }, [allBookings]);

    const weeklySales = useMemo(() => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return weekBookings.reduce(
            (sum, booking) => sum + (booking.total_amount || 0),
            0
        );
    }, [weekBookings]);

    return (
        <AuthenticatedLayout>
            <DashboardLayout title="Dashboard" userRole="merchant">
                {/* Revenue Section */}
                <RevenueCard
                    weeklySales={weeklySales}
                    monthlySales={monthlySales}
                    weeklyPercentage={weeklyPercentageIncrease ?? 0}
                    monthlyPercentage={monthlyPercentageIncrease ?? 0}
                />

                {/* Stats Section */}
                <StatsGrid
                    activeEvents={activeEvents.length}
                    todayBookings={todayBookings.length}
                    attendeesToday={todayBookings.reduce(
                        (s, b) => s + (b.quantity || 0),
                        0
                    )}
                    availablePayouts={availablePayouts}
                    pendingPayouts={pendingPayouts}
                    onEventsClick={() => router.visit("/merchant/events")}
                    onBookingsClick={() => router.visit("/merchant/bookings")}
                    onPayoutClick={() => router.visit("/merchant/payouts")}
                />

                {/* Quick Actions */}
                <QuickActions
                    availablePayouts={availablePayouts}
                    activeEventsCount={activeEvents.length}
                    pastEventsCount={pastEvents.length}
                    onCreateEvent={() =>
                        router.visit("/merchant/events/create")
                    }
                    onRequestPayout={() => router.visit("/merchant/payouts")}
                    onViewEvents={() => router.visit("/merchant/events")}
                />

                {/* Upcoming Events */}
                <UpcomingEventsGrid
                    events={activeEvents}
                    userRole="merchant"
                    onEventClick={(id) =>
                        router.visit(`/merchant/events/${id}`)
                    }
                />

                {/* Bookings */}
                <BookingsSection
                    todayBookings={todayBookings}
                    weekBookings={weekBookings}
                    monthBookings={monthBookings}
                    userRole="merchant"
                    onBookingClick={(id) =>
                        router.visit(`/merchant/bookings/${id}`)
                    }
                />
            </DashboardLayout>
        </AuthenticatedLayout>
    );
};

export default MerchantDashboard;
