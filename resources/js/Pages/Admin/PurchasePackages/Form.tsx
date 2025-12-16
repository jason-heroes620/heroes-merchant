import React, { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Save,
    X,
    Package,
    DollarSign,
    Gift,
    Calendar,
    Info,
    Clock,
    Star,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface FormProps {
    package?: any;
}

export default function Form({ package: pkg }: FormProps) {
    const [form, setForm] = useState({
        name: pkg?.name || "",
        price_in_rm: pkg?.price_in_rm || 0,
        paid_credits: pkg?.paid_credits || 0,
        free_credits: pkg?.free_credits || 0,
        effective_from: pkg?.effective_from || "",
        valid_until: pkg?.valid_until || "",
        validity_days: pkg?.validity_days || 180,
        active: pkg?.active ?? true,
        best_value: pkg?.best_value ?? false,
    });

    const [validityUnit, setValidityUnit] = useState<"days" | "months">("days");

    const isFree = form.price_in_rm === 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value =
            e.target.type === "number"
                ? parseFloat(e.target.value) || 0
                : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const getValidityValue = () => {
        if (validityUnit === "months") {
            return Math.round(form.validity_days / 30);
        }
        return form.validity_days;
    };

    const handleValidityChange = (value: number) => {
        const days = validityUnit === "months" ? value * 30 : value;
        setForm({ ...form, validity_days: days });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const routeName = pkg
            ? route("admin.packages.update", pkg.id)
            : route("admin.packages.store");

        if (pkg) {
            router.put(routeName, form);
        } else {
            router.post(routeName, form);
        }
    };

    const totalCredits = form.paid_credits + form.free_credits;
    const creditsPerRM =
        form.price_in_rm > 0
            ? (totalCredits / form.price_in_rm).toFixed(2)
            : "0.00";

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        {pkg
                                            ? "Edit Package"
                                            : "Create New Package"}
                                    </h1>
                                    <p className="text-orange-100 text-sm">
                                        {pkg
                                            ? "Update package details and pricing"
                                            : "Set up a new credit package for customers"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-8 space-y-6">
                                    {/* Package Name + Best Value Toggle */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Package
                                                    size={16}
                                                    className="text-orange-600"
                                                />
                                                Package Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="e.g., Starter Pack, Premium Package"
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Star
                                                    size={16}
                                                    className="text-yellow-500"
                                                />
                                                Best Value
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        best_value:
                                                            !form.best_value,
                                                    })
                                                }
                                                className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                                                    form.best_value
                                                        ? "bg-yellow-500 text-white border-yellow-500"
                                                        : "bg-white text-gray-600 border-gray-300 hover:border-yellow-400"
                                                }`}
                                            >
                                                {form.best_value
                                                    ? "✓ Best Value"
                                                    : "Mark as Best Value"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price + Credits */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <DollarSign
                                                    size={16}
                                                    className="text-orange-600"
                                                />
                                                Price (RM)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                                    RM
                                                </span>
                                                <input
                                                    type="number"
                                                    name="price_in_rm"
                                                    value={form.price_in_rm}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full border border-gray-300 rounded-xl pl-14 pr-4 py-3 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                                <Info size={12} />
                                                Set to 0 for free
                                            </p>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <DollarSign
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                                Paid Credits
                                            </label>
                                            <input
                                                type="number"
                                                name="paid_credits"
                                                value={form.paid_credits}
                                                onChange={handleChange}
                                                placeholder="0"
                                                min="0"
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Gift
                                                    size={16}
                                                    className="text-green-600"
                                                />
                                                Free Credits
                                            </label>
                                            <input
                                                type="number"
                                                name="free_credits"
                                                value={form.free_credits}
                                                onChange={handleChange}
                                                placeholder="0"
                                                min="0"
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Dates + Validity */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Calendar
                                                    size={16}
                                                    className="text-gray-600"
                                                />
                                                Effective From
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="effective_from"
                                                value={form.effective_from}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                                <Calendar
                                                    size={16}
                                                    className="text-gray-600"
                                                />
                                                Valid Until
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="valid_until"
                                                value={form.valid_until}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                                <Info size={12} />
                                                Leave empty for no expiry
                                            </p>
                                        </div>
                                    </div>

                                    {/* Row 5: Validity Period */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                            <Clock
                                                size={16}
                                                className="text-purple-600"
                                            />
                                            Validity Period from Purchase Date
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={getValidityValue()}
                                                onChange={(e) =>
                                                    handleValidityChange(
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                placeholder="0"
                                                min="0"
                                                className="flex-1 font-semibold px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setValidityUnit(
                                                        validityUnit === "days"
                                                            ? "months"
                                                            : "days"
                                                    )
                                                }
                                                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all border-2 whitespace-nowrap ${
                                                    validityUnit === "months"
                                                        ? "bg-purple-600 text-white border-purple-600"
                                                        : "bg-white text-purple-600 border-purple-600"
                                                }`}
                                            >
                                                {validityUnit === "days"
                                                    ? "Days"
                                                    : "Months"}
                                            </button>
                                        </div>
                                        <p className="text-xs text-purple-700 font-medium mt-1.5">
                                            = {form.validity_days} days total
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={handleSubmit}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-linear-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            <Save size={20} />
                                            {pkg
                                                ? "Update Package"
                                                : "Create Package"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                window.history.back()
                                            }
                                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            <X size={20} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        Live Preview
                                    </h3>
                                </div>
                                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                                    {/* Preview Header */}
                                    <div
                                        className={`${
                                            isFree
                                                ? "bg-linear-to-br from-green-500 to-emerald-600"
                                                : "bg-linear-to-br from-orange-500 to-red-600"
                                        } p-6 text-white relative overflow-hidden`}
                                    >
                                        {/* Best Value Badge */}
                                        {form.best_value && (
                                            <div className="absolute top-3 right-3">
                                                <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                                    <Star
                                                        size={12}
                                                        fill="currentColor"
                                                    />
                                                    BEST VALUE
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4">
                                            <Package
                                                size={40}
                                                className="shrink-0 mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold mb-1 wrap-break-word">
                                                    {form.name ||
                                                        "Package Name"}
                                                </h3>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">
                                                        {isFree
                                                            ? "FREE"
                                                            : `RM ${form.price_in_rm}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {!form.active && (
                                            <div className="mt-3">
                                                <span className="px-2 py-1 bg-gray-900 bg-opacity-50 text-xs font-medium rounded">
                                                    Inactive
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview Content */}
                                    <div className="p-6 space-y-3">
                                        {/* Paid Credits */}
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-2">
                                                <DollarSign
                                                    size={18}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Paid Credits
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-blue-600">
                                                {form.paid_credits}
                                            </span>
                                        </div>

                                        {/* Free Credits */}
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                            <div className="flex items-center gap-2">
                                                <Gift
                                                    size={18}
                                                    className="text-green-600"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Free Credits
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-green-600">
                                                +{form.free_credits}
                                            </span>
                                        </div>

                                        {/* Total Credits */}
                                        <div className="flex items-center justify-between p-4 bg-linear-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                                            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                                Total Credits
                                            </span>
                                            <span className="text-2xl font-bold text-orange-700">
                                                {totalCredits}
                                            </span>
                                        </div>

                                        {/* Validity Period */}
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                                            <div className="flex items-center gap-2">
                                                <Clock
                                                    size={18}
                                                    className="text-purple-600"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Valid For
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-purple-600">
                                                {form.validity_days} days
                                            </span>
                                        </div>

                                        {/* Credit Value - Centered */}
                                        {form.price_in_rm > 0 &&
                                            totalCredits > 0 && (
                                                <div className="mt-4 p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-center">
                                                    <p className="text-xs text-blue-700 font-medium mb-1 uppercase tracking-wide">
                                                        Credits per RM
                                                    </p>
                                                    <p className="text-2xl font-bold text-blue-900">
                                                        {creditsPerRM}
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
}
