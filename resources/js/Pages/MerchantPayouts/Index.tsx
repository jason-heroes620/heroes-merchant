import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import {
    Calendar,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    Filter,
    Download,
    CreditCard,
    Sparkles,
    Trophy,
    ArrowUp,
    ChevronDown,
    ChevronUp,
    Users,
} from "lucide-react";
import AuthenticatedLayout from "../../AuthenticatedLayout";

type BookingItem = {
    age_group: string;
    quantity: number;
    attended: number;
    price_per_unit?: number;
    free_credits?: number;
    paid_credits?: number;
};

type BookingDetail = {
    booking_id: string;
    booking_code: string;
    items: BookingItem[];
};

type Payout = {
    id: string;
    event_title: string;
    date_display: string;
    total_amount: string;
    status: string;
    available_at: string;
    merchant_name?: string;
    total_bookings?: number;
    total_paid_credits?: number;
    booking_details?: BookingDetail[];
};

type Merchant = {
    id: string;
    company_name: string;
};

type Props = {
    payouts: { data: Payout[]; links: any[] };
    role: "admin" | "merchant";
    merchants?: Merchant[];
    selectedMerchant?: string;
    summary?: {
        total_amount: string;
        pending: string;
        paid: string;
    };
};

const MerchantPayoutsIndex: React.FC<Props> = ({
    payouts,
    role,
    merchants = [],
    selectedMerchant,
    summary = { total_amount: "0", pending: "0", paid: "0" },
}) => {
    const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
    const [expandedPayouts, setExpandedPayouts] = useState<string[]>([]);
    const [filterMerchant, setFilterMerchant] = useState<string | undefined>(
        selectedMerchant
    );

    const togglePayout = (id: string) => {
        setSelectedPayouts((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedPayouts((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (eventPayouts: Payout[]) => {
        const eligibleIds = eventPayouts
            .filter((p) => p.status === "pending")
            .map((p) => p.id);

        const allSelected = eligibleIds.every((id) =>
            selectedPayouts.includes(id)
        );

        if (allSelected) {
            setSelectedPayouts((prev) =>
                prev.filter((id) => !eligibleIds.includes(id))
            );
        } else {
            setSelectedPayouts((prev) => [
                ...new Set([...prev, ...eligibleIds]),
            ]);
        }
    };

    const handleRequestPayout = () => {
        if (!selectedPayouts.length) {
            toast.error("No payouts selected");
            return;
        }

        const routePrefix = role === "admin" ? "/admin" : "/merchant";
        const url = `${routePrefix}/payouts/request`;

        router.post(
            url,
            { payout_ids: selectedPayouts },
            {
                onSuccess: () => {
                    toast.success("Payout request submitted successfully!");
                    setSelectedPayouts([]);
                },
                onError: (errors: any) => {
                    console.error(errors);
                    toast.error(errors.message || "Failed to request payouts");
                },
            }
        );
    };

    const exportPdf = () => {
        const routePrefix = role === "admin" ? "/admin" : "/merchant";
        let url = `${routePrefix}/payouts/export-pdf`;

        // Build query parameters
        const params = new URLSearchParams();

        if (selectedPayouts.length > 0) {
            selectedPayouts.forEach((id) => {
                params.append("payout_ids[]", id);
            });
        }

        if (filterMerchant && role === "admin") {
            params.append("merchant_id", filterMerchant);
        }

        // Open in new window/tab for download
        const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
        window.open(fullUrl, "_blank");

        toast.success("Generating PDF report...");
    };

    const handleMarkPaid = (payoutId: string) => {
        if (!confirm("Mark this payout as paid?")) return;
        router.post(
            `/admin/payouts/${payoutId}/mark-paid`,
            {},
            {
                preserveState: true,
                onSuccess: () => {
                    toast.success("Payout marked as paid!");
                },
                onError: () => {
                    toast.error("Failed to mark payout as paid");
                },
            }
        );
    };

    const statusConfig: Record<
        string,
        { bg: string; text: string; icon: any; label: string }
    > = {
        locked: {
            bg: "bg-gray-100",
            text: "text-gray-700",
            icon: Clock,
            label: "Locked",
        },
        pending: {
            bg: "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200",
            text: "text-yellow-700",
            icon: Sparkles,
            label: "Available",
        },
        requested: {
            bg: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200",
            text: "text-blue-700",
            icon: Clock,
            label: "Requested",
        },
        paid: {
            bg: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200",
            text: "text-green-700",
            icon: CheckCircle,
            label: "Paid",
        },
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const config = statusConfig[status] || statusConfig.pending;

        return (
            <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
            >
                {config.label}
            </div>
        );
    };

    const handleMerchantFilter = (id: string) => {
        setFilterMerchant(id);
        router.visit("/admin/payouts", {
            data: { merchant_id: id },
            preserveState: true,
            replace: true,
        });
    };

    const grouped = payouts.data.reduce((acc: Record<string, Payout[]>, p) => {
        if (!acc[p.event_title]) acc[p.event_title] = [];
        acc[p.event_title].push(p);
        return acc;
    }, {});

    const selectedTotal = payouts.data
        .filter((p) => selectedPayouts.includes(p.id))
        .reduce((sum, p) => sum + Number(p.total_amount.replace(/,/g, "")), 0);

    const pendingCount = payouts.data.filter(
        (p) => p.status === "pending"
    ).length;

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-xl">
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {role === "merchant" && (
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                                        <Trophy
                                            className="text-yellow-50"
                                            size={40}
                                        />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                        {role === "admin"
                                            ? "Merchant Payouts"
                                            : "My Earnings"}
                                    </h1>
                                    <p className="text-orange-100 text-lg">
                                        {role === "admin"
                                            ? "Manage and process merchant payouts"
                                            : "Your success and rewards! "}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={exportPdf}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all hover:scale-105 font-medium"
                            >
                                <Download size={20} />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Summary Cards - Merchant View */}
                    {role === "merchant" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Total Earnings - Hero Card */}
                            <div className="md:col-span-1 bg-linear-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 opacity-10">
                                    <Trophy
                                        className="text-yellow-100"
                                        size={100}
                                    />
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm font-semibold uppercase tracking-wide text-orange-100">
                                            Total Earnings
                                        </span>
                                    </div>
                                    <p className="text-5xl font-bold mb-2">
                                        RM{" "}
                                        {(
                                            Number(
                                                summary.total_amount.replace(
                                                    /,/g,
                                                    ""
                                                )
                                            ) || 0
                                        ).toFixed(2)}
                                    </p>
                                    <p className="text-orange-100 flex items-center gap-2">
                                        <ArrowUp size={16} />
                                        <span>Keep up the great work!</span>
                                    </p>
                                </div>
                            </div>

                            {/* Pending Card */}
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 p-6 hover:shadow-xl transition-all hover:scale-105">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        Ready to Claim
                                    </span>
                                    <div className="bg-yellow-100 p-2 rounded-xl">
                                        <Sparkles
                                            className="text-yellow-600"
                                            size={20}
                                        />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-yellow-600 mb-1">
                                    RM{" "}
                                    {(
                                        Number(
                                            summary.pending.replace(/,/g, "")
                                        ) || 0
                                    ).toFixed(2)}
                                </p>
                                {pendingCount > 0 && (
                                    <p className="text-xs text-yellow-700 font-medium bg-yellow-50 px-2 py-1 rounded-full inline-block">
                                        {pendingCount} slot(s) available
                                    </p>
                                )}
                            </div>

                            {/* Paid Card */}
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6 hover:shadow-xl transition-all hover:scale-105">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        Already Paid
                                    </span>
                                    <div className="bg-green-100 p-2 rounded-xl">
                                        <CheckCircle
                                            className="text-green-600"
                                            size={20}
                                        />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-600 mb-1">
                                    RM{" "}
                                    {(
                                        Number(
                                            summary.paid.replace(/,/g, "")
                                        ) || 0
                                    ).toFixed(2)}
                                </p>
                                <p className="text-xs text-green-700">
                                    Successfully received
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards - Admin View */}
                    {role === "admin" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 font-medium">
                                        Total Payouts
                                    </span>
                                    <TrendingUp
                                        className="text-orange-500"
                                        size={24}
                                    />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    RM{" "}
                                    {(
                                        Number(
                                            summary.total_amount.replace(
                                                /,/g,
                                                ""
                                            )
                                        ) || 0
                                    ).toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 font-medium">
                                        Pending
                                    </span>
                                    <Clock
                                        className="text-yellow-500"
                                        size={24}
                                    />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    RM{" "}
                                    {(
                                        Number(
                                            summary.pending.replace(/,/g, "")
                                        ) || 0
                                    ).toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600 font-medium">
                                        Paid Out
                                    </span>
                                    <CheckCircle
                                        className="text-green-500"
                                        size={24}
                                    />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                    RM{" "}
                                    {(
                                        Number(
                                            summary.paid.replace(/,/g, "")
                                        ) || 0
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Filters - Admin Only */}
                    {role === "admin" && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-center gap-4">
                                <Filter className="text-gray-400" size={20} />
                                <label className="text-sm font-medium text-gray-700">
                                    Filter by Merchant:
                                </label>
                                <select
                                    value={filterMerchant || ""}
                                    onChange={(e) =>
                                        handleMerchantFilter(e.target.value)
                                    }
                                    className="flex-1 max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">All Merchants</option>
                                    {merchants.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Selected Payouts Action Bar */}
                    {selectedPayouts.length > 0 && (
                        <div className="bg-linear-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 mb-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">
                                            {selectedPayouts.length} payout(s)
                                            selected
                                        </p>
                                        <p className="text-orange-100 text-sm">
                                            Total to request: RM{" "}
                                            {selectedTotal.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRequestPayout}
                                    className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                                >
                                    {role === "admin"
                                        ? "Process Selected Payouts"
                                        : "Request Payout Now!"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Event Groups */}
                    {Object.entries(grouped).map(([eventTitle, group]) => {
                        const totalAmount = group.reduce(
                            (sum, p) =>
                                sum + Number(p.total_amount.replace(/,/g, "")),
                            0
                        );
                        const eligibleCount = group.filter(
                            (p) => p.status === "pending"
                        ).length;

                        return (
                            <div
                                key={eventTitle}
                                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 hover:shadow-xl transition-shadow"
                            >
                                {/* Event Header */}
                                <div className="bg-linear-to-r from-orange-50 via-amber-50 to-yellow-50 px-6 py-5 border-b border-orange-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-orange-100 p-2 rounded-lg">
                                                <Trophy
                                                    className="text-orange-600"
                                                    size={20}
                                                />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                                    {eventTitle}
                                                </h2>
                                                <p className="text-sm text-gray-600">
                                                    {group.length} slot(s) •
                                                    Total Earnings:
                                                    <span className="font-bold text-green-600 ml-1">
                                                        RM{" "}
                                                        {totalAmount.toFixed(2)}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        {eligibleCount > 0 && (
                                            <button
                                                onClick={() =>
                                                    toggleSelectAll(group)
                                                }
                                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                                            >
                                                {group
                                                    .filter(
                                                        (p) =>
                                                            p.status ===
                                                            "pending"
                                                    )
                                                    .every((p) =>
                                                        selectedPayouts.includes(
                                                            p.id
                                                        )
                                                    )
                                                    ? "Deselect All"
                                                    : `Select All (${eligibleCount})`}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Select
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Date & Time
                                                </th>
                                                {role === "admin" && (
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Merchant
                                                    </th>
                                                )}
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Bookings
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    {role === "merchant"
                                                        ? "Your Earnings"
                                                        : "Payout Amount"}
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                    Available At
                                                </th>
                                                {role === "admin" && (
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {group.map((p) => (
                                                <React.Fragment key={p.id}>
                                                    <tr className="hover:bg-orange-50/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                disabled={
                                                                    p.status !==
                                                                    "pending"
                                                                }
                                                                checked={selectedPayouts.includes(
                                                                    p.id
                                                                )}
                                                                onChange={() =>
                                                                    togglePayout(
                                                                        p.id
                                                                    )
                                                                }
                                                                className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                                <Calendar
                                                                    size={16}
                                                                    className="text-gray-400"
                                                                />
                                                                {p.date_display}
                                                            </div>
                                                        </td>
                                                        {role === "admin" && (
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                                {
                                                                    p.merchant_name
                                                                }
                                                            </td>
                                                        )}
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() =>
                                                                    toggleExpand(
                                                                        p.id
                                                                    )
                                                                }
                                                                className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                                                            >
                                                                <Users
                                                                    size={16}
                                                                />
                                                                {p.total_bookings ||
                                                                    0}{" "}
                                                                bookings
                                                                {expandedPayouts.includes(
                                                                    p.id
                                                                ) ? (
                                                                    <ChevronUp
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <ChevronDown
                                                                        size={
                                                                            16
                                                                        }
                                                                    />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-bold text-green-600 text-lg">
                                                                RM{" "}
                                                                {(
                                                                    Number(
                                                                        p.total_amount.replace(
                                                                            /,/g,
                                                                            ""
                                                                        )
                                                                    ) || 0
                                                                ).toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge
                                                                status={
                                                                    p.status
                                                                }
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {p.available_at}
                                                        </td>
                                                        {role === "admin" && (
                                                            <td className="px-6 py-4">
                                                                {p.status ===
                                                                    "requested" && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleMarkPaid(
                                                                                p.id
                                                                            )
                                                                        }
                                                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all hover:scale-105"
                                                                    >
                                                                        Mark
                                                                        Paid
                                                                    </button>
                                                                )}
                                                            </td>
                                                        )}
                                                    </tr>

                                                    {/* Expanded Booking Details */}
                                                    {expandedPayouts.includes(
                                                        p.id
                                                    ) && (
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    role ===
                                                                    "merchant"
                                                                        ? 9
                                                                        : 10
                                                                }
                                                                className="px-6 py-4 bg-gray-50"
                                                            >
                                                                <div className="space-y-4">
                                                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                                                        <Users
                                                                            size={
                                                                                18
                                                                            }
                                                                        />
                                                                        Booking
                                                                        Details
                                                                    </h4>
                                                                    {p.booking_details &&
                                                                    p
                                                                        .booking_details
                                                                        .length >
                                                                        0 ? (
                                                                        <div className="space-y-3">
                                                                            {p.booking_details.map(
                                                                                (
                                                                                    booking
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            booking.booking_id
                                                                                        }
                                                                                        className="bg-white rounded-lg p-4 border border-gray-200"
                                                                                    >
                                                                                        <div className="flex items-center justify-between mb-3">
                                                                                            <span className="font-semibold text-gray-900">
                                                                                                Booking:{" "}
                                                                                                {
                                                                                                    booking.booking_code
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="w-full text-sm">
                                                                                                <thead className="bg-gray-50">
                                                                                                    <tr>
                                                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                                            Age
                                                                                                            Group
                                                                                                        </th>
                                                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                                            Quantity
                                                                                                        </th>
                                                                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                                            Attended
                                                                                                        </th>
                                                                                                        {role ===
                                                                                                            "admin" && (
                                                                                                            <>
                                                                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                                                    Paid
                                                                                                                    Credits
                                                                                                                </th>
                                                                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                                                                                                    Free
                                                                                                                    Credits
                                                                                                                </th>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody className="divide-y divide-gray-100">
                                                                                                    {booking.items.map(
                                                                                                        (
                                                                                                            item,
                                                                                                            idx
                                                                                                        ) => (
                                                                                                            <tr
                                                                                                                key={
                                                                                                                    idx
                                                                                                                }
                                                                                                            >
                                                                                                                <td className="px-3 py-2 text-gray-900">
                                                                                                                    {
                                                                                                                        item.age_group
                                                                                                                    }
                                                                                                                </td>
                                                                                                                <td className="px-3 py-2 text-gray-900">
                                                                                                                    {
                                                                                                                        item.quantity
                                                                                                                    }
                                                                                                                </td>
                                                                                                                <td className="px-3 py-2 text-gray-900">
                                                                                                                    {
                                                                                                                        item.attended
                                                                                                                    }
                                                                                                                </td>
                                                                                                                {role ===
                                                                                                                    "admin" && (
                                                                                                                    <>
                                                                                                                        <td className="px-3 py-2 text-blue-600 font-medium">
                                                                                                                            {item.paid_credits ||
                                                                                                                                0}
                                                                                                                        </td>
                                                                                                                        <td className="px-3 py-2 text-green-600 font-medium">
                                                                                                                            {item.free_credits ||
                                                                                                                                0}
                                                                                                                        </td>
                                                                                                                    </>
                                                                                                                )}
                                                                                                            </tr>
                                                                                                        )
                                                                                                    )}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-gray-500 text-sm">
                                                                            No
                                                                            booking
                                                                            details
                                                                            available
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Event Footer */}
                                <div className="bg-linear-to-r from-gray-50 to-orange-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Event Total
                                        </span>
                                        <div className="flex items-center gap-8">
                                            <div className="text-sm">
                                                <span className="text-gray-600">
                                                    Slots:{" "}
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    {group.length}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-600">
                                                    Total:{" "}
                                                </span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    RM {totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {payouts.data.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <DollarSign
                                    className="text-orange-500"
                                    size={40}
                                />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {role === "merchant"
                                    ? "Your Earnings Journey Starts Here!"
                                    : "No Payouts Yet"}
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                {role === "admin"
                                    ? "No payout records found for the selected filters."
                                    : "Complete events and deliver amazing experiences to start earning rewards!"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MerchantPayoutsIndex;
