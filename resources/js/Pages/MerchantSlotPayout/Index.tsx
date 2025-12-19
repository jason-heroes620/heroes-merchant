import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Check, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "../../AuthenticatedLayout";

type IndexRow = {
    id: string;
    merchant_company?: string;
    event_title?: string;
    total_payout: number;
    status: "pending" | "paid";
    payout_ids: string[];
};

type Props = {
    rows: IndexRow[];
    role: "admin" | "merchant";
    month: string;
    month_end_total?: number;
};

const statusConfig = {
    pending: {
        bg: "bg-amber-50 border border-amber-200",
        text: "text-amber-700",
        label: "Pending",
        icon: Clock,
    },
    paid: {
        bg: "bg-emerald-50 border border-emerald-200",
        text: "text-emerald-700",
        label: "Paid",
        icon: CheckCircle2,
    },
};

const StatusBadge = ({
    status,
    isAdmin,
    payoutIds,
    onMarkPaid,
    isMarking,
}: {
    status: "pending" | "paid";
    isAdmin: boolean;
    payoutIds: string[];
    onMarkPaid?: (ids: string[]) => void;
    isMarking?: boolean;
}) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
            >
                <Icon size={14} />
                {config.label}
            </span>

            {isAdmin && status === "pending" && onMarkPaid && (
                <button
                    onClick={() => onMarkPaid(payoutIds)}
                    disabled={isMarking}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white transition-colors shadow-sm"
                >
                    <Check size={14} />
                    {isMarking ? "..." : "Mark Paid"}
                </button>
            )}
        </div>
    );
};

const MerchantPayoutsIndex: React.FC<Props> = ({
    rows,
    role,
    month,
    month_end_total,
}) => {
    const isMonthEnd = () => {
        const today = new Date();
        const utc = today.getTime() + today.getTimezoneOffset() * 60000;
        const klTime = new Date(utc + 8 * 60 * 60 * 1000);

        const [year, monthStr] = month.split("-").map(Number);
        const lastDay = new Date(year, monthStr, 0).getDate();
        return (
            klTime.getFullYear() === year &&
            klTime.getMonth() + 1 === monthStr &&
            klTime.getDate() === lastDay
        );
    };

    const [markingIds, setMarkingIds] = useState<string[]>([]);

    const getSubtitle = () => {
        const date = new Date(month + "-01");
        return date.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });
    };

    const exportPdf = () => {
        const routePrefix = role === "admin" ? "/admin" : "/merchant";
        window.open(
            `${routePrefix}/payouts/export-pdf?month=${month}`,
            "_blank"
        );
        toast.success("Generating PDF report...");
    };

    const handleMarkAsPaid = (payoutIds: string[]) => {
        if (!confirm("Mark all payouts in this group as paid?")) return;

        setMarkingIds(payoutIds);

        router.post(
            "/admin/payouts/mark-paid",
            { payout_ids: payoutIds },
            {
                onSuccess: () => toast.success("Payouts marked as paid"),
                onFinish: () => setMarkingIds([]),
                onError: () => toast.error("Failed to mark payouts"),
            }
        );
    };

    const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
            value: date.toISOString().slice(0, 7),
            label: date.toLocaleString("default", {
                month: "short",
                year: "numeric",
            }),
        };
    });

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-2xl">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-5xl font-bold tracking-tight">
                                    {role === "admin"
                                        ? "Merchant Payouts"
                                        : "My Earnings"}
                                </h1>
                                <p className="mt-3 text-orange-100 text-lg font-medium">
                                    {getSubtitle()}
                                </p>
                            </div>
                            <div className="hidden md:flex items-center gap-3 text-orange-200">
                                <div className="text-right">
                                    <p className="text-sm uppercase tracking-wider text-orange-100">
                                        Total Rows
                                    </p>
                                    <p className="text-3xl font-bold text-white">
                                        {rows.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-orange-100 px-5 py-3.5">
                            <Calendar size={18} className="text-orange-600" />
                            <select
                                value={month}
                                onChange={(e) =>
                                    router.get(
                                        role === "admin"
                                            ? "/admin/payouts"
                                            : "/merchant/payouts",
                                        { month: e.target.value },
                                        { preserveState: true }
                                    )
                                }
                                className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0"
                            >
                                {last6Months.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={exportPdf}
                            className="bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
                        >
                            <Download size={18} />
                            Export PDF
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-linear-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase">
                                        {role === "admin"
                                            ? "Merchant"
                                            : "Event"}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase">
                                        Total Payout
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-orange-900 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-50">
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 font-medium">
                                            {role === "admin"
                                                ? row.merchant_company
                                                : row.event_title}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            RM {row.total_payout.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={row.status}
                                                isAdmin={role === "admin"}
                                                payoutIds={row.payout_ids}
                                                onMarkPaid={handleMarkAsPaid}
                                                isMarking={
                                                    markingIds.length > 0
                                                }
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() =>
                                                    router.get(
                                                        role === "admin"
                                                            ? "/admin/payouts/show"
                                                            : "/merchant/payouts/show",
                                                        {
                                                            id: row.id,
                                                            month,
                                                        }
                                                    )
                                                }
                                                className="text-orange-600 hover:text-orange-700 font-semibold"
                                            >
                                                View Details →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Month End Total */}
                    {month_end_total !== undefined && (
                        <div className="mt-6 flex justify-end">
                            <div className="bg-linear-to-br from-orange-600 to-orange-500 text-white rounded-2xl shadow-lg px-6 py-4">
                                <p className="text-sm uppercase tracking-wider text-orange-100 mb-2">
                                    Month End Total
                                </p>
                                {isMonthEnd() ? (
                                    <p className="text-3xl text-center font-bold">
                                        RM {month_end_total.toFixed(2)}
                                    </p>
                                ) : (
                                    <p className="text-xs text-center font-bold">
                                        Not Available Yet
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default MerchantPayoutsIndex;
