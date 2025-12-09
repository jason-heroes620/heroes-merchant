import React, { useState } from "react";
import {
    TrendingUp,
    Users,
    Calendar,
    DollarSign,
    AlertCircle,
    Package,
    CheckCircle,
    XCircle,
    Award,
    Activity,
    Clock,
    ArrowUpRight,
    ChevronRight,
    CalendarClock,
    RefreshCw,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FilterButton from "@/components/dashboard/FilterButton";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface PeriodData {
    events: { active: number; pending: number };
    users: {
        newRegistrations: number;
        newReferrals: number;
        pendingMerchants: number;
    };
    bookings: { confirmed: number; cancelled: number; refunded: number };
    financials: {
        totalPurchases: number;
        totalPayouts: number;
        netRevenue: number;
    };
}

interface Conversion {
    id: string;
    credits_per_rm: number;
    paid_credit_percentage: number;
    free_credit_percentage: number;
    effective_from: string;
    valid_until: string | null;
    status: string;
}

interface PurchasePackage {
    id: string;
    name: string;
    price_in_rm: number;
    paid_credits: number;
    free_credits: number;
    effective_from: string;
    valid_until: string | null;
    active: boolean;
}

interface DashboardProps {
    currentConversions: Conversion[];
    currentPackages: PurchasePackage[];
    period: {
        today: PeriodData;
        week: PeriodData;
        month: PeriodData;
    };
    charts: {
        bookingsOverTime: Array<{ date: string; count: number }>;
        purchasesOverTime: Array<{ date: string; amount: number }>;
        payoutTrend: Array<{ date: string; amount: number }>;
    };
    tables: {
        payoutRequests: any[];
        topEvents: any[];
        recentActivity: any[];
    };
    merchantStats: Array<{
        merchant_id: number;
        name: string;
        email: string;
        total_events: number;
        total_earned: number;
    }>;
    customerStats: {
        totalCustomers: number;
        activeCustomers: number;
        averageBookingsPerCustomer: number;
    };
    packageSales: Array<{
        package_name: string;
        price_in_rm: number;
        paid_credits: number;
        free_credits: number;
        total_sold: number;
        revenue: number;
    }>;
}

type Period = "today" | "week" | "month";

const AdminDashboard: React.FC<DashboardProps> = ({
    currentConversions,
    currentPackages,
    period,
    charts,
    tables,
    merchantStats,
    customerStats,
    packageSales,
}) => {
    const [periodFilter, setPeriodFilter] = useState<Period>("week");
    const [chartTab, setChartTab] = useState<
        "bookings" | "purchases" | "payouts"
    >("bookings");

    const currentPeriodData = period[periodFilter];

    const refundRate =
        currentPeriodData.bookings.confirmed > 0
            ? (
                  (currentPeriodData.bookings.refunded /
                      currentPeriodData.bookings.confirmed) *
                  100
              ).toFixed(1)
            : "0.0";

    const activeConversion = currentConversions[0];

    // Calculate free credits for conversion
    const freeCredits = activeConversion
        ? (activeConversion.credits_per_rm /
              activeConversion.paid_credit_percentage) *
          activeConversion.free_credit_percentage
        : 0;

    // Calculate percentage changes
    const getPreviousPeriodData = () => {
        if (periodFilter === "today") return period.week; // Compare today to week average
        if (periodFilter === "week") return period.month; // Compare week to month average
        return period.month; // For month, we'd need lastMonth data from backend
    };

    const previousData = getPreviousPeriodData();
    const revenueChange =
        previousData.financials.totalPurchases > 0
            ? ((currentPeriodData.financials.totalPurchases -
                  previousData.financials.totalPurchases) /
                  previousData.financials.totalPurchases) *
              100
            : 0;
    const bookingsChange =
        previousData.bookings.confirmed > 0
            ? ((currentPeriodData.bookings.confirmed -
                  previousData.bookings.confirmed) /
                  previousData.bookings.confirmed) *
              100
            : 0;

    return (
        <AuthenticatedLayout>
            <DashboardLayout userRole="admin" title="Admin Dashboard">
                {/* Revenue Card - Full Width */}
                <div className="bg-linear-to-r from-orange-400 via-orange-500 to-red-500 text-white rounded-2xl p-8 relative hover:shadow-2xl transition-all hover:scale-[1.01] group">
                    <div className="absolute top-0 right-0 opacity-10">
                        <DollarSign size={120} className="text-yellow-100" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold uppercase tracking-wide text-orange-100">
                                Total Revenue
                            </span>
                            <div className="flex items-center gap-2">
                                <FilterButton
                                    active={periodFilter === "today"}
                                    onClick={() => setPeriodFilter("today")}
                                >
                                    Today
                                </FilterButton>
                                <FilterButton
                                    active={periodFilter === "week"}
                                    onClick={() => setPeriodFilter("week")}
                                >
                                    Week
                                </FilterButton>
                                <FilterButton
                                    active={periodFilter === "month"}
                                    onClick={() => setPeriodFilter("month")}
                                >
                                    Month
                                </FilterButton>
                            </div>
                        </div>
                        <p className="text-6xl font-bold mb-3">
                            RM{" "}
                            {currentPeriodData.financials.totalPurchases.toLocaleString(
                                "en-MY",
                                { minimumFractionDigits: 2 }
                            )}
                        </p>
                        <div className="flex items-center gap-4 text-orange-100">
                            <div className="flex gap-2 items-center">
                                <TrendingUp size={18} />
                                <span className="font-semibold">
                                    {revenueChange.toFixed(1)}%
                                </span>
                            </div>
                            <span>vs last {periodFilter}</span>
                            <span className="ml-4">•</span>
                            <span className="font-semibold">
                                Net: RM{" "}
                                {currentPeriodData.financials.netRevenue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Active Events */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Calendar
                                    className="text-orange-600"
                                    size={24}
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">
                                    {currentPeriodData.events.active}
                                </p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">
                                    Active Events
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Confirmed Bookings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <CheckCircle
                                    className="text-green-600"
                                    size={24}
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">
                                    {currentPeriodData.bookings.confirmed}
                                </p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">
                                    Bookings
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <ArrowUpRight size={16} />
                            {bookingsChange}%
                        </div>
                    </div>

                    {/* Total Customers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Users className="text-blue-600" size={24} />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">
                                    {customerStats.totalCustomers}
                                </p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">
                                    Customers
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {customerStats.activeCustomers} active
                        </p>
                    </div>

                    {/* Active Packages */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Package
                                    className="text-purple-600"
                                    size={24}
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">
                                    {currentPackages.length}
                                </p>
                                <p className="text-xs text-gray-600 uppercase font-semibold">
                                    Packages
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {packageSales.reduce(
                                (sum, p) => sum + p.total_sold,
                                0
                            )}{" "}
                            sold
                        </p>
                    </div>
                </div>

                {/* Action Required */}
                <div className="bg-linear-to-r from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-red-600" size={28} />
                        <h3 className="text-xl font-bold text-gray-900">
                            Action Required
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <a
                            href="/admin/merchants"
                            className="bg-white border-2 border-red-300 rounded-lg p-4 hover:shadow-md hover:border-red-400 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        Pending Merchants
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Needs verification
                                    </p>
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    {currentPeriodData.users.pendingMerchants}
                                </p>
                            </div>
                        </a>

                        <a
                            href="/admin/events"
                            className="bg-white border-2 border-yellow-300 rounded-lg p-4 hover:shadow-md hover:border-yellow-400 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        Pending Events
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Awaiting approval
                                    </p>
                                </div>
                                <p className="text-3xl font-bold text-yellow-600">
                                    {currentPeriodData.events.pending}
                                </p>
                            </div>
                        </a>

                        <a
                            href="/admin/payouts"
                            className="bg-white border-2 border-orange-300 rounded-lg p-4 hover:shadow-md hover:border-orange-400 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        Payout Requests
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Needs processing
                                    </p>
                                </div>
                                <p className="text-3xl font-bold text-orange-600">
                                    {tables.payoutRequests.length}
                                </p>
                            </div>
                        </a>

                        <a
                            href="/admin/packages"
                            className="bg-white border-2 border-blue-300 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        Expiring Soon
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Packages & conversions
                                    </p>
                                </div>
                                <p className="text-3xl font-bold text-blue-600">
                                    0
                                </p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - User Stats */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Users className="text-blue-600" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                User Statistics
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        New Registrations
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This {periodFilter}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {currentPeriodData.users.newRegistrations}
                                </p>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        New Referrals
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        This {periodFilter}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-orange-600">
                                    {currentPeriodData.users.newReferrals}
                                </p>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Avg Bookings/Customer
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        All time
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {customerStats.averageBookingsPerCustomer}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Booking Stats */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <Activity
                                    className="text-green-600"
                                    size={20}
                                />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Booking Performance
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-3xl font-bold text-green-600">
                                    {currentPeriodData.bookings.confirmed}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Confirmed
                                </p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-3xl font-bold text-red-600">
                                    {currentPeriodData.bookings.cancelled}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Cancelled
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <p className="text-3xl font-bold text-orange-600">
                                    {currentPeriodData.bookings.refunded}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Refunded
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-3xl font-bold text-gray-900">
                                    {refundRate}%
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Refund Rate
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">
                        Financial Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-2">
                                Total Purchases
                            </p>
                            <p className="text-3xl font-bold text-green-600">
                                RM{" "}
                                {currentPeriodData.financials.totalPurchases.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                This {periodFilter}
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm text-gray-600 mb-2">
                                Total Payouts
                            </p>
                            <p className="text-3xl font-bold text-red-600">
                                RM{" "}
                                {currentPeriodData.financials.totalPayouts.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                {tables.payoutRequests.length} pending
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-600 mb-2">
                                Net Revenue
                            </p>
                            <p className="text-3xl font-bold text-purple-600">
                                RM{" "}
                                {currentPeriodData.financials.netRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                After payouts
                            </p>
                        </div>
                    </div>
                </div>

                {/* Charts Section with Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            Trends & Analytics
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartTab("bookings")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    chartTab === "bookings"
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Bookings
                            </button>
                            <button
                                onClick={() => setChartTab("purchases")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    chartTab === "purchases"
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Purchases
                            </button>
                            <button
                                onClick={() => setChartTab("payouts")}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    chartTab === "payouts"
                                        ? "bg-orange-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Payouts
                            </button>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        {chartTab === "bookings" && (
                            <LineChart data={charts.bookingsOverTime}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    name="Bookings"
                                />
                            </LineChart>
                        )}
                        {chartTab === "purchases" && (
                            <LineChart data={charts.purchasesOverTime}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Amount (RM)"
                                />
                            </LineChart>
                        )}
                        {chartTab === "payouts" && (
                            <LineChart data={charts.payoutTrend}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Payout (RM)"
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Conversion */}
                    {activeConversion && (
                        <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <RefreshCw
                                        className="text-blue-600"
                                        size={20}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Current Conversion Rate
                                </h3>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg p-4 text-center">
                                    <p className="text-xs text-gray-500 uppercase mb-2">
                                        RM
                                    </p>
                                    <p className="text-4xl font-bold text-orange-600">
                                        1
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 text-center">
                                    <p className="text-xs text-gray-500 uppercase mb-2">
                                        Paid Credits
                                    </p>
                                    <p className="text-4xl font-bold text-orange-600">
                                        {activeConversion.credits_per_rm}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 text-center">
                                    <p className="text-xs text-gray-500 uppercase mb-2">
                                        Free Credits
                                    </p>
                                    <p className="text-4xl font-bold text-blue-600">
                                        {Math.ceil(freeCredits)}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-blue-200 space-y-1 text-sm text-gray-600">
                                <p>
                                    Ratio:{" "}
                                    {activeConversion.paid_credit_percentage}%
                                    paid /{" "}
                                    {activeConversion.free_credit_percentage}%
                                    free
                                </p>
                                <p>
                                    Effective from:{" "}
                                    {new Date(
                                        activeConversion.effective_from
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Package Sales Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <Package
                                    className="text-purple-600"
                                    size={20}
                                />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Package Sales
                            </h3>
                        </div>

                        {/* Packages List */}
                        <div className="space-y-4">
                            {packageSales.slice(0, 3).map((pkg) => (
                                <div
                                    key={pkg.package_name}
                                    className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold text-gray-900 text-lg">
                                                    {pkg.package_name}
                                                </p>
                                                <p className="text-gray-600 text-xl">
                                                    RM{" "}
                                                    {pkg.price_in_rm.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <p className="font-bold text-orange-600 text-lg">
                                                    {pkg.paid_credits}
                                                </p>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Paid Credits
                                                </p>

                                                <p className="font-bold text-blue-600 text-lg">
                                                    {pkg.free_credits}
                                                </p>
                                                <p className="text-xs text-gray-500 uppercase">
                                                    Free Credits
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right ml-6 shrink-0">
                                            <p className="font-bold text-green-600 text-xl">
                                                RM{" "}
                                                {pkg.revenue.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {pkg.total_sold} sold
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Merchants */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Award
                                        className="text-orange-600"
                                        size={20}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Top Merchants
                                </h3>
                            </div>
                            <a
                                href="/admin/merchants"
                                className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1"
                            >
                                <ChevronRight size={16} />
                            </a>
                        </div>
                        <div className="space-y-3">
                            {merchantStats.slice(0, 5).map((merchant, idx) => (
                                <div
                                    key={merchant.merchant_id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-sm">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {merchant.name}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {merchant.total_events} events
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-600 text-sm">
                                        RM{" "}
                                        {merchant.total_earned.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Events */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <CalendarClock
                                        className="text-green-600"
                                        size={20}
                                    />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Top Events
                                </h3>
                            </div>
                            <a
                                href="/admin/events"
                                className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1"
                            >
                                <ChevronRight size={16} />
                            </a>
                        </div>
                        <div className="space-y-3">
                            {tables.topEvents.slice(0, 5).map((event, idx) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                                                {event.title}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {
                                                    event.merchant?.user
                                                        ?.full_name
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-orange-600 text-sm">
                                        {event.bookings_count}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gray-100 p-2 rounded-lg">
                                <Activity className="text-gray-600" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Recent Activity
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {tables.recentActivity
                                .slice(0, 5)
                                .map((activity, idx) => {
                                    const getActivityConfig = (
                                        type: string
                                    ) => {
                                        if (type.includes("booking_confirmed"))
                                            return {
                                                icon: <CheckCircle size={18} />,
                                                color: "bg-green-100 text-green-600",
                                                label: "Booking Confirmed",
                                            };
                                        if (type.includes("event_active"))
                                            return {
                                                icon: <Calendar size={18} />,
                                                color: "bg-blue-100 text-blue-600",
                                                label: "Event Approved",
                                            };
                                        if (type.includes("booking_cancelled"))
                                            return {
                                                icon: <XCircle size={18} />,
                                                color: "bg-red-100 text-red-600",
                                                label: "Booking Cancelled",
                                            };
                                        if (type.includes("event_pending"))
                                            return {
                                                icon: <Clock size={18} />,
                                                color: "bg-orange-100 text-orange-600",
                                                label: "New Event",
                                            };
                                        return {
                                            icon: <Activity size={18} />,
                                            color: "bg-gray-100 text-gray-600",
                                            label: "Activity",
                                        };
                                    };

                                    const config = getActivityConfig(
                                        activity.type
                                    );
                                    const time = new Date(
                                        activity.timestamp
                                    ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        timeZone: "Asia/Kuala_Lumpur",
                                    });

                                    // Get person's name based on activity type
                                    const personName = activity.type.includes(
                                        "booking"
                                    )
                                        ? activity.data.customer?.user
                                              ?.full_name
                                        : activity.data.merchant?.user
                                              ?.full_name;

                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div
                                                className={`p-2 rounded-full ${config.color} shrink-0`}
                                            >
                                                {config.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {config.label}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {personName &&
                                                        `${personName} • `}
                                                    {activity.data.event
                                                        ?.title ||
                                                        activity.data.title}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 shrink-0">
                                                {time}
                                            </p>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthenticatedLayout>
    );
};

export default AdminDashboard;
