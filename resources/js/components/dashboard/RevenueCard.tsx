import React, { useState, useMemo } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import FilterButton from "./FilterButton";

interface Props {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    todayPercentage: number;
    weekPercentage: number;
    monthPercentage: number;
}

const RevenueCard: React.FC<Props> = ({
    todayRevenue,
    weekRevenue,
    monthRevenue,
    todayPercentage,
    weekPercentage,
    monthPercentage,
}) => {
    const [revenueFilter, setRevenueFilter] = useState<
        "today" | "week" | "month"
    >("today");

    const displayedRevenue = useMemo(() => {
        if (revenueFilter === "today") return todayRevenue;
        if (revenueFilter === "week") return weekRevenue;
        return monthRevenue;
    }, [revenueFilter, todayRevenue, weekRevenue, monthRevenue]);

    const displayedPercentage = useMemo(() => {
        if (revenueFilter === "today") return todayPercentage;
        if (revenueFilter === "week") return weekPercentage;
        return monthPercentage;
    }, [revenueFilter, todayPercentage, weekPercentage, monthPercentage]);

    return (
        <div className="bg-linear-to-r from-orange-400 via-orange-500 to-red-500 text-white rounded-2xl p-8 relative overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] group">
            <div className="absolute top-0 right-0 opacity-10">
                <DollarSign size={120} className="text-yellow-100" />
            </div>
            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold uppercase tracking-wide text-orange-100">
                        Revenue
                    </span>
                    <div className="flex items-center gap-2">
                        <FilterButton
                            active={revenueFilter === "today"}
                            onClick={() => setRevenueFilter("today")}
                        >
                            Today
                        </FilterButton>
                        <FilterButton
                            active={revenueFilter === "week"}
                            onClick={() => setRevenueFilter("week")}
                        >
                            Week
                        </FilterButton>
                        <FilterButton
                            active={revenueFilter === "month"}
                            onClick={() => setRevenueFilter("month")}
                        >
                            Month
                        </FilterButton>
                    </div>
                </div>
                <p className="text-6xl font-bold mb-3">
                    RM{" "}
                    {(displayedRevenue ?? 0).toLocaleString("en-MY", {
                        minimumFractionDigits: 2,
                    })}
                </p>
                <div className="flex items-center gap-2 text-orange-100">
                    <div className="flex gap-2 items-center">
                        <TrendingUp size={18} />
                        <span className="font-semibold">
                            {displayedPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <span>
                        {revenueFilter === "today"
                            ? "vs yesterday"
                            : `vs last ${revenueFilter}`}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RevenueCard;
