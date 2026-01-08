import React, { useState, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    TrendingUp,
    DollarSign,
    Gift,
    Calendar,
    Plus,
    Repeat,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import { toast } from "react-hot-toast";
import type { PageProps } from "../../types";
import type { Conversion } from "@/types/events";

interface ConversionCredits {
    paid_credits: number;
    free_credits: number;
    total_credits: number;
}

interface ConversionsIndexProps {
    conversions: Conversion[];
}

type PagePropsWithFlash = PageProps & {
    flash?: {
        error?: string;
        success?: string;
    };
};

type ActionType = "activate" | "deactivate";

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const calculateConversionCredits = (conv: Conversion): ConversionCredits => {
    // Paid credits = RM × credits_per_rm
    const paid_credits = Math.ceil(conv.rm * conv.credits_per_rm);

    // Free credits = (Paid Credits ÷ Paid %) × Free %
    const free_credits = Math.ceil(
        (paid_credits / conv.paid_credit_percentage) *
            conv.free_credit_percentage
    );

    return {
        paid_credits,
        free_credits,
        total_credits: paid_credits + free_credits,
    };
};

interface StatusBadgeProps {
    status: "active" | "scheduled";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
    <div
        className={`px-6 py-3 ${
            status === "active"
                ? "bg-linear-to-r from-orange-500 to-red-500"
                : "bg-linear-to-r from-blue-500 to-purple-500"
        }`}
    >
        <span className="font-semibold text-sm text-white">
            {status === "active" ? "● ACTIVE" : "◐ SCHEDULED"}
        </span>
    </div>
);

interface RateDisplayProps {
    rm: number;
    creditsPerRM: number;
}

const RateDisplay: React.FC<RateDisplayProps> = ({ rm, creditsPerRM }) => (
    <div className="text-center mb-4 pb-4 border-b border-gray-100">
        <div className="text-4xl font-bold text-orange-600 mb-1">RM {rm}</div>
        <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-xs text-gray-600 font-semibold">
                {creditsPerRM} credits per RM
            </span>
        </div>
    </div>
);

interface CreditBreakdownProps {
    paidCredits: number;
    freeCredits: number;
}

const CreditBreakdown: React.FC<CreditBreakdownProps> = ({
    paidCredits,
    freeCredits,
}) => (
    <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center bg-blue-50 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                    Paid Credits
                </span>
            </div>
            <span className="text-lg font-bold text-blue-600">
                {paidCredits}
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
                {freeCredits}
            </span>
        </div>
    </div>
);

interface ConversionRuleProps {
    ratio: number;
}

const ConversionRule: React.FC<ConversionRuleProps> = ({ ratio }) => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 uppercase">
                    Conversion Rule
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-blue-600">{ratio}</span>
                <span className="text-xs text-gray-600">PAID</span>
                <span className="text-amber-600 font-bold">→</span>
                <span className="text-sm font-bold text-green-600">1</span>
                <span className="text-xs text-gray-600">FREE</span>
            </div>
        </div>
        <p className="text-xs text-amber-700 mt-1.5 ml-6">
            When short on free credits
        </p>
    </div>
);

interface PercentageDisplayProps {
    paidPercentage: number;
    freePercentage: number;
}

const PercentageDisplay: React.FC<PercentageDisplayProps> = ({
    paidPercentage,
    freePercentage,
}) => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Paid: {paidPercentage}%</span>
            <span>Free: {freePercentage}%</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
            <div
                className="bg-blue-500"
                style={{ width: `${paidPercentage}%` }}
            />
            <div
                className="bg-green-500"
                style={{ width: `${freePercentage}%` }}
            />
        </div>
    </div>
);

interface DateRangeProps {
    effectiveFrom: string;
    validUntil?: string | null;
}

const DateRange: React.FC<DateRangeProps> = ({ effectiveFrom, validUntil }) => (
    <div className="space-y-2 mb-6 text-sm">
        <div className="flex justify-between text-gray-600">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Effective From:</span>
            </div>
            <span>{formatDate(effectiveFrom)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Valid Until:</span>
            </div>
            <span>{formatDate(validUntil)}</span>
        </div>
    </div>
);

interface ActionButtonProps {
    status: "active" | "scheduled";
    onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ status, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
            status === "active"
                ? "bg-white border-2 border-red-500 text-red-600 hover:bg-red-50"
                : "bg-linear-to-r from-orange-500 to-red-500 text-white hover:shadow-lg"
        }`}
    >
        {status === "active" ? "Deactivate" : "Activate Now"}
    </button>
);

interface ConversionCardProps {
    conversion: Conversion;
    credits: ConversionCredits;
    onAction: (conv: Conversion, type: ActionType) => void;
}

const ConversionCard: React.FC<ConversionCardProps> = ({
    conversion,
    credits,
    onAction,
}) => {
    // Use the status from the backend
    const status = conversion.status;

    // Only show active and scheduled cards
    if (status === "inactive") {
        return null;
    }

    return (
        <div
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden ${
                status === "active"
                    ? "ring-2 ring-orange-400"
                    : "ring-2 ring-blue-400"
            }`}
        >
            <StatusBadge status={status} />

            <div className="p-6">
                <RateDisplay
                    rm={conversion.rm}
                    creditsPerRM={conversion.credits_per_rm}
                />

                <CreditBreakdown
                    paidCredits={credits.paid_credits}
                    freeCredits={credits.free_credits}
                />

                <PercentageDisplay
                    paidPercentage={conversion.paid_credit_percentage}
                    freePercentage={conversion.free_credit_percentage}
                />

                <ConversionRule ratio={conversion.paid_to_free_ratio} />

                <DateRange
                    effectiveFrom={conversion.effective_from}
                    validUntil={conversion.valid_until}
                />

                <ActionButton
                    status={status}
                    onClick={() =>
                        onAction(
                            conversion,
                            status === "active" ? "deactivate" : "activate"
                        )
                    }
                />
            </div>
        </div>
    );
};

interface ConfirmationModalProps {
    isOpen: boolean;
    actionType: ActionType | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    actionType,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen || !actionType) return null;

    return (
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
                        <strong className="text-gray-900">{actionType}</strong>{" "}
                        this conversion rate?
                    </p>
                    {actionType === "activate" && (
                        <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                            This will activate the conversion rate immediately
                            and deactivate any existing active conversion.
                        </p>
                    )}
                    {actionType === "deactivate" && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            This will deactivate the conversion rate
                            immediately.
                        </p>
                    )}
                </div>
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
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
    );
};

interface EmptyStateProps {}

const EmptyState: React.FC<EmptyStateProps> = () => (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No conversion rates found.</p>
        <p className="text-gray-400 text-sm mt-2">
            Create your first conversion rate to get started.
        </p>
    </div>
);

const ConversionsIndex: React.FC<ConversionsIndexProps> = ({ conversions }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConversion, setSelectedConversion] =
        useState<Conversion | null>(null);
    const [actionType, setActionType] = useState<ActionType | null>(null);

    const pageProps = usePage<PagePropsWithFlash>().props;
    const flash = pageProps.flash;

    useEffect(() => {
        // console.log("Flash messages:", flash);
        // console.log("All props:", pageProps);
    }, [flash, pageProps]);

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const openModal = (conv: Conversion, type: ActionType) => {
        setSelectedConversion(conv);
        setActionType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedConversion(null);
        setActionType(null);
    };

    const handleConfirm = () => {
        if (!selectedConversion || !actionType) return;

        const routeUrl =
            actionType === "deactivate"
                ? `/admin/conversions/${selectedConversion.id}/deactivate`
                : `/admin/conversions/${selectedConversion.id}/activate`;

        router.post(
            routeUrl,
            {},
            {
                onSuccess: () => {
                    closeModal();
                },
                onError: (errors: Record<string, string | string[]>) => {
                    console.error("Inertia onError:", errors);
                    closeModal();
                    Object.values(errors).forEach((error) => {
                        if (typeof error === "string") {
                            toast.error(error);
                        } else if (Array.isArray(error)) {
                            error.forEach((msg: string) => toast.error(msg));
                        }
                    });
                },
            }
        );
    };

    // Filter out only inactive conversions
    const visibleConversions = conversions.filter(
        (conv) => conv.status !== "inactive"
    );
    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-[1600px] mx-auto">
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
                            {visibleConversions.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {visibleConversions.map((conv) => {
                                        const credits =
                                            calculateConversionCredits(conv);

                                        return (
                                            <ConversionCard
                                                key={conv.id}
                                                conversion={conv}
                                                credits={credits}
                                                onAction={openModal}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modalOpen}
                actionType={actionType}
                onConfirm={handleConfirm}
                onCancel={closeModal}
            />
        </AuthenticatedLayout>
    );
};

export default ConversionsIndex;
