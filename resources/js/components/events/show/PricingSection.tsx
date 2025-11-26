import type {
    Price,
    AgeGroup,
    UserRole,
    Conversion,
} from "../../../types/events";
import { DollarSign, TrendingUp } from "lucide-react";

type PricingType = 'fixed' | 'day_type' | 'age_based' | 'mixed';

interface PricingSectionProps {
    prices: Price[];
    ageGroups: AgeGroup[];
    userRole: UserRole;
    conversion: Conversion | null;
    eventActivated?: boolean;
}

const PricingSection: React.FC<PricingSectionProps> = ({
    prices,
    ageGroups,
    userRole,
    conversion,
    eventActivated = false,
}) => {
    const formatPrice = (value: number | null | undefined) => {
        const num = Number(value);
        if (isNaN(num)) return "N/A";
        return `RM ${num.toFixed(2)}`;
    };

    const getBasePrice = (price: Price) => {
        switch (price.pricing_type) {
            case "fixed":
            case "age_based":
                return price.fixed_price_in_rm || 0;
            case "day_type":
            case "mixed":
                return price.weekday_price_in_rm || 0;
            default:
                return 0;
        }
    };

    const groupByPricingType = () => {
        const grouped: Record<PricingType, Price[]> = {
            fixed: [],
            day_type: [],
            age_based: [],
            mixed: [],
        };

        prices.forEach((price) => {
            if (price.pricing_type in grouped) {
                grouped[price.pricing_type].push(price);
            }
        });

        return grouped;
    };

    const groupedPrices = groupByPricingType();

    const renderFixedPricing = (priceList: Price[]) => {
        if (priceList.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Fixed Pricing</h3>

                <div className="space-y-3">
                    {priceList.map((price) => {
                        const basePrice = getBasePrice(price);
                        return (
                            <div
                                key={price.id}
                                className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Price</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            {formatPrice(price.fixed_price_in_rm)}
                                        </p>
                                    </div>
                                    {userRole === "admin" && conversion && eventActivated && (
                                        <div className="flex gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Free Credits</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 mb-1">Paid Credits</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.8)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayTypePricing = (priceList: Price[]) => {
        if (priceList.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Day-Based Pricing</h3>

                <div className="space-y-3">
                    {priceList.map((price) => {
                        const basePrice = getBasePrice(price);
                        return (
                            <div
                                key={price.id}
                                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="grid grid-cols-2 divide-x divide-gray-200">
                                    <div className="p-4 bg-gray-50">
                                        <p className="text-sm text-gray-600 mb-1">Weekday Price</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatPrice(price.weekday_price_in_rm)}
                                        </p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Weekend Price</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatPrice(price.weekend_price_in_rm)}
                                        </p>
                                    </div>
                                </div>
                                {userRole === "admin" && conversion && eventActivated && (
                                    <div className="p-4 bg-orange-50 border-t border-orange-200">
                                        <p className="text-xs text-gray-600 mb-2">
                                            Credits (based on weekday price)
                                        </p>
                                        <div className="flex gap-3">
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Free</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.2)}
                                                </p>
                                            </div>
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Paid</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.8)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAgeBasedPricing = (priceList: Price[]) => {
        if (priceList.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Age-Based Pricing</h3>

                <div className="grid md:grid-cols-2 gap-3">
                    {priceList.map((price) => {
                        const ageGroup = ageGroups.find((ag) => ag.id === price.event_age_group_id);
                        const basePrice = getBasePrice(price);

                        return (
                            <div
                                key={price.id}
                                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
                                    <p className="font-bold text-sm text-gray-900">
                                        {ageGroup?.label || "General"}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {ageGroup ? `${ageGroup.min_age} - ${ageGroup.max_age} years` : "All ages"}
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-600 mb-1">Price</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {formatPrice(price.fixed_price_in_rm)}
                                    </p>
                                    {userRole === "admin" && conversion && eventActivated && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="flex gap-3">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 mb-1">Free</p>
                                                    <p className="font-bold text-green-600">
                                                        {Math.floor(basePrice * conversion.credits_per_rm * 0.2)}
                                                    </p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 mb-1">Paid</p>
                                                    <p className="font-bold text-blue-600">
                                                        {Math.floor(basePrice * conversion.credits_per_rm * 0.8)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderMixedPricing = (priceList: Price[]) => {
        if (priceList.length === 0) return null;

        return (
            <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Mixed Pricing</h3>

                <div className="space-y-3">
                    {priceList.map((price) => {
                        const ageGroup = ageGroups.find((ag) => ag.id === price.event_age_group_id);
                        const basePrice = getBasePrice(price);

                        return (
                            <div
                                key={price.id}
                                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
                            >
                                <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
                                    <p className="font-bold text-gray-900">
                                        {ageGroup?.label || "General"}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {ageGroup ? `${ageGroup.min_age} - ${ageGroup.max_age} years` : "All ages"}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-gray-200">
                                    <div className="p-4 bg-gray-50">
                                        <p className="text-sm text-gray-600 mb-1">Weekday Price</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatPrice(price.weekday_price_in_rm)}
                                        </p>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Weekend Price</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatPrice(price.weekend_price_in_rm)}
                                        </p>
                                    </div>
                                </div>
                                {userRole === "admin" && conversion && eventActivated && (
                                    <div className="p-4 bg-orange-50 border-t border-orange-200">
                                        <p className="text-xs text-gray-600 mb-2">
                                            Credits (based on weekday price)
                                        </p>
                                        <div className="flex gap-3">
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Free</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.2)}
                                                </p>
                                            </div>
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-gray-500 mb-1">Paid</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {Math.floor(basePrice * conversion.credits_per_rm * 0.8)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Pricing Information</h2>
                        <p className="text-sm text-gray-600">View pricing details for this event</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {renderFixedPricing(groupedPrices.fixed)}
                {renderDayTypePricing(groupedPrices.day_type)}
                {renderAgeBasedPricing(groupedPrices.age_based)}
                {renderMixedPricing(groupedPrices.mixed)}

                {userRole === "admin" && conversion && eventActivated && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                    Active Conversion Rate
                                </p>
                                <p className="text-lg font-bold text-orange-600">
                                    RM 1 = {conversion.credits_per_rm} credits
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    20% Free Credits • 80% Paid Credits
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PricingSection;
