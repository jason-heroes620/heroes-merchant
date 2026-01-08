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
    monthBookings: BookingType[];
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    todayPercentage: number;
    weekPercentage: number;
    monthPercentage: number;
    thisMonthPayout: number;
    payoutDate: string;
}

const MerchantDashboard: React.FC<DashboardProps> = ({
    activeEvents = [],
    pastEvents = [],
    todayBookings = [],
    weekBookings = [],
    monthBookings = [],
    todayRevenue = 0,
    weekRevenue = 0,
    monthRevenue = 0,
    todayPercentage = 0,
    weekPercentage = 0,
    monthPercentage = 0,
    thisMonthPayout = 0,
    payoutDate = "",
}) => {
    return (
        <AuthenticatedLayout>
            <DashboardLayout
                title="Merchant Dashboard"
                userRole="merchant"
                subtitle="Welcome back! Here's your business overview"
            >
                {/* Revenue Section */}
                <RevenueCard
                    todayRevenue={todayRevenue ?? 0}
                    weekRevenue={weekRevenue ?? 0}
                    monthRevenue={monthRevenue ?? 0}
                    todayPercentage={todayPercentage ?? 0}
                    weekPercentage={weekPercentage ?? 0}
                    monthPercentage={monthPercentage ?? 0}
                />

                {/* Stats Section */}
                <StatsGrid
                    activeEvents={activeEvents?.length ?? 0}
                    monthBookings={monthBookings?.length ?? 0}
                    thisMonthPayout={thisMonthPayout ?? 0}
                    payoutDate={payoutDate ?? ""}
                    onEventsClick={() => router.visit("/merchant/events")}
                    onBookingsClick={() => router.visit("/merchant/bookings")}
                />

                {/* Quick Actions */}
                <QuickActions
                    activeEventsCount={activeEvents?.length ?? 0}
                    pastEventsCount={pastEvents?.length ?? 0}
                    onCreateEvent={() =>
                        router.visit("/merchant/events/create")
                    }
                    onViewEvents={() => router.visit("/merchant/events")}
                    onViewPayouts={() => router.visit("/merchant/payouts")}
                />

                {/* Upcoming Events */}
                <UpcomingEventsGrid
                    events={activeEvents ?? []}
                    userRole="merchant"
                    onEventClick={(id) =>
                        router.visit(`/merchant/events/${id}`)
                    }
                />

                {/* Bookings */}
                <BookingsSection
                    todayBookings={todayBookings ?? []}
                    weekBookings={weekBookings ?? []}
                    monthBookings={monthBookings ?? []}
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
