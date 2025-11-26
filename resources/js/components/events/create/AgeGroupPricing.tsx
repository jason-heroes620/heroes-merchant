import { Plus, Trash2, Users, AlertCircle } from "lucide-react";
import type { AgeGroup } from "../../../types/events";
import type { AgeGroupError } from "./PricingTab";

interface AgeGroupPricingProps {
    ageGroups: AgeGroup[];
    addAgeGroup: () => void;
    removeAgeGroup: (index: number) => void;
    updateAgeGroup: (index: number, field: keyof AgeGroup, value: any) => void;
    ageGroupErrors: AgeGroupError[];
    pricing_type: "age_based" | "mixed";
}

export default function AgeGroupPricing({
    ageGroups,
    addAgeGroup,
    removeAgeGroup,
    updateAgeGroup,
    ageGroupErrors,
    pricing_type,
}: AgeGroupPricingProps) {
    // Handle price changes - now in RM, not cents!
    const handlePriceChange = (
        groupIndex: number,
        field:
            | "fixed_price_in_rm"
            | "weekday_price_in_rm"
            | "weekend_price_in_rm",
        value: string
    ) => {
        const priceInRM =
            value === "" || value == null ? null : parseFloat(value);
        updateAgeGroup(groupIndex, field as any, priceInRM);
    };

    return (
        <section className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-800">
                                {pricing_type === "mixed"
                                    ? "Mixed Group Pricing"
                                    : "Age Group Pricing"}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                {pricing_type === "mixed"
                                    ? "Set weekday & weekend prices for each age group"
                                    : "Set a single price per age range"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={addAgeGroup}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} /> Add Group
                    </button>
                </div>

                {ageGroups.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="inline-flex p-6 bg-white rounded-full shadow-lg mb-4">
                            <Users className="h-10 w-10 text-gray-300" />
                        </div>
                        <p className="text-gray-700 font-bold text-lg mb-2">
                            No age groups defined yet
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Create age groups to offer different pricing tiers
                        </p>
                        <button
                            type="button"
                            onClick={addAgeGroup}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Plus size={20} /> Create First Age Group
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {ageGroups.map((group, groupIndex) => {
                            const hasErrors = Object.values(
                                ageGroupErrors[groupIndex] || {}
                            ).some((e) => e);

                            return (
                                <div key={groupIndex} className="relative">
                                    {/* Badge Number */}
                                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10">
                                        {groupIndex + 1}
                                    </div>
                                    <div
                                        className={`p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 rounded-xl transition-all ${
                                            hasErrors
                                                ? "border-red-300"
                                                : "border-orange-200"
                                        }`}
                                    >
                                        {/* Age Group Definition Section */}
                                        <div className="mb-6 pb-6 border-b-2 border-orange-200">
                                            <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">
                                                Age Group Details
                                            </label>

                                            {/* Age Display */}
                                            <div className="mt-4">
                                                <span className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold uppercase text-sm px-4 py-1 rounded-full inline-block">
                                                    {group.label}{" "}
                                                    {group.min_age != null &&
                                                    group.max_age != null
                                                        ? `${group.min_age} - ${group.max_age} years`
                                                        : group.min_age != null
                                                        ? `${group.min_age}+ years`
                                                        : group.max_age != null
                                                        ? `Up to ${group.max_age} years`
                                                        : "Not set"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pricing Section */}
                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                {pricing_type ===
                                                "age_based" ? (
                                                    <div>
                                                        <label className="flex items-center gap-1 text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">
                                                            Price (RM){" "}
                                                            <span className="text-red-500">
                                                                *
                                                            </span>
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">
                                                                RM
                                                            </span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={
                                                                    (
                                                                        group as any
                                                                    )
                                                                        .fixed_price_in_rm !=
                                                                    null
                                                                        ? Number(
                                                                              (
                                                                                  group as any
                                                                              )
                                                                                  .fixed_price_in_rm
                                                                          ).toFixed(
                                                                              2
                                                                          )
                                                                        : ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePriceChange(
                                                                        groupIndex,
                                                                        "fixed_price_in_rm",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className={`w-full pl-14 pr-4 py-3 text-lg font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                    ageGroupErrors[
                                                                        groupIndex
                                                                    ]?.price
                                                                        ? "border-red-300"
                                                                        : "border-orange-300"
                                                                }`}
                                                            />
                                                        </div>
                                                        {ageGroupErrors[
                                                            groupIndex
                                                        ]?.price && (
                                                            <p className="text-red-600 text-xs flex items-center gap-1 mt-2 font-medium">
                                                                <AlertCircle
                                                                    size={12}
                                                                />
                                                                {
                                                                    ageGroupErrors[
                                                                        groupIndex
                                                                    ].price
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-1.5">
                                                                    Weekday
                                                                    Price (RM){" "}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                                </label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                                                                        RM
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        placeholder="0.00"
                                                                        value={
                                                                            (
                                                                                group as any
                                                                            )
                                                                                .weekday_price_in_rm !=
                                                                            null
                                                                                ? Number(
                                                                                      (
                                                                                          group as any
                                                                                      )
                                                                                          .weekday_price_in_rm
                                                                                  ).toFixed(
                                                                                      2
                                                                                  )
                                                                                : ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handlePriceChange(
                                                                                groupIndex,
                                                                                "weekday_price_in_rm",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className={`w-full pl-11 pr-3 py-2.5 text-base font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                            ageGroupErrors[
                                                                                groupIndex
                                                                            ]
                                                                                ?.price
                                                                                ? "border-red-300"
                                                                                : "border-orange-300"
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-orange-700 uppercase tracking-wide mb-1.5">
                                                                    Weekend
                                                                    Price (RM){" "}
                                                                    <span className="text-red-500">
                                                                        *
                                                                    </span>
                                                                </label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                                                                        RM
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        placeholder="0.00"
                                                                        value={
                                                                            (
                                                                                group as any
                                                                            )
                                                                                .weekend_price_in_rm !=
                                                                            null
                                                                                ? Number(
                                                                                      (
                                                                                          group as any
                                                                                      )
                                                                                          .weekend_price_in_rm
                                                                                  ).toFixed(
                                                                                      2
                                                                                  )
                                                                                : ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handlePriceChange(
                                                                                groupIndex,
                                                                                "weekend_price_in_rm",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className={`w-full pl-11 pr-3 py-2.5 text-base font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                            ageGroupErrors[
                                                                                groupIndex
                                                                            ]
                                                                                ?.price
                                                                                ? "border-red-300"
                                                                                : "border-orange-300"
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {ageGroupErrors[
                                                            groupIndex
                                                        ]?.price && (
                                                            <p className="text-red-600 text-xs flex items-center gap-1 mt-2 font-medium">
                                                                <AlertCircle
                                                                    size={12}
                                                                />
                                                                {
                                                                    ageGroupErrors[
                                                                        groupIndex
                                                                    ].price
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delete Button */}
                                            <div className="flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeAgeGroup(
                                                            groupIndex
                                                        )
                                                    }
                                                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-95 border-2 border-transparent hover:border-red-200"
                                                    title="Remove age group"
                                                >
                                                    <Trash2 size={22} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
