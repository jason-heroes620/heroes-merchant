import { Ticket, Users, Clock, Infinity, Info } from "lucide-react";

interface RedemptionLimitsSectionProps {
    data: any;
    setData: (key: string, value: any) => void;
}

export default function RedemptionLimitsSection({
    data,
    setData,
}: RedemptionLimitsSectionProps) {
    const claimConfig = data.claim_configuration || {};

    const handleTotalTypeChange = (type: "unlimited" | "limited") => {
        setData("claim_configuration", {
            ...claimConfig,
            total_redemption_type: type,
            total_redemption_limit:
                type === "unlimited"
                    ? null
                    : claimConfig.total_redemption_limit ?? 1,
            // Clamp daily limit if necessary
            daily_redemption_limit:
                type === "limited" && claimConfig.daily_redemption_limit
                    ? Math.min(
                          claimConfig.daily_redemption_limit,
                          claimConfig.total_redemption_limit ?? 1
                      )
                    : claimConfig.daily_redemption_limit,
        });
    };

    const handleDailyTypeChange = (type: "once" | "multiple") => {
        setData("claim_configuration", {
            ...claimConfig,
            daily_redemption_type: type,
            daily_redemption_limit:
                type === "once"
                    ? null
                    : claimConfig.daily_redemption_limit ?? 1,
        });
    };

    const handleTotalLimitChange = (value: number | null) => {
        const clampedValue =
            value !== null && claimConfig.daily_redemption_limit
                ? Math.max(value, claimConfig.daily_redemption_limit)
                : value;

        setData("claim_configuration", {
            ...claimConfig,
            total_redemption_limit: clampedValue,
        });
    };

    const handleDailyLimitChange = (value: number | null) => {
        let maxTotal =
            claimConfig.total_redemption_type === "limited"
                ? claimConfig.total_redemption_limit
                : null;
        const clampedValue =
            value !== null && maxTotal ? Math.min(value, maxTotal) : value;

        setData("claim_configuration", {
            ...claimConfig,
            daily_redemption_limit: clampedValue,
        });
    };

    return (
        <div className="p-5 bg-orange-50 border border-orange-200 rounded-xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                    <Ticket size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                    Redemption Limits
                </h3>
            </div>

            {/* Total Redemptions */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Users size={15} className="text-orange-600" />
                    Total redemptions per customer
                </div>
                <p className="text-xs text-gray-600 flex items-start gap-1">
                    <Info size={12} className="mt-0.5" />
                    Limits how many times a customer can redeem this event
                    across its entire duration.
                </p>

                <div className="flex gap-2 mt-2">
                    {/* Unlimited */}
                    <label className="flex-1 flex items-center gap-2 p-2 bg-white border rounded-lg cursor-pointer hover:border-orange-400">
                        <input
                            type="radio"
                            name="total_redemption_type"
                            value="unlimited"
                            checked={
                                claimConfig.total_redemption_type ===
                                "unlimited"
                            }
                            onChange={() => handleTotalTypeChange("unlimited")}
                            className="w-4 h-4 text-orange-500"
                        />
                        <span className="flex items-center gap-1 text-sm">
                            <Infinity size={14} /> Unlimited
                        </span>
                    </label>

                    {/* Limited */}
                    <label className="flex-1 flex items-center gap-2 p-2 bg-white border rounded-lg cursor-pointer hover:border-orange-400">
                        <input
                            type="radio"
                            name="total_redemption_type"
                            value="limited"
                            checked={
                                claimConfig.total_redemption_type === "limited"
                            }
                            onChange={() => handleTotalTypeChange("limited")}
                            className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm whitespace-nowrap">
                            Max total
                        </span>

                        <input
                            type="number"
                            min={1}
                            value={claimConfig.total_redemption_limit ?? ""}
                            onChange={(e) =>
                                handleTotalLimitChange(
                                    e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                )
                            }
                            disabled={
                                claimConfig.total_redemption_type !== "limited"
                            }
                            className="w-16 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                        />
                    </label>
                </div>
            </div>

            {/* Daily Redemptions */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Clock size={15} className="text-orange-600" />
                    Daily redemption limit
                </div>
                <p className="text-xs text-gray-600 flex items-start gap-1">
                    <Info size={12} className="mt-0.5" />
                    Controls how many times a customer can redeem per day.
                    Resets automatically.
                </p>

                <div className="flex gap-2 mt-2">
                    {/* Once per day */}
                    <label className="flex-1 flex items-center gap-2 p-2 bg-white border rounded-lg cursor-pointer hover:border-orange-400">
                        <input
                            type="radio"
                            name="daily_redemption_type"
                            value="once"
                            checked={
                                claimConfig.daily_redemption_type === "once"
                            }
                            onChange={() => handleDailyTypeChange("once")}
                            className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm">Once per day</span>
                    </label>

                    {/* Multiple */}
                    <label className="flex-1 flex items-center gap-2 p-2 bg-white border rounded-lg cursor-pointer hover:border-orange-400">
                        <input
                            type="radio"
                            name="daily_redemption_type"
                            value="multiple"
                            checked={
                                claimConfig.daily_redemption_type === "multiple"
                            }
                            onChange={() => handleDailyTypeChange("multiple")}
                            className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm whitespace-nowrap">
                            Max per day
                        </span>

                        <input
                            type="number"
                            min={1}
                            value={claimConfig.daily_redemption_limit ?? ""}
                            onChange={(e) =>
                                handleDailyLimitChange(
                                    e.target.value === ""
                                        ? null
                                        : Number(e.target.value)
                                )
                            }
                            disabled={
                                claimConfig.daily_redemption_type !== "multiple"
                            }
                            className="w-16 px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
