import { useState } from "react";
import { router } from "@inertiajs/react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AdminStatsGrid from "../../components/dashboard/AdminStatsGrid";
import AdminChartsSection from "../../components/dashboard/AdminChartsSection";
import AdminPayoutRequests from "../../components/dashboard/AdminPayoutRequests";
import AdminQuickActions from "../../components/dashboard/AdminQuickActions";
import TopPerformingEvents from "../../components/dashboard/TopPerformingEvents";
import RecentActivityFeed from "../../components/dashboard/RecentActivityFeed";
import MerchantPerformanceTable from "../../components/dashboard/MerchantPerformanceTable";
import CustomerEngagementCard from "../../components/dashboard/CustomerEngagementCard";

interface ChartDataPoint {
    date: string;
    count?: number;
    amount?: number;
}

interface PayoutRequest {
    id: string;
    merchant: {
        user: {
            full_name: string;
            email: string;
        };
    };
    net_amount_in_rm: number;
    gross_amount_in_rm: number;
    platform_fee_in_rm: number;
    total_bookings: number;
    available_at: string;
    calculated_at: string;
    status: string;
}

interface Event {
    id: number;
    title: string;
    bookings_count: number;
    merchant: {
        user: {
            full_name: string;
        };
    };
    media?: Array<{ file_path: string }>;
    location?: {
        location_name: string;
    };
}

interface ActivityItem {
    type: "event_pending" | "booking_confirmed" | "payout_requested";
    data: any;
    timestamp: string;
}

interface MerchantStat {
    merchant_id: string;
    name: string;
    email: string;
    total_events: number;
    total_earned: number;
}

interface CustomerStats {
    totalCustomers: number;
    activeCustomers: number;
    averageBookingsPerCustomer: number;
}

interface AdminDashboardProps {
    stats: {
        activeEvents: number;
        pendingEvents: number;
        newSignups7: number;
        newSignups30: number;
        totalPurchasesRm: number;
        totalBookings: number;
        payoutPending: number;
        payoutPaid: number;
        payoutTotal: number;
        netEarnings: number;
    };
    charts: {
        bookingsOverTime: ChartDataPoint[];
        purchasesOverTime: ChartDataPoint[];
        payoutTrend: ChartDataPoint[];
    };
    payoutRequests: PayoutRequest[];
    topEvents?: Event[];
    recentActivity?: ActivityItem[];
    merchantStats?: MerchantStat[];
    customerStats?: CustomerStats;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    stats,
    charts,
    payoutRequests,
    topEvents = [],
    recentActivity = [],
    merchantStats = [],
    customerStats = {
        totalCustomers: 0,
        activeCustomers: 0,
        averageBookingsPerCustomer: 0,
    },
}) => {
    const [signupFilter, setSignupFilter] = useState<7 | 30>(7);

    const handleActivityClick = (activity: ActivityItem) => {
        switch (activity.type) {
            case "event_pending":
                router.visit(`/admin/events`);
                break;
            case "booking_confirmed":
                router.visit(`/admin/bookings/${activity.data.id}`);
                break;
            case "payout_requested":
                router.visit(`/admin/payouts/${activity.data.id}`);
                break;
        }
    };

    return (
        <DashboardLayout title="Dashboard" userRole="admin">
            {/* Stats Overview */}
            <AdminStatsGrid
                stats={stats}
                signupFilter={signupFilter}
                onSignupFilterChange={setSignupFilter}
                onEventsClick={() => router.visit("/admin/events")}
                onPendingEventsClick={() =>
                    router.visit("/admin/events?filter=pending")
                }
                onBookingsClick={() => router.visit("/admin/bookings")}
                onPayoutsClick={() => router.visit("/admin/payouts")}
            />

            {/* Quick Actions */}
            <AdminQuickActions
                pendingEvents={stats.pendingEvents}
                pendingPayouts={stats.payoutPending}
                totalUsers={stats.newSignups30}
                onReviewEvents={() =>
                    router.visit("/admin/events?filter=pending")
                }
                onProcessPayouts={() => router.visit("/admin/payouts")}
                onViewUsers={() => router.visit("/admin/users")}
                onViewReports={() => router.visit("/admin/reports")}
            />

            {/* Charts Section */}
            <AdminChartsSection charts={charts} />

            {/* Two Column Layout for Activity & Customer Engagement */}
            <div className="grid lg:grid-cols-2 gap-6">
                <RecentActivityFeed
                    activities={recentActivity}
                    onActivityClick={handleActivityClick}
                />

                <CustomerEngagementCard
                    stats={customerStats}
                    onViewCustomers={() => router.visit("/admin/customers")}
                />
            </div>

            {/* Top Performing Events */}
            {topEvents.length > 0 && (
                <TopPerformingEvents
                    events={topEvents}
                    onEventClick={(id) =>
                        router.visit(`/dashboard/events/${id}`)
                    }
                />
            )}

            {/* Merchant Performance Table */}
            {merchantStats.length > 0 && (
                <MerchantPerformanceTable
                    merchants={merchantStats}
                    onMerchantClick={(id) =>
                        router.visit(`/admin/merchants/${id}`)
                    }
                />
            )}

            {/* Payout Requests Table */}
            {payoutRequests.length > 0 && (
                <AdminPayoutRequests
                    requests={payoutRequests}
                    onApprove={(id) => {
                        if (
                            confirm(
                                "Are you sure you want to approve this payout?"
                            )
                        ) {
                            router.post(
                                `/admin/payouts/${id}/approve`,
                                {},
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        // Show success notification
                                        alert("Payout approved successfully!");
                                    },
                                    onError: () => {
                                        alert("Failed to approve payout");
                                    },
                                }
                            );
                        }
                    }}
                    onReject={(id) => {
                        const reason = prompt(
                            "Please provide a reason for rejection:"
                        );
                        if (reason) {
                            router.post(
                                `/payouts/${id}/reject`,
                                { reason },
                                {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        alert("Payout rejected successfully!");
                                    },
                                    onError: () => {
                                        alert("Failed to reject payout");
                                    },
                                }
                            );
                        }
                    }}
                    onViewDetails={(id) =>
                        router.visit(`/payouts/${id}`)
                    }
                />
            )}
        </DashboardLayout>
    );
};

export default AdminDashboard;
