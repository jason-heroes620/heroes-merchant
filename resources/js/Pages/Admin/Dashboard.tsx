import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import {
    Users,
    Calendar,
    AlertCircle,
    Package,
    CheckCircle,
    XCircle,
    Award,
    Activity,
    Clock,
    ArrowRight,
    ArrowDownRight,
    ChevronRight,
    CalendarClock,
    RefreshCw,
    Settings,
    TrendingUp,
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
    Bar,
    ComposedChart,
} from "recharts";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { Conversion } from "@/types/events";

interface Package {
    id: number;
    name: string;
    price_in_rm: number;
    paid_credits: number;
    free_credits: number;
    active: boolean;
}

interface PeriodStats {
    events: {
        active: number;
        pending: number;
    };
    users: {
        newRegistrations: number;
        newReferrals: number;
        pendingMerchants: number;
    };
    bookings: {
        confirmed: number;
        cancelled: number;
        refunded: number;
    };
    financials: {
        totalPurchases: number;
        totalPayouts: number;
        netRevenue: number;
    };
}

interface ChartData {
    bookingsOverTime: Array<{
        date: string;
        count: number;
    }>;
    purchasesOverTime: Array<{
        date: string;
        amount: number;
        packages: Array<{
            package_name: string;
            count: number;
            amount: number;
        }>;
    }>;
    payoutTrend: Array<{
        amount: number;
    }>;
}

interface TopEvent {
    id: number;
    title: string;
    bookings_count: number;
    merchant?: {
        user?: {
            full_name?: string;
        };
    };
}

interface Activity {
    type: string;
    data: {
        title?: string;
        merchant?: {
            user?: {
                full_name?: string;
            };
        };
        event?: {
            title?: string;
        };
        customer?: {
            user?: {
                full_name?: string;
            };
        };
    };
    timestamp: string;
}

interface MerchantStat {
    merchant_id: number;
    name: string;
    email: string;
    total_events: number;
    total_earned: number;
}

interface PackageSale {
    package_name: string;
    price_in_rm: number;
    paid_credits: number;
    free_credits: number;
    total_sold: number;
    revenue: number;
}

interface CustomerStats {
    totalCustomers: number;
    activeCustomers: number;
    averageBookingsPerCustomer: number;
}

interface DashboardData {
    currentConversion: Conversion | null;
    currentPackages: Package[];
    period: {
        today: PeriodStats;
        week: PeriodStats;
        month: PeriodStats;
    };
    charts: ChartData;
    tables: {
        payoutRequests?: any[];
        topEvents: TopEvent[];
        recentActivity: Activity[];
    };
    merchantStats: MerchantStat[];
    customerStats: CustomerStats;
    packageSales: PackageSale[];
}

interface Props extends DashboardData {
    userRole: string;
    selectedMonth: string;
}

const AdminDashboard = ({
    currentConversion,
    period,
    charts,
    tables,
    merchantStats,
    packageSales,
    selectedMonth: initialSelectedMonth,
}: Props) => {
    const [chartView, setChartView] = useState<"bookings" | "packages">(
        "bookings"
    );
    const [periodFilter, setPeriodFilter] = useState<
        "today" | "week" | "month"
    >("week");

    const periodData = period[periodFilter];

    const availableMonths = useMemo(() => {
        const months = [];
        const now = new Date();

        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            const label = date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
            });

            months.push({ value, label });
        }

        return months;
    }, []);

    const selectedMonth = initialSelectedMonth || availableMonths[0].value;

    const selectedMonthDisplay = useMemo(() => {
        const [year, month] = selectedMonth.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    }, [selectedMonth]);

    const packagePerformanceChartData = useMemo(() => {
        if (!packageSales || !Array.isArray(packageSales)) {
            return [];
        }

        return packageSales
            .map((pkg) => ({
                name: pkg.package_name,
                sold: Number(pkg.total_sold) || 0,
                revenue: Number(pkg.revenue) || 0,
            }))
            .sort((a, b) => b.sold - a.sold);
    }, [packageSales]);

    const paidCredits = currentConversion
        ? Math.ceil(currentConversion.rm * currentConversion.credits_per_rm)
        : 0;

    const freeCredits = currentConversion
        ? Math.ceil(
              (paidCredits / currentConversion.paid_credit_percentage) *
                  currentConversion.free_credit_percentage
          )
        : 0;

    return (
        <AuthenticatedLayout>
            <DashboardLayout
                title="Admin Dashboard"
                userRole="admin"
                subtitle="Overview of platform performance and operations"
            >
                <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
                    {/* Action Required  */}
                    <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-orange-100 p-2.5 rounded-lg">
                                <AlertCircle
                                    className="text-orange-600"
                                    size={24}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Actions Required
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Review pending items and manage settings
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Merchant Verification */}
                            <a
                                href="/admin/merchants"
                                className="group bg-linear-to-br from-red-50 to-orange-50 rounded-lg p-5 border border-gray-200 hover:border-red-400 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
                                            <Users
                                                className="text-red-600"
                                                size={20}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-base">
                                                Merchant Verification
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {periodData.users
                                                    .pendingMerchants > 0
                                                    ? `${periodData.users.pendingMerchants} pending review`
                                                    : "All verified"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {periodData.users.pendingMerchants >
                                        0 ? (
                                            <>
                                                <span className="text-3xl font-bold text-red-600">
                                                    {
                                                        periodData.users
                                                            .pendingMerchants
                                                    }
                                                </span>
                                                <ChevronRight
                                                    className="text-red-600 group-hover:translate-x-1 transition-transform"
                                                    size={20}
                                                />
                                            </>
                                        ) : (
                                            <CheckCircle
                                                className="text-green-600"
                                                size={24}
                                            />
                                        )}
                                    </div>
                                </div>
                            </a>

                            {/* Event Approval */}
                            <a
                                href="/admin/events"
                                className="group bg-linear-to-br from-orange-50 to-yellow-50 rounded-lg p-5 border border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
                                            <Calendar
                                                className="text-orange-600"
                                                size={20}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-base">
                                                Event Approval
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {periodData.events.pending > 0
                                                    ? `${periodData.events.pending} awaiting review`
                                                    : "All approved"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {periodData.events.pending > 0 ? (
                                            <>
                                                <span className="text-3xl font-bold text-orange-600">
                                                    {periodData.events.pending}
                                                </span>
                                                <ChevronRight
                                                    className="text-orange-600 group-hover:translate-x-1 transition-transform"
                                                    size={20}
                                                />
                                            </>
                                        ) : (
                                            <CheckCircle
                                                className="text-green-600"
                                                size={24}
                                            />
                                        )}
                                    </div>
                                </div>
                            </a>

                            {/* System Configuration */}
                            <a
                                href="/admin/settings"
                                className="group bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                                            <Settings
                                                className="text-blue-600"
                                                size={20}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-base">
                                                System Configuration
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Manage platform settings
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight
                                        className="text-blue-600 group-hover:translate-x-1 transition-transform"
                                        size={20}
                                    />
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Period-Filtered Stats */}
                        <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp
                                            className="text-gray-400"
                                            size={18}
                                        />
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Performance Overview
                                        </p>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {periodFilter.charAt(0).toUpperCase() +
                                            periodFilter.slice(1)}{" "}
                                        Summary
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    {["today", "week", "month"].map(
                                        (period) => (
                                            <button
                                                key={period}
                                                onClick={() =>
                                                    setPeriodFilter(
                                                        period as any
                                                    )
                                                }
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    periodFilter === period
                                                        ? "bg-orange-500 text-white"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                                                }`}
                                            >
                                                {period
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    period.slice(1)}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Financial Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            Total Purchases
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        RM{" "}
                                        {periodData.financials.totalPurchases.toLocaleString(
                                            "en-MY",
                                            { minimumFractionDigits: 2 }
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            Total Payouts
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        RM{" "}
                                        {periodData.financials.totalPayouts.toLocaleString(
                                            "en-MY",
                                            { minimumFractionDigits: 2 }
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            Net Revenue
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        RM{" "}
                                        {periodData.financials.netRevenue.toLocaleString(
                                            "en-MY",
                                            { minimumFractionDigits: 2 }
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Activity Metrics */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            Active Events
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {periodData.events.active}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            Confirmed Bookings
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {periodData.bookings.confirmed}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                                        <p className="text-xs font-medium text-gray-600">
                                            New Users
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {periodData.users.newRegistrations}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Active Conversion */}
                        {currentConversion && (
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
                                    <div className="bg-orange-100 p-2 rounded-lg">
                                        <RefreshCw
                                            className="text-orange-600"
                                            size={18}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Active Conversion
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Current rate configuration
                                        </p>
                                    </div>
                                </div>

                                {/* Conversion Rate */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                        CONVERSION RATE
                                    </p>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-xl font-bold text-gray-900">
                                                RM 1
                                            </span>
                                            <ArrowRight
                                                className="text-orange-500"
                                                size={18}
                                            />
                                            <span className="text-xl font-bold text-orange-600">
                                                {paidCredits + freeCredits}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                credits
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Distribution */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                        CREDIT DISTRIBUTION
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {paidCredits} Paid Credits
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {
                                                    currentConversion.paid_credit_percentage
                                                }
                                                %
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {freeCredits} Free Credits
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {
                                                    currentConversion.free_credit_percentage
                                                }
                                                %
                                            </span>
                                        </div>
                                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                                            <div
                                                className="bg-blue-500"
                                                style={{
                                                    width: `${currentConversion.paid_credit_percentage}%`,
                                                }}
                                            />
                                            <div
                                                className="bg-green-500"
                                                style={{
                                                    width: `${currentConversion.free_credit_percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Conversion Rule */}
                                <div>
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                        <p className="text-xs text-amber-800 mb-2 text-center font-medium">
                                            When customer is short of free
                                            credits
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-blue-600">
                                                    {
                                                        currentConversion.paid_to_free_ratio
                                                    }{" "}
                                                    PAID
                                                </div>
                                            </div>
                                            <ArrowRight
                                                className="text-amber-600"
                                                size={16}
                                            />
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-green-600">
                                                    1 FREE
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Charts Section */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex flex-col gap-4 mb-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Trends & Analytics
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Viewing data for{" "}
                                        <span className="font-semibold text-orange-600">
                                            {selectedMonthDisplay}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) =>
                                                router.get(
                                                    route("admin.dashboard"),
                                                    { month: e.target.value },
                                                    {
                                                        preserveState: true,
                                                        replace: true,
                                                    }
                                                )
                                            }
                                            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                                        >
                                            {availableMonths.map((month) => (
                                                <option
                                                    key={month.value}
                                                    value={month.value}
                                                >
                                                    {month.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <svg
                                                className="w-5 h-5 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                setChartView("bookings")
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                chartView === "bookings"
                                                    ? "bg-orange-500 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            Bookings
                                        </button>
                                        <button
                                            onClick={() =>
                                                setChartView("packages")
                                            }
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                chartView === "packages"
                                                    ? "bg-orange-500 text-white shadow-md"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            Purchases & Packages
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={400}>
                            {chartView === "bookings" ? (
                                <LineChart data={charts.bookingsOverTime}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        stroke="#6b7280"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        stroke="#6b7280"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "white",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        name="Confirmed Bookings"
                                        dot={{ fill: "#f97316", r: 4 }}
                                    />
                                </LineChart>
                            ) : (
                                <ComposedChart
                                    data={packagePerformanceChartData}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={80}
                                        stroke="#6b7280"
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 12 }}
                                        label={{
                                            value: "Packages Sold",
                                            angle: -90,
                                            position: "insideLeft",
                                        }}
                                        domain={[0, "dataMax + 1"]}
                                        stroke="#6b7280"
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 12 }}
                                        domain={[0, "dataMax + 100"]}
                                        label={{
                                            value: "Revenue (RM)",
                                            angle: 90,
                                            position: "insideRight",
                                        }}
                                        stroke="#6b7280"
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (
                                                active &&
                                                payload &&
                                                payload.length
                                            ) {
                                                const data = payload[0].payload;
                                                // Find the matching package from packageSales
                                                const pkgDetails =
                                                    packageSales.find(
                                                        (p) =>
                                                            p.package_name ===
                                                            data.name
                                                    );

                                                return (
                                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                                                        <p className="font-bold text-gray-900 mb-2">
                                                            {data.name}
                                                        </p>
                                                        {pkgDetails && (
                                                            <>
                                                                <div className="text-xs text-gray-600 mb-2 pb-2 border-b border-gray-100">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span>
                                                                            Package
                                                                            Value:
                                                                        </span>
                                                                        <span className="font-semibold text-gray-900">
                                                                            RM{" "}
                                                                            {Number(
                                                                                pkgDetails.price_in_rm
                                                                            ).toLocaleString(
                                                                                "en-MY",
                                                                                {
                                                                                    minimumFractionDigits: 2,
                                                                                }
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mt-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                            <span className="text-blue-600 font-medium">
                                                                                {
                                                                                    pkgDetails.paid_credits
                                                                                }{" "}
                                                                                Paid
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                            <span className="text-green-600 font-medium">
                                                                                {
                                                                                    pkgDetails.free_credits
                                                                                }{" "}
                                                                                Free
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">
                                                                    Packages
                                                                    Sold:
                                                                </span>
                                                                <span className="font-semibold text-gray-900">
                                                                    {data.sold}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">
                                                                    Revenue:
                                                                </span>
                                                                <span className="font-semibold text-green-600">
                                                                    RM{" "}
                                                                    {Number(
                                                                        data.revenue
                                                                    ).toLocaleString(
                                                                        "en-MY",
                                                                        {
                                                                            minimumFractionDigits: 2,
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="sold"
                                        name="Packages Sold"
                                        radius={[6, 6, 0, 0]}
                                        fill="#fb923c"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Revenue"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Operational Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Merchants */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-50 p-2 rounded-lg">
                                        <Award
                                            className="text-orange-600"
                                            size={20}
                                        />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Top Merchants
                                    </h3>
                                </div>
                                <a
                                    href="/admin/merchants"
                                    className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View all <ChevronRight size={16} />
                                </a>
                            </div>
                            <div className="space-y-3">
                                {merchantStats
                                    .slice(0, 5)
                                    .map((merchant, idx) => (
                                        <div
                                            key={merchant.merchant_id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        {merchant.name}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {merchant.total_events}{" "}
                                                        events
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-green-600 text-sm">
                                                RM{" "}
                                                {merchant.total_earned.toLocaleString(
                                                    "en-MY",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Top Events */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-50 p-2 rounded-lg">
                                        <CalendarClock
                                            className="text-green-600"
                                            size={20}
                                        />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Top Events
                                    </h3>
                                </div>
                                <a
                                    href="/admin/events"
                                    className="text-orange-600 hover:text-orange-700 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                                >
                                    View all <ChevronRight size={16} />
                                </a>
                            </div>
                            <div className="space-y-3">
                                {tables.topEvents.map((event, idx) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                #{idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm truncate">
                                                    {event.title}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {event.merchant?.user
                                                        ?.full_name ||
                                                        "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-orange-600 text-sm ml-2">
                                            {event.bookings_count}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Activity
                                        className="text-gray-600"
                                        size={20}
                                    />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                                {tables.recentActivity.map((activity, idx) => {
                                    const getActivityConfig = (
                                        type: string
                                    ) => {
                                        if (type.includes("booking_confirmed"))
                                            return {
                                                icon: <CheckCircle size={16} />,
                                                color: "bg-green-100 text-green-600",
                                                label: "Booking Confirmed",
                                            };
                                        if (type.includes("event_active"))
                                            return {
                                                icon: <Calendar size={16} />,
                                                color: "bg-blue-100 text-blue-600",
                                                label: "Event Active",
                                            };
                                        if (type.includes("event_pending"))
                                            return {
                                                icon: <Clock size={16} />,
                                                color: "bg-orange-100 text-orange-600",
                                                label: "Event Pending",
                                            };
                                        if (type.includes("booking_cancelled"))
                                            return {
                                                icon: <XCircle size={16} />,
                                                color: "bg-red-100 text-red-600",
                                                label: "Booking Cancelled",
                                            };
                                        if (type.includes("booking_refunded"))
                                            return {
                                                icon: (
                                                    <ArrowDownRight size={16} />
                                                ),
                                                color: "bg-purple-100 text-purple-600",
                                                label: "Booking Refunded",
                                            };
                                        return {
                                            icon: <Activity size={16} />,
                                            color: "bg-gray-100 text-gray-600",
                                            label: "Activity",
                                        };
                                    };

                                    const config = getActivityConfig(
                                        activity.type
                                    );

                                    let userName = "Unknown";
                                    let eventTitle = "Unknown";

                                    if (activity.type.includes("event")) {
                                        userName =
                                            activity.data.merchant?.user
                                                ?.full_name ||
                                            "Unknown Merchant";
                                        eventTitle =
                                            activity.data.title ||
                                            "Unknown Event";
                                    } else if (
                                        activity.type.includes("booking")
                                    ) {
                                        userName =
                                            activity.data.customer?.user
                                                ?.full_name ||
                                            "Unknown Customer";
                                        eventTitle =
                                            activity.data.event?.title ||
                                            "Unknown Event";
                                    }

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
                                                <p className="font-semibold text-gray-900 text-xs">
                                                    {config.label}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {userName} • {eventTitle}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 shrink-0">
                                                {new Date(
                                                    activity.timestamp
                                                ).toLocaleString("en-MY", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </AuthenticatedLayout>
    );
};

export default AdminDashboard;
