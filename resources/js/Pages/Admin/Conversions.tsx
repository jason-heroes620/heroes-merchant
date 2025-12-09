import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { TrendingUp, DollarSign, Gift, Calendar, Plus } from "lucide-react";
import type { PageProps } from "../../types/index";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface Conversion {
    id: string;
    credits_per_rm: number;
    paid_credit_percentage: number;
    free_credit_percentage: number;
    effective_from: string;
    valid_until?: string | null;
    status?: "active" | "inactive";
}

interface Props {
    conversions: Conversion[];
}

type PagePropsWithErrors = PageProps & {
    errors?: Record<string, string[]>;
};

const ConversionsIndex: React.FC<Props> = ({ conversions }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConversion, setSelectedConversion] =
        useState<Conversion | null>(null);
    const [actionType, setActionType] = useState<
        "activate" | "deactivate" | null
    >(null);

    const { errors } = usePage<PagePropsWithErrors>().props;

    const today = new Date();

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isActive = (conv: Conversion) => {
        if (conv.status === "inactive") return false;
        const from = new Date(conv.effective_from);
        const until = conv.valid_until ? new Date(conv.valid_until) : null;
        return from <= today && (!until || today <= until);
    };

    const calculateCredits = (conv: Conversion) => {
        // Minimum paid credits must be at least credits_per_rm
        const paid = Math.max(
            Math.ceil(
                conv.credits_per_rm * (conv.paid_credit_percentage / 100)
            ),
            Math.ceil(conv.credits_per_rm)
        );

        // Free credits calculated from paid credits
        const free = Math.ceil(
            (paid / conv.paid_credit_percentage) * conv.free_credit_percentage
        );

        return { paid_credits: paid, free_credits: free };
    };

    const openModal = (conv: Conversion, type: "activate" | "deactivate") => {
        setSelectedConversion(conv);
        setActionType(type);
        setModalOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedConversion || !actionType) return;

        const routeUrl =
            actionType === "deactivate"
                ? `/admin/conversions/${selectedConversion.id}/deactivate`
                : `/admin/conversions/${selectedConversion.id}/activate`;

        const payload =
            actionType === "activate"
                ? { effective_from: new Date().toISOString().split("T")[0] }
                : {};

        router.post(routeUrl, payload, {
            onSuccess: () => router.reload({ only: ["conversions"] }),
        });

        setModalOpen(false);
        setSelectedConversion(null);
        setActionType(null);
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-[1600px] mx-auto">
                    {errors && Object.keys(errors).length > 0 && (
                        <div className="mb-6 max-w-7xl mx-auto px-6">
                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(errors).map(([key, msgs]) =>
                                        msgs.map((msg, i) => (
                                            <li key={`${key}-${i}`}>{msg}</li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        Conversion Rates
                                    </h1>
                                    <p className="text-orange-100 text-lg">
                                        Manage credit conversion rates and
                                        percentages
                                    </p>
                                </div>
                                <Link
                                    href="/admin/conversions/create"
                                    className="bg-white text-orange-600 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add New Conversion
                                </Link>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="w-full mx-auto px-6 py-8">
                            {conversions.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">
                                        No conversion rates found.
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Create your first conversion rate to get
                                        started.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {conversions.map((conv) => {
                                        const active = isActive(conv);
                                        const { paid_credits, free_credits } =
                                            calculateCredits(conv);

                                        return (
                                            <div
                                                key={conv.id}
                                                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden ${
                                                    active
                                                        ? "ring-2 ring-orange-400"
                                                        : ""
                                                }`}
                                            >
                                                {/* Status Badge */}
                                                <div
                                                    className={`px-6 py-3 ${
                                                        active
                                                            ? "bg-linear-to-r from-orange-500 to-red-500"
                                                            : "bg-gray-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`font-semibold text-sm ${
                                                            active
                                                                ? "text-white"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {active
                                                            ? "● ACTIVE"
                                                            : "○ INACTIVE"}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="p-6">
                                                    {/* Main Rate */}
                                                    <div className="text-center mb-6 pb-6 border-b border-gray-100">
                                                        <div className="text-4xl font-bold text-gray-800 mb-1">
                                                            {
                                                                conv.credits_per_rm
                                                            }
                                                        </div>
                                                        <div className="text-sm text-gray-500 font-medium">
                                                            Credits per RM
                                                        </div>
                                                    </div>

                                                    {/* Credit Breakdown */}
                                                    <div className="space-y-3 mb-6">
                                                        <div className="flex justify-between items-center bg-blue-50 px-4 py-3 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="w-4 h-4 text-blue-600" />
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    Paid Credits
                                                                </span>
                                                            </div>
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {paid_credits}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <Gift className="w-5 h-5 text-green-600" />
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    Free Credits
                                                                </span>
                                                            </div>
                                                            <span className="text-lg font-bold text-green-600">
                                                                {free_credits}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Percentages */}
                                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                                                            <span>
                                                                Paid:{" "}
                                                                {
                                                                    conv.paid_credit_percentage
                                                                }
                                                                %
                                                            </span>
                                                            <span>
                                                                Free:{" "}
                                                                {
                                                                    conv.free_credit_percentage
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                        <div className="flex h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-blue-500"
                                                                style={{
                                                                    width: `${conv.paid_credit_percentage}%`,
                                                                }}
                                                            />
                                                            <div
                                                                className="bg-green-500"
                                                                style={{
                                                                    width: `${conv.free_credit_percentage}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Dates */}
                                                    <div className="space-y-2 mb-6 text-sm">
                                                        <div className="flex justify-between text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="font-medium">
                                                                    Effective
                                                                    From:
                                                                </span>
                                                            </div>
                                                            <span>
                                                                {formatDate(
                                                                    conv.effective_from
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                <span className="font-medium">
                                                                    Valid Until:
                                                                </span>
                                                            </div>
                                                            <span>
                                                                {formatDate(
                                                                    conv.valid_until
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    {active ? (
                                                        <button
                                                            onClick={() =>
                                                                openModal(
                                                                    conv,
                                                                    "deactivate"
                                                                )
                                                            }
                                                            className="w-full bg-white border-2 border-red-500 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                openModal(
                                                                    conv,
                                                                    "activate"
                                                                )
                                                            }
                                                            className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal */}
                        {modalOpen && selectedConversion && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                                    <div
                                        className={`px-6 py-4 ${
                                            actionType === "deactivate"
                                                ? "bg-red-500"
                                                : "bg-linear-to-r from-orange-500 to-red-500"
                                        }`}
                                    >
                                        <h2 className="text-xl font-bold text-white">
                                            {actionType === "deactivate"
                                                ? "Deactivate"
                                                : "Activate"}{" "}
                                            Conversion Rate
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 mb-2">
                                            Are you sure you want to{" "}
                                            <strong className="text-gray-900">
                                                {actionType}
                                            </strong>{" "}
                                            this conversion rate?
                                        </p>
                                        {actionType === "activate" && (
                                            <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                                                This will set the effective date
                                                to today.
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-3 px-6 pb-6">
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                                                actionType === "deactivate"
                                                    ? "bg-red-600 hover:bg-red-700"
                                                    : "bg-linear-to-r from-orange-500 to-red-500 hover:shadow-lg"
                                            }`}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default ConversionsIndex;
