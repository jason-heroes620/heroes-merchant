import { useState } from "react";
import type { ChangeEvent } from "react";
import {
    Settings,
    UserPlus,
    Users,
    Calendar,
    Save,
    RotateCcw,
} from "lucide-react";
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
        cancellation_policy_hours: number;
        cancellation_policy_terms: string;
    };
}

const NumberInput = ({ label, name, value, unit, min = 0, onChange }: any) => {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
                {label}
            </label>
            <div className="relative">
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={onChange}
                    min={min}
                    className="w-full px-3 py-2 pr-28 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition-all text-sm font-medium"
                />
                {unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
};

const ValidityInput = ({
    label,
    name,
    value,
    min = 1,
    onChange,
    helpText,
}: any) => {
    const [unit, setUnit] = useState<"days" | "months">("days");
    const displayValue = unit === "months" ? Math.round(value / 30) : value;

    const handleValueChange = (e: any) => {
        const inputValue = e.target.value === "" ? 0 : Number(e.target.value);
        const daysValue = unit === "months" ? inputValue * 30 : inputValue;
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                name: name,
                value: String(daysValue),
            },
        };
        onChange(syntheticEvent);
    };

    const months = Math.floor(value / 30);
    const days = value % 30;

    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
                {label}
            </label>
            {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="number"
                        value={displayValue}
                        onChange={handleValueChange}
                        min={min}
                        className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition-all text-sm font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
                        {unit}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setUnit(unit === "days" ? "months" : "days")}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-600"
                    title={`Switch to ${unit === "days" ? "months" : "days"}`}
                >
                    <Calendar className="w-4 h-4" />
                </button>
            </div>
            {unit === "days" && value >= 30 && (
                <p className="text-xs text-gray-500">
                    ≈ {months} {months === 1 ? "month" : "months"}{" "}
                    {days > 0 && `${days} ${days === 1 ? "day" : "days"}`}
                </p>
            )}
            {unit === "months" && (
                <p className="text-xs text-gray-500">= {value} days</p>
            )}
        </div>
    );
};

export default function SettingsPage() {
    const { props } = usePage<SettingsPageProps>();
    const [form, setForm] = useState(props.settings);
    const [saving, setSaving] = useState(false);
    const initialSettings = props.settings;

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

    const handleReset = () => {
        if (confirm("Reset all settings to their original values?")) {
            setForm(initialSettings);
        }
    };

    const hasChanges = JSON.stringify(form) !== JSON.stringify(initialSettings);

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Compact Header */}
                    <div className="bg-linear-to-r from-orange-500 to-red-600 rounded-xl p-5 mb-5 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2.5 rounded-lg">
                                    <Settings
                                        className="w-6 h-6 text-white"
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Settings
                                    </h1>
                                    <p className="text-white/90 text-sm">
                                        Configure your system
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                        {/* Registration Bonus */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-linear-to-br from-orange-500 to-orange-600 p-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <UserPlus
                                            className="w-5 h-5 text-white"
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">
                                            Registration Bonus
                                        </h2>
                                        <p className="text-white/90 text-xs">
                                            New customer rewards
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <NumberInput
                                    label="Free Credits on Registration"
                                    name="registration_bonus"
                                    value={form.registration_bonus}
                                    onChange={handleChange}
                                    unit="credits"
                                />
                                <ValidityInput
                                    label="Validity Period"
                                    name="registration_bonus_validity"
                                    value={form.registration_bonus_validity}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </div>
                        </div>

                        {/* Referral Program */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-linear-to-br from-red-500 to-red-600 p-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Users
                                            className="w-5 h-5 text-white"
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">
                                            Referral Program
                                        </h2>
                                        <p className="text-white/90 text-xs">
                                            Referral incentives
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <NumberInput
                                    label="Referral Bonus"
                                    name="referral_bonus"
                                    value={form.referral_bonus}
                                    onChange={handleChange}
                                    unit="credits"
                                />
                                <NumberInput
                                    label="Referrals needed for bonus"
                                    name="referral_threshold"
                                    value={form.referral_threshold}
                                    onChange={handleChange}
                                    unit="referrals"
                                    min={1}
                                />
                                <ValidityInput
                                    label="Validity Period"
                                    name="referral_bonus_validity"
                                    value={form.referral_bonus_validity}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </div>
                        </div>

                        {/* Cancellation Policy */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-linear-to-br from-orange-600 to-red-600 p-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Calendar
                                            className="w-5 h-5 text-white"
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">
                                            Cancellation Policy
                                        </h2>
                                        <p className="text-white/90 text-xs">
                                            Credit forfeiture rules
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <NumberInput
                                    label="Minimum notice required"
                                    name="cancellation_policy_hours"
                                    value={form.cancellation_policy_hours}
                                    onChange={handleChange}
                                    unit="hours"
                                    min={0}
                                />
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-700">
                                        Policy Terms
                                    </label>
                                    <textarea
                                        name="cancellation_policy_terms"
                                        value={form.cancellation_policy_terms}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                cancellation_policy_terms:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-200 outline-none transition-all text-xs resize-none"
                                        rows={3}
                                        placeholder="Policy description"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex-1 sm:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>

                    <div className="flex justify-center">
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="sm:flex-none flex gap-2 bg-linear-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                        >
                            {saving ? (
                                <>
                                    <Loading />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
