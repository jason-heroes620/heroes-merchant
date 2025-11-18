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
    const handlePriceChange = (
        groupIndex: number,
        field:
            | "fixed_price_in_cents"
            | "weekday_price_in_cents"
            | "weekend_price_in_cents",
        value: string
    ) => {
        const cents =
            value === "" || value == null
                ? null
                : Math.round(parseFloat(value || "0") * 100);
        updateAgeGroup(groupIndex, field as any, cents);
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
                                Age Group Pricing
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
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-bold transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} /> Add Group
                    </button>
                </div>

                {ageGroups.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="inline-flex p-6 bg-white rounded-full shadow-lg mb-4">
                            <Users className="h-16 w-16 text-gray-300" />
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
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Plus size={20} /> Create First Age Group
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {ageGroups.map((group, groupIndex) => {
                            const hasErrors = Object.values(
                                ageGroupErrors[groupIndex] || {}
                            ).some((e) => e);

                            return (
                                <div
                                    key={groupIndex}
                                    className={`group relative p-6 border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 transition-all ${
                                        hasErrors
                                            ? "border-red-300 shadow-lg shadow-red-100"
                                            : "border-gray-200 hover:border-orange-300 hover:shadow-lg"
                                    }`}
                                >
                                    {/* Badge Number */}
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                        {groupIndex + 1}
                                    </div>

                                    <div className="space-y-4">
                                        {/* First Row: Label + Age Range */}
                                        <div className="grid md:grid-cols-12 gap-4">
                                            {/* Label */}
                                            <div className="md:col-span-5">
                                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Group Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Kids, Teens, Adults, Seniors"
                                                    value={group.label}
                                                    onChange={(e) =>
                                                        updateAgeGroup(
                                                            groupIndex,
                                                            "label",
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                                                        ageGroupErrors[
                                                            groupIndex
                                                        ]?.label
                                                            ? "border-red-300 bg-red-50"
                                                            : "border-gray-300"
                                                    }`}
                                                />
                                                {ageGroupErrors[groupIndex]
                                                    ?.label && (
                                                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                                                        <AlertCircle
                                                            size={12}
                                                        />
                                                        {
                                                            ageGroupErrors[
                                                                groupIndex
                                                            ].label
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Min Age */}
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Min Age
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="5"
                                                    min="0"
                                                    value={group.min_age ?? ""}
                                                    onChange={(e) =>
                                                        updateAgeGroup(
                                                            groupIndex,
                                                            "min_age",
                                                            e.target.value
                                                                ? Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                                : null
                                                        )
                                                    }
                                                    className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                                                        ageGroupErrors[
                                                            groupIndex
                                                        ]?.min_age
                                                            ? "border-red-300 bg-red-50"
                                                            : "border-gray-300"
                                                    }`}
                                                />
                                                {ageGroupErrors[groupIndex]
                                                    ?.min_age && (
                                                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                                                        <AlertCircle
                                                            size={12}
                                                        />
                                                        {
                                                            ageGroupErrors[
                                                                groupIndex
                                                            ].min_age
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Max Age */}
                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Max Age
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="12"
                                                    min="0"
                                                    value={group.max_age ?? ""}
                                                    onChange={(e) =>
                                                        updateAgeGroup(
                                                            groupIndex,
                                                            "max_age",
                                                            e.target.value
                                                                ? Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                                : null
                                                        )
                                                    }
                                                    className={`w-full px-4 py-3 text-sm font-medium border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                                                        ageGroupErrors[
                                                            groupIndex
                                                        ]?.max_age ||
                                                        ageGroupErrors[
                                                            groupIndex
                                                        ]?.overlap
                                                            ? "border-red-300 bg-red-50"
                                                            : "border-gray-300"
                                                    }`}
                                                />
                                                {(ageGroupErrors[groupIndex]
                                                    ?.max_age ||
                                                    ageGroupErrors[groupIndex]
                                                        ?.overlap) && (
                                                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                                                        <AlertCircle
                                                            size={12}
                                                        />
                                                        {ageGroupErrors[
                                                            groupIndex
                                                        ].max_age ||
                                                            ageGroupErrors[
                                                                groupIndex
                                                            ].overlap}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Remove Button */}
                                            <div className="md:col-span-1 flex items-end justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeAgeGroup(
                                                            groupIndex
                                                        )
                                                    }
                                                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-95"
                                                    title="Remove age group"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Second Row: Pricing */}
                                        <div
                                            className={`grid gap-4 p-4 rounded-lg bg-gradient-to-br ${
                                                pricing_type === "mixed"
                                                    ? "md:grid-cols-2 from-orange-50 to-orange-100 border border-orange-200"
                                                    : "md:grid-cols-1 from-orange-50 to-orange-100 border border-orange-200"
                                            }`}
                                        >
                                            {pricing_type === "age_based" ? (
                                                <div>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                        Price (RM)
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
                                                                (group as any)
                                                                    .fixed_price_in_cents !=
                                                                null
                                                                    ? (
                                                                          (
                                                                              group as any
                                                                          )
                                                                              .fixed_price_in_cents /
                                                                          100
                                                                      ).toFixed(
                                                                          2
                                                                      )
                                                                    : ""
                                                            }
                                                            onChange={(e) =>
                                                                handlePriceChange(
                                                                    groupIndex,
                                                                    "fixed_price_in_cents",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`w-full pl-14 pr-4 py-3 text-lg font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                ageGroupErrors[
                                                                    groupIndex
                                                                ]
                                                                    ?.price_in_cents
                                                                    ? "border-red-300"
                                                                    : "border-orange-300"
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                            Weekday Price (RM)
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
                                                                        .weekday_price_in_cents !=
                                                                    null
                                                                        ? (
                                                                              (
                                                                                  group as any
                                                                              )
                                                                                  .weekday_price_in_cents /
                                                                              100
                                                                          ).toFixed(
                                                                              2
                                                                          )
                                                                        : ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePriceChange(
                                                                        groupIndex,
                                                                        "weekday_price_in_cents",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className={`w-full pl-14 pr-4 py-3 text-lg font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                    ageGroupErrors[
                                                                        groupIndex
                                                                    ]
                                                                        ?.price_in_cents
                                                                        ? "border-red-300"
                                                                        : "border-orange-300"
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                                            Weekend Price (RM)
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
                                                                        .weekend_price_in_cents !=
                                                                    null
                                                                        ? (
                                                                              (
                                                                                  group as any
                                                                              )
                                                                                  .weekend_price_in_cents /
                                                                              100
                                                                          ).toFixed(
                                                                              2
                                                                          )
                                                                        : ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePriceChange(
                                                                        groupIndex,
                                                                        "weekend_price_in_cents",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className={`w-full pl-14 pr-4 py-3 text-lg font-bold border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all ${
                                                                    ageGroupErrors[
                                                                        groupIndex
                                                                    ]
                                                                        ?.price_in_cents
                                                                        ? "border-red-300"
                                                                        : "border-orange-300"
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {ageGroupErrors[groupIndex]
                                                ?.price_in_cents && (
                                                <p className="col-span-full text-red-600 text-xs flex items-center gap-1 font-medium">
                                                    <AlertCircle size={12} />
                                                    {
                                                        ageGroupErrors[
                                                            groupIndex
                                                        ].price_in_cents
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        {/* Age Range Display Badge */}
                                        {(group.min_age != null ||
                                            group.max_age != null) && (
                                            <div className="flex items-center gap-2 pt-2">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 rounded-full font-bold text-sm border border-orange-300 shadow-sm">
                                                    <Users size={14} />
                                                    {group.min_age != null &&
                                                    group.max_age != null
                                                        ? `Ages ${group.min_age} - ${group.max_age}`
                                                        : group.min_age != null
                                                        ? `Ages ${group.min_age}+`
                                                        : `Up to ${group.max_age} years`}
                                                </span>
                                            </div>
                                        )}
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
