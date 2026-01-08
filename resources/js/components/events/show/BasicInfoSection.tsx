import React, { useState } from "react";
import {
    MapPin,
    Video,
    ChevronLeft,
    ChevronRight,
    X,
    Tag,
    Layers,
    Calendar,
    ExternalLink,
    DollarSign,
    Users,
    Ticket,
    Clock,
    TrendingUp,
    FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
    Event,
    EventMedia,
    EventLocation,
    Frequency,
    AgeGroup,
    Price,
    ClaimConfigurationForm,
} from "../../../types/events";

interface BasicInfoSectionProps {
    event: Event;
    media: EventMedia[];
    location: EventLocation;
    frequency: Frequency | null;
    ageGroups?: AgeGroup[];
    prices?: Price[];
    claimConfiguration?: ClaimConfigurationForm;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
    event,
    media,
    location,
    frequency,
    ageGroups = [],
    prices = [],
    claimConfiguration,
}) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const visibleMedia = media.slice(carouselIndex, carouselIndex + 3);

    const openLightbox = (index: number) => {
        setLightboxIndex(carouselIndex + index);
        setLightboxOpen(true);
    };

    const nextCarousel = () => {
        if (carouselIndex + 3 < media.length) {
            setCarouselIndex(carouselIndex + 3);
        } else {
            setCarouselIndex(0);
        }
    };

    const prevCarousel = () => {
        if (carouselIndex - 3 >= 0) {
            setCarouselIndex(carouselIndex - 3);
        } else {
            setCarouselIndex(Math.max(0, media.length - 3));
        }
    };

    const nextLightbox = () => {
        setLightboxIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    };

    const prevLightbox = () => {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    };

    const formatPrice = (value: number | null | undefined) => {
        const num = Number(value);
        if (isNaN(num)) return "N/A";
        return `RM ${num.toFixed(2)}`;
    };

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            workshop: "Event / Workshop",
            trial: "Trial Class",
            pass: "Ticket / Pass",
        };
        return labels[type] || type;
    };

    const getFrequencyLabel = () => {
        if (!frequency) return "One-Time Event";
        const labels: Record<string, string> = {
            daily: "Daily",
            weekly: "Weekly",
            biweekly: "Bi-weekly",
            monthly: "Monthly",
            annually: "Annually",
            custom: "Custom Dates",
        };
        return labels[frequency.type] || frequency.type;
    };

    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        window.open(url, "_blank");
    };

    const groupPricesByType = () => {
        const grouped: Record<string, Price[]> = {
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

    const groupedPrices = groupPricesByType();

    const PricePill = ({
        label,
        value,
        highlight = false,
        className = "",
        bare = false,
    }: {
        label: string;
        value: string;
        highlight?: boolean;
        className?: string;
        bare?: boolean;
    }) => (
        <div
            className={`
            flex items-center justify-between px-4 py-2
            ${bare ? "" : "rounded-lg border"}
            ${
                highlight
                    ? "bg-orange-50 border-orange-200"
                    : "bg-gray-50 border-gray-200"
            }
            ${className}
        `}
        >
            <span className="text-sm text-gray-600">{label}</span>
            <span
                className={`text-base font-bold ${
                    highlight ? "text-orange-600" : "text-gray-900"
                }`}
            >
                {value}
            </span>
        </div>
    );

    return (
        <>
            {/* Media Gallery - Full Width */}
            {media && media.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 mb-6">
                    <div className="p-6">
                        <div className="relative">
                            <div className="grid grid-cols-3 gap-4">
                                {visibleMedia.map((m, idx) => (
                                    <div
                                        key={m.id}
                                        onClick={() => openLightbox(idx)}
                                        className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:border-orange-400 transition-all group"
                                    >
                                        {m.file_type?.startsWith("image/") ? (
                                            <>
                                                <img
                                                    src={m.file_path}
                                                    alt="Event media"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <Video className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {media.length > 3 && (
                                <>
                                    <Button
                                        onClick={prevCarousel}
                                        disabled={carouselIndex === 0}
                                        size="icon"
                                        variant="secondary"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full shadow-lg disabled:opacity-40"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={nextCarousel}
                                        disabled={
                                            carouselIndex + 3 >= media.length
                                        }
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full shadow-lg disabled:opacity-40"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </>
                            )}
                        </div>

                        {media.length > 3 && (
                            <div className="flex justify-center gap-1.5 mt-5">
                                {Array.from({
                                    length: Math.ceil(media.length / 3),
                                }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() =>
                                            setCarouselIndex(idx * 3)
                                        }
                                        className={`h-1.5 rounded-full transition-all ${
                                            Math.floor(carouselIndex / 3) ===
                                            idx
                                                ? "w-6 bg-orange-500"
                                                : "w-1.5 bg-gray-300 hover:bg-orange-300"
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium mb-1">
                            Event Type
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate uppercase">
                            {getEventTypeLabel(event.type)}
                        </p>
                    </div>
                </div>

                <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium mb-1">
                            Category
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate uppercase">
                            {event.category || "N/A"}
                        </p>
                    </div>
                </div>

                <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium mb-1">
                            Frequency
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate uppercase">
                            {event.is_recurring
                                ? getFrequencyLabel()
                                : "One-Time Event"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-6 mb-6">
                <div className="col-span-3 space-y-6">
                    {/* Description */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-base font-semibold text-gray-900">
                                    Description
                                </div>
                            </div>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {event.description || "No description provided"}
                            </p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-base font-semibold text-gray-900">
                                    Location
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Location + Action */}
                            <div className="w-full inline-flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/50 overflow-hidden">
                                <div className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-900">
                                        {location?.location_name}
                                    </p>
                                </div>

                                <Button
                                    onClick={openGoogleMaps}
                                    size="sm"
                                    variant="ghost"
                                    className="rounded-none border-l border-gray-200 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center gap-2 px-4 transition-colors"
                                >
                                    Open Map
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Directions */}
                            {location?.how_to_get_there && (
                                <div className="rounded-xl border border-orange-200 bg-gray-50/50 p-4">
                                    <p className="text-xs font-semibold text-orange-500 mb-2 uppercase tracking-wider">
                                        How to get there
                                    </p>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                        {location.how_to_get_there}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 space-y-6">
                    {/* Age Groups */}
                    {ageGroups && ageGroups.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">
                                        Age Groups
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                {event.is_suitable_for_all_ages ? (
                                    <Badge
                                        variant="outline"
                                        className="px-4 py-2 bg-orange-50/50 text-orange-700 border-orange-200 font-medium text-sm"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        All Ages Welcome
                                    </Badge>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {ageGroups.map((ag) => (
                                            <Badge
                                                key={ag.id}
                                                variant="outline"
                                                className="px-4 py-2 bg-orange-50/50 text-orange-700 border-orange-200 font-medium text-sm"
                                            >
                                                {ag.label} ({ag.min_age}-
                                                {ag.max_age})
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pricing */}
                    {prices && prices.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                        <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">
                                        Pricing Information
                                    </div>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="space-y-3">
                                    {groupedPrices.age_based &&
                                        groupedPrices.age_based.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {groupedPrices.age_based.map(
                                                    (price) => {
                                                        const ageGroup =
                                                            ageGroups?.find(
                                                                (ag) =>
                                                                    ag.id ===
                                                                    price.event_age_group_id
                                                            );

                                                        return (
                                                            <PricePill
                                                                key={price.id}
                                                                label={
                                                                    ageGroup?.label ||
                                                                    "All Ages"
                                                                }
                                                                value={formatPrice(
                                                                    price.fixed_price_in_rm
                                                                )}
                                                                highlight
                                                            />
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}

                                    {groupedPrices.fixed?.map((price) => (
                                        <PricePill
                                            key={price.id}
                                            label="Standard Price"
                                            value={formatPrice(
                                                price.fixed_price_in_rm
                                            )}
                                            highlight
                                        />
                                    ))}

                                    {groupedPrices.day_type?.map((price) => (
                                        <div
                                            key={price.id}
                                            className="flex items-stretch rounded-xl border border-gray-200 bg-gray-50/50 divide-x divide-gray-200 overflow-hidden"
                                        >
                                            {/* Weekday */}
                                            <PricePill
                                                label="Weekday"
                                                value={formatPrice(
                                                    price.weekday_price_in_rm
                                                )}
                                                className="flex-1"
                                                bare
                                            />

                                            {/* Weekend */}
                                            <PricePill
                                                label="Weekend"
                                                value={formatPrice(
                                                    price.weekend_price_in_rm
                                                )}
                                                highlight
                                                className="flex-1"
                                                bare
                                            />
                                        </div>
                                    ))}

                                    {groupedPrices.mixed?.map((price) => {
                                        const ageGroup = ageGroups?.find(
                                            (ag) =>
                                                ag.id ===
                                                price.event_age_group_id
                                        );

                                        return (
                                            <div
                                                key={price.id}
                                                className="flex items-stretch rounded-xl border border-gray-200 divide-x divide-gray-200 overflow-hidden"
                                            >
                                                {/* Age Group */}
                                                <div className="px-4 py-2 flex items-center bg-gray-700">
                                                    <span className="text-sm font-bold uppercase text-white whitespace-nowrap">
                                                        {ageGroup?.label ||
                                                            "All Ages"}
                                                    </span>
                                                </div>

                                                {/* Weekday */}
                                                <PricePill
                                                    label="Weekday"
                                                    value={formatPrice(
                                                        price.weekday_price_in_rm
                                                    )}
                                                    className="flex-1"
                                                    bare
                                                />

                                                {/* Weekend */}
                                                <PricePill
                                                    label="Weekend"
                                                    value={formatPrice(
                                                        price.weekend_price_in_rm
                                                    )}
                                                    highlight
                                                    className="flex-1"
                                                    bare
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Claim Configuration */}
                    {claimConfiguration && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                        <Ticket className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">
                                        Claim Configuration
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex divide-x divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
                                    {/* Total Redemption */}
                                    <div className="flex-1 px-4 py-4 flex items-center gap-4 bg-gray-50/50">
                                        <TrendingUp className="w-6 h-6 text-orange-600 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                Total Redemption
                                            </span>
                                            {claimConfiguration.total_redemption_type ===
                                            "unlimited" ? (
                                                <span className="text-xl font-bold text-gray-900 ml-4">
                                                    Unlimited
                                                </span>
                                            ) : (
                                                <span className="text-xl font-bold text-gray-900 ml-4">
                                                    {claimConfiguration.total_redemption_limit?.toLocaleString()}
                                                    <span className="ml-1.5 text-xs text-gray-500 font-normal">
                                                        per customer
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Daily Redemption */}
                                    <div className="flex-1 px-4 py-4 flex items-center gap-4 bg-gray-50/50">
                                        <Clock className="w-6 h-6 text-orange-600 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                Daily Redemption
                                            </span>
                                            {claimConfiguration.daily_redemption_type ===
                                            "once" ? (
                                                <span className="text-xl font-bold text-gray-900 ml-4">
                                                    1
                                                    <span className="ml-1.5 text-xs text-gray-500 font-normal">
                                                        claim per day
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-xl font-bold text-gray-900 ml-4">
                                                    {claimConfiguration.daily_redemption_limit?.toLocaleString()}
                                                    <span className="ml-1.5 text-xs text-gray-500 font-normal">
                                                        claims per day
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <Button
                        onClick={() => setLightboxOpen(false)}
                        size="icon"
                        variant="secondary"
                        className="absolute top-4 right-4 w-10 h-10 rounded-full z-10"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevLightbox();
                        }}
                        size="icon"
                        variant="secondary"
                        className="absolute left-4 w-10 h-10 rounded-full z-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div
                        className="max-w-6xl max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {media[lightboxIndex]?.file_type?.startsWith(
                            "image/"
                        ) ? (
                            <img
                                src={media[lightboxIndex]?.file_path}
                                alt="Event media"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            />
                        ) : (
                            <div className="w-96 h-96 flex items-center justify-center bg-gray-800 rounded-lg">
                                <Video className="w-12 h-12 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextLightbox();
                        }}
                        size="icon"
                        variant="secondary"
                        className="absolute right-4 w-10 h-10 rounded-full z-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        {lightboxIndex + 1} / {media.length}
                    </div>
                </div>
            )}
        </>
    );
};

export default BasicInfoSection;
