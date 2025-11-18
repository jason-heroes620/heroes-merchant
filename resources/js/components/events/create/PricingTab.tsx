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
    price_in_cents?: string;
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
            if (
                g.min_age != null &&
                g.max_age != null &&
                g.min_age > g.max_age
            ) {
                e.min_age = "Min age cannot be greater than Max age";
                e.max_age = "Max age cannot be less than Min age";
            }

            errs.push(e);
        });

        // overlap check (only when both min and max are provided)
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
    }, [ageGroups, data.pricing_type]);

    const handleUpdateAgeGroup = (
        i: number,
        field: keyof AgeGroup,
        value: any
    ) => {
        updateAgeGroup(i, field, value);
    };

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

    const getPrice = (type: "fixed" | "day_type") => {
        const p = data.prices?.find((pr) => pr.pricing_type === type);
        if (!p) {
            if (type === "fixed") return { fixed_price_in_cents: 0 };
            return { weekday_price_in_cents: 0, weekend_price_in_cents: 0 };
        }
        return p;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Pricing Strategy Banner */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm">
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
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
                                <strong>Age-Based:</strong> Different prices per
                                age group
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

            {/* Pricing Type Selection */}
            <section className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Select Pricing Strategy
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Choose how you want to price your event
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    {pricingOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = data.pricing_type === option.value;
                        return (
                            <label
                                key={option.value}
                                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                                    isSelected
                                        ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl"
                                        : "border-gray-200 hover:border-orange-300 hover:shadow-md"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="pricing_type"
                                    checked={isSelected}
                                    onChange={() =>
                                        setData(
                                            "pricing_type",
                                            option.value as EventFormShape["pricing_type"]
                                        )
                                    }
                                    className="sr-only"
                                />
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`p-3 rounded-xl ${
                                            isSelected
                                                ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg"
                                                : "bg-gray-100"
                                        }`}
                                    >
                                        <Icon
                                            size={24}
                                            className={
                                                isSelected
                                                    ? "text-white"
                                                    : "text-gray-600"
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
                    })}
                </div>
            </section>

            {/* Fixed Pricing */}
            {data.pricing_type === "fixed" && (
                <section className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-8 shadow-md">
                    <label className="block text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                        Base Price (RM) *
                    </label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-2xl">
                            RM
                        </span>
                        <input
                            type="number"
                            step={0.01}
                            min={0}
                            value={(
                                (getPrice("fixed")?.fixed_price_in_cents ?? 0) /
                                100
                            ).toFixed(2)}
                            onChange={(e) => {
                                const cents = e.target.value
                                    ? Math.round(Number(e.target.value) * 100)
                                    : 0;
                                setData("prices", [
                                    {
                                        pricing_type: "fixed",
                                        fixed_price_in_cents: cents,
                                    },
                                ]);
                            }}
                            className="w-full pl-20 pr-6 py-5 text-3xl font-bold border-2 border-orange-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-lg"
                            placeholder="0.00"
                        />
                    </div>
                    {errors?.prices?.[0]?.fixed_price_in_cents && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                            <AlertCircle size={14} />{" "}
                            {errors.prices[0].fixed_price_in_cents}
                        </p>
                    )}
                </section>
            )}

            {/* Day-Based Pricing */}
            {data.pricing_type === "day_type" && (
                <section className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-8 space-y-6 shadow-md">
                    {["weekday", "weekend"].map((day) => {
                        const priceKey = `${day}_price_in_cents` as
                            | "weekday_price_in_cents"
                            | "weekend_price_in_cents";
                        const priceValue = getPrice("day_type")[priceKey] || 0;
                        const label =
                            day === "weekday"
                                ? "Weekday Price (Mon-Fri)"
                                : "Weekend Price (Sat-Sun)";
                        return (
                            <div key={day}>
                                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    {label} *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                                        RM
                                    </span>
                                    <input
                                        type="number"
                                        step={0.01}
                                        min={0}
                                        value={(priceValue / 100).toFixed(2)}
                                        onChange={(e) => {
                                            const cents = e.target.value
                                                ? Math.round(
                                                      Number(e.target.value) *
                                                          100
                                                  )
                                                : 0;
                                            setData("prices", [
                                                {
                                                    pricing_type: "day_type",
                                                    ...getPrice("day_type"),
                                                    [priceKey]: cents,
                                                },
                                            ]);
                                        }}
                                        className="w-full pl-16 pr-4 py-4 text-xl font-bold border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {(data.pricing_type === "age_based" ||
                data.pricing_type === "mixed") && (
                <>
                    {!data.is_suitable_for_all_ages ? (
                        <AgeGroupPricing
                            ageGroups={ageGroups}
                            addAgeGroup={addAgeGroup}
                            removeAgeGroup={removeAgeGroup}
                            updateAgeGroup={handleUpdateAgeGroup}
                            ageGroupErrors={ageGroupErrors}
                            pricing_type={data.pricing_type}
                        />
                    ) : (
                        <p className="text-red-600 text-sm mt-2">
                            Age-based pricing and mixed pricing are ignored because "Suitable for
                            All Ages" is selected.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
