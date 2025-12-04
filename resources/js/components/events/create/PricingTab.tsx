import { useState, useEffect } from "react";
import {
    DollarSign,
    Users,
    Calendar,
    Info,
    AlertCircle,
    BadgeDollarSign,
} from "lucide-react";
import type { EventFormShape, AgeGroup } from "../../../types/events";
import AgeGroupPricing from "./AgeGroupPricing";

export type AgeGroupError = {
    label?: string;
    min_age?: string;
    max_age?: string;
    overlap?: string;
    price?: string;
};

interface PricingTabProps {
    data: EventFormShape;
    setData: (k: keyof EventFormShape | EventFormShape, v?: any) => void;
    errors: Record<string, any>;
    ageGroups: AgeGroup[];
    addAgeGroup: () => void;
    updateAgeGroup: (index: number, field: keyof AgeGroup, value: any) => void;
    removeAgeGroup: (index: number) => void;
}

export default function PricingTab({
    data,
    setData,
    errors,
    ageGroups,
    addAgeGroup,
    updateAgeGroup,
    removeAgeGroup,
}: PricingTabProps) {
    const [ageGroupErrors, setAgeGroupErrors] = useState<AgeGroupError[]>([]);

    const validateAgeGroups = (groups: AgeGroup[]) => {
        const errs: AgeGroupError[] = [];

        groups.forEach((g) => {
            const e: AgeGroupError = {};

            // Validate age range
            if (
                g.min_age != null &&
                g.max_age != null &&
                g.min_age > g.max_age
            ) {
                e.min_age = "Min age cannot be greater than Max age";
                e.max_age = "Max age cannot be less than Min age";
            }

            // Validate label
            if (!g.label || g.label.trim() === "") {
                e.label = "Label is required";
            }

            errs.push(e);
        });

        // Overlap check (only when both min and max are provided)
        for (let i = 0; i < groups.length; i++) {
            for (let j = i + 1; j < groups.length; j++) {
                const a = groups[i];
                const b = groups[j];
                if (
                    a.min_age != null &&
                    a.max_age != null &&
                    b.min_age != null &&
                    b.max_age != null &&
                    Math.max(a.min_age, b.min_age) <=
                        Math.min(a.max_age, b.max_age)
                ) {
                    errs[i].overlap = "Overlaps with another group";
                    errs[j].overlap = "Overlaps with another group";
                }
            }
        }

        return errs;
    };

    useEffect(() => {
        setAgeGroupErrors(validateAgeGroups(ageGroups));
    }, [ageGroups]);

    const pricingOptions = [
        {
            value: "fixed",
            label: "Fixed Pricing",
            desc: "One price for everyone",
            icon: DollarSign,
        },
        {
            value: "day_type",
            label: "Day-Based Pricing",
            desc: "Weekday vs weekend pricing",
            icon: Calendar,
        },
        {
            value: "age_based",
            label: "Age-Based Pricing",
            desc: "Different prices for age groups",
            icon: Users,
        },
        {
            value: "mixed",
            label: "Mixed Pricing",
            desc: "Combine age groups + day types",
            icon: BadgeDollarSign,
        },
    ];

    // Get current price for fixed/day_type
    const getCurrentPrice = () => {
        return data.prices?.[0] || {};
    };

    const PricingBanner = () => (
        <div className="bg-linear-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm">
            <div className="flex gap-4">
                <div className="shrink-0">
                    <div className="p-2 bg-orange-500 rounded-lg">
                        <Info className="text-white" size={20} />
                    </div>
                </div>
                <div className="text-sm text-orange-900">
                    <p className="font-bold text-base mb-2">
                        Pricing Strategy Guide
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-orange-800">
                        <li>
                            <strong>Fixed:</strong> Same price for everyone
                        </li>
                        <li>
                            <strong>Age-Based:</strong> Different prices per age
                            group
                        </li>
                        <li>
                            <strong>Day-Based:</strong> Weekday vs weekend
                            pricing
                        </li>
                        <li>
                            <strong>Mixed:</strong> Combine age groups + day
                            pricing
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );

    const PricingTypeCard = ({
        option,
        selected,
        onSelect,
    }: {
        option: (typeof pricingOptions)[0];
        selected: boolean;
        onSelect: () => void;
    }) => {
        const Icon = option.icon;

        return (
            <label
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                    selected
                        ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-100 shadow-xl"
                        : "border-gray-200 hover:border-orange-300 hover:shadow-md"
                }`}
            >
                <input
                    type="radio"
                    name="pricing_type"
                    checked={selected}
                    onChange={onSelect}
                    className="sr-only"
                />

                <div className="flex items-start gap-4">
                    <div
                        className={`p-3 rounded-xl ${
                            selected
                                ? "bg-linear-to-br from-orange-500 to-orange-600 shadow-lg"
                                : "bg-gray-100"
                        }`}
                    >
                        <Icon
                            size={24}
                            className={
                                selected ? "text-white" : "text-gray-600"
                            }
                        />
                    </div>

                    <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900 mb-1">
                            {option.label}
                        </div>
                        <div className="text-sm text-gray-600">
                            {option.desc}
                        </div>
                    </div>
                </div>
            </label>
        );
    };

    const PriceInput = ({
        label,
        value,
        onChange,
        error,
    }: {
        label: string;
        value: number | null;
        onChange: (v: number | null) => void;
        error?: string;
    }) => (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                {label} *
            </label>

            <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-2xl">
                    RM
                </span>

                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value != null ? Number(value).toFixed(2) : ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChange(val === "" ? null : parseFloat(val));
                    }}
                    className={`w-full pl-20 pr-6 py-5 text-3xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-orange-500 bg-white shadow-lg ${
                        error ? "border-red-400" : "border-orange-400"
                    }`}
                    placeholder="0.00"
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} />
                    {error}
                </p>
            )}
        </div>
    );

    const FixedPricing = () => {
        const currentPrice = getCurrentPrice();
        const value = currentPrice.fixed_price_in_rm ?? null;

        return (
            <section className="bg-linear-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-8 shadow-md">
                <PriceInput
                    label="Base Price (RM)"
                    value={value}
                    onChange={(v) =>
                        setData("prices", [
                            {
                                pricing_type: "fixed",
                                fixed_price_in_rm: v,
                                event_age_group_id: null,
                            },
                        ])
                    }
                    error={errors?.["prices.0.fixed_price_in_rm"]}
                />
            </section>
        );
    };

    const DayTypePricing = () => {
        const currentPrice = getCurrentPrice();
        const weekdayPrice = currentPrice.weekday_price_in_rm ?? null;
        const weekendPrice = currentPrice.weekend_price_in_rm ?? null;

        return (
            <section className="bg-linear-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-8 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PriceInput
                        label="Weekday Price (Mon–Fri)"
                        value={weekdayPrice}
                        onChange={(v) =>
                            setData("prices", [
                                {
                                    pricing_type: "day_type",
                                    weekday_price_in_rm: v,
                                    weekend_price_in_rm: weekendPrice,
                                    event_age_group_id: null,
                                },
                            ])
                        }
                        error={errors?.["prices.0.weekday_price_in_rm"]}
                    />

                    <PriceInput
                        label="Weekend Price (Sat–Sun)"
                        value={weekendPrice}
                        onChange={(v) =>
                            setData("prices", [
                                {
                                    pricing_type: "day_type",
                                    weekday_price_in_rm: weekdayPrice,
                                    weekend_price_in_rm: v,
                                    event_age_group_id: null,
                                },
                            ])
                        }
                        error={errors?.["prices.0.weekend_price_in_rm"]}
                    />
                </div>
            </section>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <PricingBanner />

            {/* Pricing Type Selection */}
            <section className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Select Pricing Strategy
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Choose how you want to price your event
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                    {pricingOptions.map((opt) => (
                        <PricingTypeCard
                            key={opt.value}
                            option={opt}
                            selected={data.pricing_type === opt.value}
                            onSelect={() => {
                                setData("pricing_type", opt.value as any);
                                // Reset prices when changing type
                                setData("prices", []);
                            }}
                        />
                    ))}
                </div>
            </section>

            {/* Fixed Pricing */}
            {data.pricing_type === "fixed" && <FixedPricing />}

            {/* Day-Based Pricing */}
            {data.pricing_type === "day_type" && <DayTypePricing />}

            {/* Age-Based or Mixed Pricing */}
            {(data.pricing_type === "age_based" ||
                data.pricing_type === "mixed") && (
                <>
                    {data.is_suitable_for_all_ages ? (
                        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <AlertCircle
                                    className="text-red-600"
                                    size={24}
                                />
                                <div>
                                    <p className="font-bold text-red-800 text-lg">
                                        Age-Based Pricing Not Available
                                    </p>
                                    <p className="text-red-700 text-sm mt-1">
                                        You've marked this event as "Suitable
                                        for All Ages". Please either uncheck
                                        that option or choose Fixed or Day-Based
                                        pricing instead.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AgeGroupPricing
                            ageGroups={ageGroups}
                            addAgeGroup={addAgeGroup}
                            removeAgeGroup={removeAgeGroup}
                            updateAgeGroup={updateAgeGroup}
                            ageGroupErrors={ageGroupErrors}
                            pricing_type={data.pricing_type}
                        />
                    )}
                </>
            )}
        </div>
    );
}
