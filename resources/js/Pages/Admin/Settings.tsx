import React, { useState } from "react";
import type { ChangeEvent } from "react";
import { Settings, UserPlus, Users, Calendar } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import type { PageProps } from "../../types/index";
import Loading from "@/components/ui/loading";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface SettingsPageProps extends PageProps {
    settings: {
        registration_bonus: number;
        registration_bonus_validity: number;
        referral_bonus: number;
        referral_threshold: number;
        referral_bonus_validity: number;
    };
}

interface NumberInputProps {
    label: string;
    name: keyof SettingsPageProps["settings"];
    value: number;
    unit?: string;
    min?: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface ValidityInputProps {
    label: string;
    name: keyof SettingsPageProps["settings"];
    value: number;
    min?: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
    label,
    name,
    value,
    unit,
    min = 0,
    onChange,
}) => {
    return (
        <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={onChange}
                    min={min}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-lg font-semibold"
                />
                {unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};

const ValidityInput: React.FC<ValidityInputProps> = ({
    label,
    name,
    value,
    min = 1,
    onChange,
}) => {
    const [unit, setUnit] = useState<"days" | "months">("days");
    const displayValue = unit === "months" ? Math.round(value / 30) : value;

    const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value === "" ? 0 : Number(e.target.value);
        const daysValue = unit === "months" ? inputValue * 30 : inputValue;
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                name: name,
                value: String(daysValue),
            },
        } as ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
    };

    const toggleUnit = () => {
        setUnit(unit === "days" ? "months" : "days");
    };

    const months = Math.floor(value / 30);
    const days = value % 30;

    return (
        <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="flex gap-2 items-start">
                <div className="relative flex-1">
                    <input
                        type="number"
                        value={displayValue}
                        onChange={handleValueChange}
                        min={min}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-lg font-semibold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                        {unit}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={toggleUnit}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-2 text-sm font-medium text-gray-700"
                    title={`Switch to ${unit === "days" ? "months" : "days"}`}
                >
                    <Calendar className="w-4 h-4" />
                </button>
            </div>
            {unit === "days" && value >= 30 && (
                <p className="text-gray-400 text-sm mt-1">
                    ≈ {months} {months === 1 ? "month" : "months"}{" "}
                    {days > 0 && `and ${days} ${days === 1 ? "day" : "days"}`}
                </p>
            )}
            {unit === "months" && (
                <p className="text-gray-400 text-sm mt-1">= {value} days</p>
            )}
        </div>
    );
};

export default function SettingsPage() {
    const { props } = usePage<SettingsPageProps>();
    const [form, setForm] = useState(props.settings);
    const [saving, setSaving] = useState(false);

    const initialSettings = {
        registration_bonus: 50,
        registration_bonus_validity: 180,
        referral_bonus: 50,
        referral_threshold: 3,
        referral_bonus_validity: 180,
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === "" ? 0 : Number(e.target.value);
        setForm({ ...form, [e.target.name]: value });
    };

    const handleSave = () => {
        if (
            form.registration_bonus < 0 ||
            form.registration_bonus_validity < 1 ||
            form.referral_bonus < 0 ||
            form.referral_threshold < 1 ||
            form.referral_bonus_validity < 1
        ) {
            toast.error("All values must be positive and validity >= 1 day");
            return;
        }

        setSaving(true);
        router.put(route("admin.settings.update"), form, {
            onSuccess: () => toast.success("Settings updated successfully!"),
            onError: (errors) => {
                Object.values(errors).forEach((error) =>
                    toast.error(error as string)
                );
            },
            onFinish: () => setSaving(false),
        });
    };

    const hasChanges = JSON.stringify(form) !== JSON.stringify(initialSettings);

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="bg-linear-to-r from-orange-500 to-red-600 rounded-2xl p-8 mb-6 shadow-lg max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                            <Settings
                                className="w-8 h-8 text-orange-500"
                                strokeWidth={2}
                            />
                        </div>
                        <div className="text-white">
                            <h1 className="text-3xl font-bold">Settings</h1>
                            <p className="text-white text-opacity-90 mt-1">
                                Configure your credit system
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Cards */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Registration Bonus Card */}
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                        <div className="bg-linear-to-r from-orange-500 to-orange-600 p-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                    <UserPlus
                                        className="w-6 h-6 text-orange-500"
                                        strokeWidth={2}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Registration Bonus
                                    </h2>
                                    <p className="text-white text-opacity-90 text-sm">
                                        Credits awarded when a new customer
                                        registers
                                    </p>
                                </div>
                            </div>
                        </div>
                        <NumberInput
                            label="Free Credits Amount"
                            name="registration_bonus"
                            value={form.registration_bonus}
                            onChange={handleChange}
                            unit="free credits"
                        />
                        <ValidityInput
                            label="Validity"
                            name="registration_bonus_validity"
                            value={form.registration_bonus_validity}
                            onChange={handleChange}
                            min={1}
                        />
                    </div>

                    {/* Referral Program Card */}
                    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                        <div className="bg-linear-to-r from-red-500 to-red-600 p-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                                    <Users
                                        className="w-6 h-6 text-red-500"
                                        strokeWidth={2}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Referral Program
                                    </h2>
                                    <p className="text-white text-opacity-90 text-sm">
                                        Reward customers for referring new users
                                    </p>
                                </div>
                            </div>
                        </div>
                        <NumberInput
                            label="Referral Bonus"
                            name="referral_bonus"
                            value={form.referral_bonus}
                            onChange={handleChange}
                            unit="free credits"
                        />
                        <NumberInput
                            label="For every"
                            name="referral_threshold"
                            value={form.referral_threshold}
                            onChange={handleChange}
                            unit="referrals"
                            min={1}
                        />
                        <ValidityInput
                            label="Validity"
                            name="referral_bonus_validity"
                            value={form.referral_bonus_validity}
                            onChange={handleChange}
                            min={1}
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="bg-linear-to-r from-orange-500 to-red-600 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loading />
                                Saving Changes...
                            </>
                        ) : (
                            "Save Settings"
                        )}
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
