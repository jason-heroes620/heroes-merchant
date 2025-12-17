import React, { useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import {
    TrendingUp,
    DollarSign,
    Gift,
    Calendar,
    Lock,
    Info,
    Repeat,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";
import { toast } from "react-hot-toast";

interface FormData {
    credits: string;
    rm: string;
    credits_per_rm: string;
    paid_to_free_ratio: string;
    paid_credit_percentage: number;
    free_credit_percentage: number;
    paid_credits_preview: number | null;
    free_credits_preview: number | null;
    effective_from: string;
    valid_until: string;
}

interface Errors {
    credits_per_rm?: string;
    paid_to_free_ratio?: string;
    paid_credit_percentage?: string;
    free_credit_percentage?: string;
    effective_from?: string;
    valid_until?: string;
}

const ConversionsCreate: React.FC = () => {
    const { props } = usePage<any>();
    const { post, data, setData } = useForm<FormData>({
        credits: "",
        rm: "",
        credits_per_rm: "",
        paid_to_free_ratio: "2",
        paid_credit_percentage: 80,
        free_credit_percentage: 20,
        paid_credits_preview: null,
        free_credits_preview: null,
        effective_from: "",
        valid_until: "",
    });
    const errors = props.errors as Errors;

    // Auto-calculate credits_per_rm when credits or rm changes
    useEffect(() => {
        const credits = parseFloat(data.credits);
        const rm = parseFloat(data.rm);

        if (!isNaN(credits) && !isNaN(rm) && rm > 0) {
            setData((prev) => ({
                ...prev,
                credits_per_rm: (credits / rm).toFixed(2),
            }));
        } else {
            setData((prev) => ({ ...prev, credits_per_rm: "" }));
        }
    }, [data.credits, data.rm, setData]);

    // Calculate preview credits
    useEffect(() => {
        const creditsPerRM = parseFloat(data.credits_per_rm);
        if (!isNaN(creditsPerRM) && creditsPerRM > 0) {
            const minPaidCredits = Math.ceil(creditsPerRM);
            const calculatedPaid = Math.ceil(
                creditsPerRM * (data.paid_credit_percentage / 100)
            );
            const paidCredits = Math.max(calculatedPaid, minPaidCredits);
            const freeCredits = Math.ceil(
                (paidCredits / data.paid_credit_percentage) *
                    data.free_credit_percentage
            );

            setData((prev) => ({
                ...prev,
                paid_credits_preview: paidCredits,
                free_credits_preview: freeCredits,
            }));
        } else {
            setData((prev) => ({
                ...prev,
                paid_credits_preview: null,
                free_credits_preview: null,
            }));
        }
    }, [
        data.credits_per_rm,
        data.paid_credit_percentage,
        data.free_credit_percentage,
        setData,
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "paid_credit_percentage") {
            const numValue = Math.max(0, Math.min(100, Number(value) || 0));
            setData((prev) => ({
                ...prev,
                paid_credit_percentage: numValue,
                free_credit_percentage: 100 - numValue,
            }));
        } else if (name === "free_credit_percentage") {
            const numValue = Math.max(0, Math.min(100, Number(value) || 0));
            setData((prev) => ({
                ...prev,
                free_credit_percentage: numValue,
                paid_credit_percentage: 100 - numValue,
            }));
        } else {
            setData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post("/admin/conversions", {
            onSuccess: () => {
                toast.success("Conversion rate created successfully. Standard Package has been created.");
            },
            onError: (errors) => {
                Object.values(errors).forEach((error) =>
                    toast.error(error as string)
                );
            },
        });
    };

    const totalCredits =
        (data.paid_credits_preview || 0) + (data.free_credits_preview || 0);
    const conversionRatio = parseFloat(data.paid_to_free_ratio);

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-6 px-3">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        Add Conversion Rate
                                    </h1>
                                    <p className="text-orange-100 text-sm">
                                        Configure credit conversion rates and
                                        distribution percentages
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="w-full mx-auto px-6 py-8">
                        <div className="grid lg:grid-cols-5 gap-6">
                            {/* Form Section */}
                            <div className="lg:col-span-3">
                                <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                                    {/* Conversion Rate Calculator */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <TrendingUp className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Conversion Rate Calculator
                                            </h2>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Credits
                                                </label>
                                                <input
                                                    type="number"
                                                    name="credits"
                                                    value={data.credits}
                                                    placeholder="e.g., 1"
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                                    step="1"
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    RM (Price)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="rm"
                                                    value={data.rm}
                                                    placeholder="e.g., 1.80"
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Credits per RM (Auto-calculated)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="credits_per_rm"
                                                    value={
                                                        data.credits_per_rm ||
                                                        "—"
                                                    }
                                                    readOnly
                                                    className="w-full border-2 border-orange-200 bg-orange-50 px-4 py-3 rounded-lg font-semibold text-orange-700 cursor-not-allowed pr-10"
                                                />
                                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                                            </div>
                                            {errors.credits_per_rm && (
                                                <p className="text-red-500 text-sm mt-1">
                                                    {errors.credits_per_rm}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span>
                                                    This is the minimum paid
                                                    credits per RM to prevent
                                                    admin loss
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200"></div>

                                    {/* Credit Distribution */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <DollarSign className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Credit Distribution
                                            </h2>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Paid Credit %
                                                </label>
                                                <input
                                                    type="number"
                                                    name="paid_credit_percentage"
                                                    value={
                                                        data.paid_credit_percentage
                                                    }
                                                    onChange={handleChange}
                                                    min={0}
                                                    max={100}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Free Credit %
                                                </label>
                                                <input
                                                    type="number"
                                                    name="free_credit_percentage"
                                                    value={
                                                        data.free_credit_percentage
                                                    }
                                                    onChange={handleChange}
                                                    min={0}
                                                    max={100}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Visual percentage bar */}
                                        <div className="space-y-2">
                                            <div className="flex h-3 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 transition-all duration-300"
                                                    style={{
                                                        width: `${data.paid_credit_percentage}%`,
                                                    }}
                                                />
                                                <div
                                                    className="bg-green-500 transition-all duration-300"
                                                    style={{
                                                        width: `${data.free_credit_percentage}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>
                                                    Paid:{" "}
                                                    {
                                                        data.paid_credit_percentage
                                                    }
                                                    %
                                                </span>
                                                <span>
                                                    Free:{" "}
                                                    {
                                                        data.free_credit_percentage
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200"></div>

                                    {/* Paid → Free Conversion Rule */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Repeat className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Conversion Rule (Fallback)
                                            </h2>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <p className="text-sm text-amber-800 mb-3 flex items-start gap-2">
                                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>
                                                    When customers run out of
                                                    free credits, paid credits
                                                    will be converted at this
                                                    ratio
                                                </span>
                                            </p>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Paid to Free Ratio
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        name="paid_to_free_ratio"
                                                        value={
                                                            data.paid_to_free_ratio
                                                        }
                                                        onChange={handleChange}
                                                        min="0.01"
                                                        step="0.1"
                                                        className="flex-1 border-2 border-amber-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                                                        placeholder="e.g., 2"
                                                    />
                                                    <span className="text-gray-500 font-medium whitespace-nowrap">
                                                        PAID : 1 FREE
                                                    </span>
                                                </div>
                                                {errors.paid_to_free_ratio && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {
                                                            errors.paid_to_free_ratio
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200"></div>

                                    {/* Validity Period */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <Calendar className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Validity Period
                                            </h2>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Effective From
                                                </label>
                                                <input
                                                    type="date"
                                                    name="effective_from"
                                                    value={data.effective_from}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                                />
                                                {errors.effective_from && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors.effective_from}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Valid Until (Optional)
                                                </label>
                                                <input
                                                    type="date"
                                                    name="valid_until"
                                                    value={data.valid_until}
                                                    onChange={handleChange}
                                                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                                />
                                                {errors.valid_until && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors.valid_until}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full bg-linear-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition-all text-lg"
                                    >
                                        Save Conversion Rate
                                    </button>
                                </div>
                            </div>

                            {/* Preview Card */}
                            <div className="md:col-span-2">
                                <div className="sticky top-6 bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="bg-linear-to-r from-orange-500 to-red-500 px-6 py-4">
                                        <h3 className="text-white font-semibold text-lg">
                                            Live Preview
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Main Rate Display */}
                                        {data.credits_per_rm ? (
                                            <>
                                                <div className="text-center pb-2 border-b border-gray-100">
                                                    <div className="text-5xl font-bold text-gray-800 mb-2">
                                                        {data.credits_per_rm}
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-medium">
                                                        Credits per RM
                                                    </div>
                                                </div>

                                                {/* Credit Breakdown */}
                                                {data.paid_credits_preview !==
                                                    null &&
                                                    data.free_credits_preview !==
                                                        null && (
                                                        <div className="space-y-2">
                                                            <div className="bg-blue-50 px-2 py-2 rounded-lg border border-blue-100">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            Paid
                                                                            Credits
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-2xl font-bold text-blue-600">
                                                                        {
                                                                            data.paid_credits_preview
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 ml-6">
                                                                    {
                                                                        data.paid_credit_percentage
                                                                    }
                                                                    % of total
                                                                </div>
                                                            </div>

                                                            <div className="bg-green-50 px-2 py-2 rounded-lg border border-green-100">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Gift className="w-4 h-4 text-green-600" />
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            Free
                                                                            Credits
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-2xl font-bold text-green-600">
                                                                        {
                                                                            data.free_credits_preview
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 ml-6">
                                                                    {
                                                                        data.free_credit_percentage
                                                                    }
                                                                    % of total
                                                                </div>
                                                            </div>

                                                            <div className="bg-linear-to-r from-orange-500 to-red-500 px-4 py-4 rounded-lg">
                                                                <div className="flex justify-between items-center text-white">
                                                                    <span className="text-sm font-medium">
                                                                        Total
                                                                        Credits
                                                                    </span>
                                                                    <span className="text-2xl font-bold">
                                                                        {
                                                                            totalCredits
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Conversion Rule Preview */}
                                                {data.paid_to_free_ratio &&
                                                    conversionRatio > 0 &&
                                                    data.paid_credits_preview &&
                                                    data.free_credits_preview && (
                                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-xs font-semibold text-amber-700 uppercase">
                                                                    Conversion
                                                                    Example
                                                                </span>
                                                            </div>

                                                            {/* Package Purchase */}
                                                            <div className="bg-white rounded-lg p-3 mb-2">
                                                                <p className="text-xs text-gray-600 mb-2 font-medium">
                                                                    Purchase
                                                                    Package (RM
                                                                    1):
                                                                </p>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {
                                                                                data.paid_credits_preview
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            PAID
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-gray-400">
                                                                        +
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Gift className="w-4 h-4 text-green-600" />
                                                                        <span className="text-lg font-bold text-green-600">
                                                                            {
                                                                                data.free_credits_preview
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            FREE
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Conversion */}
                                                            <div className="bg-white rounded-lg p-3">
                                                                <p className="text-xs text-amber-700 mb-2 font-medium">
                                                                    Conversion
                                                                    (when short
                                                                    of free
                                                                    credits):
                                                                </p>
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <DollarSign className="w-4 h-4 text-blue-600" />
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {conversionRatio *
                                                                                data.free_credits_preview}
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            PAID
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-amber-600 font-bold">
                                                                        →
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Gift className="w-4 h-4 text-green-600" />
                                                                        <span className="text-lg font-bold text-green-600">
                                                                            {
                                                                                data.free_credits_preview
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            FREE
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                                <p className="text-sm font-medium">
                                                    Enter credits and RM to see
                                                    preview
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default ConversionsCreate;
