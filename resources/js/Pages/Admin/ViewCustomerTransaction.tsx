import { useState } from "react";
import {
    Wallet,
    History,
    Gift,
    TrendingUp,
    Calendar,
    Filter,
    Download,
    DollarSign,
} from "lucide-react";
import { usePage } from "@inertiajs/react";
import type { PageProps as BasePageProps } from "../../types";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface User {
    id: string;
    full_name: string;
    email: string;
}

interface Customer {
    id: string;
    user: User;
    date_of_birth?: string | null;
    age?: number;
    referral_code?: string;
}

interface WalletData {
    free_credits: number;
    paid_credits: number;
}

interface CreditGrant {
    id: string;
    grant_type: string;
    paid_credits: number;
    free_credits: number;
    free_credits_remaining: number;
    paid_credits_remaining: number;
    expires_at?: string | null;
    created_at: string;
}

interface Transaction {
    id: string;
    type: string;
    description: string;
    delta_free: number;
    delta_paid: number;
    created_at: string;
}

interface PageProps extends BasePageProps {
    customer: Customer;
    wallet: WalletData;
    credit_grants: CreditGrant[];
    transactions: Transaction[];
}

export default function ViewCustomerTransaction() {
    const { customer, wallet, credit_grants, transactions } =
        usePage<PageProps>().props;

    if (!customer) return null;
    const [filterType, setFilterType] = useState("all");

    const toGMT8Date = (dateStr: string) => {
        const d = new Date(dateStr);
        const utc = d.getTime() + d.getTimezoneOffset() * 60000;
        const gmt8 = new Date(utc + 8 * 3600000);

        return new Date(gmt8.getFullYear(), gmt8.getMonth(), gmt8.getDate());
    };

    const isExpired = (dateStr: string) => {
        const target = toGMT8Date(dateStr);
        const nowGMT8 = toGMT8Date(new Date().toISOString());
        return target.getTime() === nowGMT8.getTime();
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const utc = date.getTime() + date.getTimezoneOffset() * 60000;
        const gmt8 = new Date(utc + 8 * 3600000);
        return gmt8.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTypeColor = (type: string) => {
        const colors = {
            purchase: "bg-orange-100 text-orange-700 border-orange-200",
            bonus: "bg-green-100 text-green-700 border-green-200",
            booking: "bg-blue-100 text-blue-700 border-blue-200",
            refund: "bg-emerald-100 text-emerald-700 border-emerald-200",
        } as const;

        return (
            colors[type as keyof typeof colors] ??
            "bg-gray-100 text-gray-700 border-gray-200"
        );
    };

    const getGrantTypeColor = (type: string) => {
        const colors = {
            purchase: "bg-orange-100 text-orange-600",
            registration: "bg-purple-100 text-purple-600",
            referral: "bg-pink-100 text-pink-600",
            free: "bg-blue-100 text-blue-600",
            paid: "bg-indigo-100 text-indigo-600",
        } as const;

        return (
            colors[type as keyof typeof colors] ?? "bg-gray-100 text-gray-600"
        );
    };

    const filteredTransactions =
        filterType === "all"
            ? transactions
            : transactions.filter((t) => t.type === filterType);

    const totalCredits = wallet.free_credits + wallet.paid_credits;

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50">
                {/* Header with Gradient */}
                <div className="bg-linear-to-r from-orange-500 to-red-500 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex items-center justify-between my-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                    <Wallet className="text-white" size={32} />
                                </div>
                                <div className="text-white">
                                    <h1 className="text-3xl font-bold">
                                        {customer.user.full_name}
                                    </h1>
                                    <p className="text-orange-100 text-sm">
                                        {customer.user.email}
                                    </p>
                                </div>
                            </div>
                            <a
                                href={route(
                                    "admin.customers.transactions.exportPdf",
                                    customer.id
                                )}
                                target="_blank"
                                rel="noopener"
                                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center gap-2"
                            >
                                <Download size={18} />
                                Export PDF
                            </a>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Credit Cards Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 -mt-16">
                        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-orange-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-orange-100 rounded-full p-3">
                                    <TrendingUp
                                        className="text-orange-600"
                                        size={24}
                                    />
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm font-medium mb-1">
                                Total Credits
                            </p>
                            <p className="text-4xl font-bold text-gray-900">
                                {totalCredits}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Available balance
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-blue-100 rounded-full p-3">
                                    <Gift className="text-blue-600" size={24} />
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm font-medium mb-1">
                                Free Credits
                            </p>
                            <p className="text-4xl font-bold text-gray-900">
                                {wallet.free_credits}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Bonus & promotional
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-green-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-green-100 rounded-full p-3">
                                    <DollarSign
                                        className="text-green-600"
                                        size={24}
                                    />
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm font-medium mb-1">
                                Paid Credits
                            </p>
                            <p className="text-4xl font-bold text-gray-900">
                                {wallet.paid_credits}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Purchased balance
                            </p>
                        </div>
                    </div>

                    {/* Credit Grants Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                            <div className="bg-orange-100 rounded-lg p-2">
                                <Gift className="text-orange-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Credit Grants
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Active credit packages and bonuses
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {credit_grants.map((grant) => {
                                const totalCredits =
                                    (grant.free_credits || 0) +
                                    (grant.paid_credits || 0);
                                const remainingCredits =
                                    (grant.free_credits_remaining || 0) +
                                    (grant.paid_credits_remaining || 0);
                                const usagePercent =
                                    (remainingCredits / totalCredits) * 100;

                                return (
                                    <div
                                        key={grant.id}
                                        className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getGrantTypeColor(
                                                            grant.grant_type
                                                        )}`}
                                                    >
                                                        {grant.grant_type.toUpperCase()}
                                                    </span>
                                                </div>

                                                {grant.expires_at && (
                                                    <span
                                                        className={`flex items-center gap-1 text-xs font-medium ${
                                                            isExpired(
                                                                grant.expires_at
                                                            )
                                                                ? "text-red-600"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        <Calendar size={12} />
                                                        {isExpired(
                                                            grant.expires_at
                                                        )
                                                            ? "Expired"
                                                            : "Expires"}{" "}
                                                        on{" "}
                                                        {toGMT8Date(
                                                            grant.expires_at
                                                        ).toLocaleDateString(
                                                            "en-GB",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-orange-600">
                                                    {remainingCredits}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    of {totalCredits}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-linear-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${usagePercent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 rounded-lg p-2">
                                    <History
                                        className="text-orange-600"
                                        size={24}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Transaction History
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Last 6 months of activity
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Filter className="text-gray-400" size={18} />
                                <select
                                    value={filterType}
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="booking">Booking</option>
                                    <option value="refund">Refund</option>
                                    <option value="referral">Referral Bonus</option>
                                     <option value="registration">Registration Bonus</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredTransactions.map((transaction) => {
                                const totalDelta =
                                    transaction.delta_free +
                                    transaction.delta_paid;
                                const isPositive = totalDelta > 0;

                                return (
                                    <div
                                        key={transaction.id}
                                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span
                                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(
                                                            transaction.type
                                                        )}`}
                                                    >
                                                        {transaction.type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-gray-900 mb-1">
                                                    {transaction.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Calendar size={12} />
                                                    {formatDateTime(
                                                        transaction.created_at
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right ml-4">
                                                <p
                                                    className={`text-3xl font-bold mb-2 ${
                                                        isPositive
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {isPositive ? "+" : ""}
                                                    {totalDelta}
                                                </p>
                                                {transaction.delta_free !== 0 &&
                                                    transaction.delta_paid !==
                                                        0 && (
                                                        <>
                                                            <div className="flex items-center text-xs text-gray-500 gap-1 mb-1">
                                                                <DollarSign
                                                                    className="text-green-600"
                                                                    size={14}
                                                                />
                                                                <span className="text-green-600 font-semibold">
                                                                    Paid
                                                                    Credits:{" "}
                                                                    {
                                                                        transaction.delta_paid
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center text-xs text-gray-500 gap-1">
                                                                <Gift
                                                                    className="text-blue-600"
                                                                    size={14}
                                                                />
                                                                <span className="text-blue-600 font-semibold">
                                                                    Free
                                                                    Credits:{" "}
                                                                    {
                                                                        transaction.delta_free
                                                                    }
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {filteredTransactions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                    <History
                                        className="text-gray-400"
                                        size={32}
                                    />
                                </div>
                                <p className="text-gray-500 font-medium">
                                    No transactions found
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Try adjusting your filters
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
