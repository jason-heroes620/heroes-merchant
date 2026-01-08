import {
    Calendar,
    MapPin,
    DollarSign,
    Eye,
    Edit,
    BadgeX,
    Heart,
    Star,
    Gift,
    Coins,
} from "lucide-react";
import type {
    EventType,
    AgeGroup,
    EventSlotPrice,
} from "../../../types/events";
import { router } from "@inertiajs/react";

interface GridViewProps {
    userRole: string;
    router: typeof router;
    statusColors: Record<
        string,
        {
            bg: string;
            text: string;
            icon: React.ComponentType<{ size?: number }>;
        }
    >;
    filteredEvents: EventType[];
    handleDeactivate: (id: string) => void;
    getEventTypeLabel: (type: string) => string;
    getPriceRange: (
        slots?: EventSlotPrice[],
        userRole?: "admin" | "merchant",
        eventStatus?: string
    ) => React.ReactNode | string;
    getFrequencyLabel: (event?: any) => string;
    tab: "upcoming" | "past";
}

export default function GridView({
    userRole,
    router,
    statusColors,
    filteredEvents,
    handleDeactivate,
    getEventTypeLabel,
    getFrequencyLabel,
    tab,
}: GridViewProps) {
    const formatSlotInfo = (event: EventType) => {
        if (!event.all_slots || event.all_slots.length === 0) return null;

        const now = new Date();
        const filteredSlots = event.all_slots.filter((slot) => {
            const end = new Date(slot.display_end);
            return tab === "upcoming" ? end >= now : end < now;
        });

        if (filteredSlots.length === 0) return null;

        const slot =
            tab === "upcoming"
                ? filteredSlots[0]
                : filteredSlots[filteredSlots.length - 1];
        const start = new Date(slot.display_start);
        const end = new Date(slot.display_end);

        const startDate = start.toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        const endDate = end.toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        const capacity = slot.raw.is_unlimited
            ? "Unlimited"
            : `${slot.raw.capacity}`;

        const frequencyLabel = getFrequencyLabel(event);
        const dateRange =
            startDate === endDate ? startDate : `${startDate} – ${endDate}`;

        return `${frequencyLabel} • ${dateRange} • ${capacity}`;
    };

    const getPriceInfo = (event: EventType) => {
        const slots = event.slotPrices;
        if (!slots?.length)
            return { price: "Free", freeCredits: null, paidCredits: null };

        const prices = slots
            .map((s) => s.price_in_rm)
            .filter((v): v is number => v != null);
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const price =
            minPrice === maxPrice
                ? `RM ${minPrice.toFixed(2)}`
                : `RM ${minPrice.toFixed(2)} - RM ${maxPrice.toFixed(2)}`;

        let freeCredits = null;
        let paidCredits = null;

        if (userRole === "admin" && event.status === "active") {
            const freeList = slots
                .map((s) => s.free_credits ?? 0)
                .filter((v) => v != null);
            const minFree = freeList.length ? Math.min(...freeList) : 0;
            const maxFree = freeList.length ? Math.max(...freeList) : 0;
            freeCredits =
                minFree === maxFree ? `${minFree}` : `${minFree}-${maxFree}`;

            const paidList = slots
                .map((s) => s.paid_credits ?? 0)
                .filter((v) => v != null);
            const minPaid = paidList.length ? Math.min(...paidList) : 0;
            const maxPaid = paidList.length ? Math.max(...paidList) : 0;
            paidCredits =
                minPaid === maxPaid ? `${minPaid}` : `${minPaid}-${maxPaid}`;
        }

        return { price, freeCredits, paidCredits };
    };

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
                const statusKey = event.status as keyof typeof statusColors;
                const StatusIcon = statusColors[statusKey]?.icon;
                const statusStyle =
                    statusColors[statusKey] || statusColors.draft;
                const slotInfo = formatSlotInfo(event);
                const priceInfo = getPriceInfo(event);

                return (
                    <div
                        key={event.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
                    >
                        {/* Image */}
                        <div className="relative h-48 bg-linear-to-br from-orange-400 to-red-400">
                            {event.media?.[0] ? (
                                <img
                                    src={event.media[0].file_path}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Calendar className="h-16 w-16 text-white opacity-50" />
                                </div>
                            )}
                            {event.featured && (
                                <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                    <Star
                                        size={12}
                                        className="text-yellow-500"
                                        fill="currentColor"
                                    />
                                    FEATURED
                                </div>
                            )}
                            <div
                                className={`absolute top-3 left-3 ${statusStyle.bg} ${statusStyle.text} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5`}
                            >
                                <StatusIcon size={12} />
                                {event.status.charAt(0).toUpperCase() +
                                    event.status.slice(1)}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {/* Event Name */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                {event.title}
                            </h3>

                            {/* Merchant Name (Admin Only) */}
                            {userRole === "admin" && (
                                <div className="text-sm font-medium text-gray-500 mb-3">
                                    {event.merchant?.company_name ??
                                        "No Merchant"}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="inline-block px-3 py-1.5 bg-orange-50/50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold">
                                    {getEventTypeLabel(event.type)}
                                </span>

                                {event.category && (
                                    <span className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium">
                                        {event.category}
                                    </span>
                                )}

                                {event.is_suitable_for_all_ages ? (
                                    <span className="inline-block px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium">
                                        All Ages
                                    </span>
                                ) : event.age_groups &&
                                  event.age_groups.length > 0 ? (
                                    event.age_groups.map(
                                        (group: AgeGroup, id: number) => (
                                            <span
                                                key={id}
                                                className="inline-block px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium"
                                            >
                                                {group.label}
                                                {group.min_age != null &&
                                                    group.max_age != null &&
                                                    ` (${group.min_age}-${group.max_age})`}
                                            </span>
                                        )
                                    )
                                ) : null}
                            </div>

                            <div className="space-y-2.5 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign
                                        size={16}
                                        className="text-orange-500 shrink-0"
                                    />
                                    <span className="font-semibold text-gray-900">
                                        {priceInfo.price}
                                    </span>
                                    {userRole === "admin" &&
                                        event.status === "active" && (
                                            <div className="flex items-center gap-2 ml-auto">
                                                {priceInfo.freeCredits && (
                                                    <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                                        <Gift className="w-3.5 h-3.5" />
                                                        <span>
                                                            {
                                                                priceInfo.freeCredits
                                                            }{" "}
                                                            FREE
                                                        </span>
                                                    </div>
                                                )}
                                                {priceInfo.paidCredits && (
                                                    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                                                        <Coins className="w-3.5 h-3.5" />
                                                        <span>
                                                            {
                                                                priceInfo.paidCredits
                                                            }{" "}
                                                            PAID
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin
                                        size={16}
                                        className="text-orange-500 shrink-0"
                                    />
                                    <span className="truncate">
                                        {event.location?.location_name}
                                    </span>
                                </div>

                                {/* Frequency & Schedule */}
                                {slotInfo && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar
                                            size={16}
                                            className="text-orange-500 shrink-0"
                                        />
                                        <span className="truncate">
                                            {slotInfo}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Views and Likes */}
                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                    <Eye size={14} className="text-gray-400" />
                                    <span>{event.click_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Heart
                                        size={14}
                                        className="text-gray-400"
                                    />
                                    <span>{event.like_count || 0}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        router.visit(
                                            userRole === "admin"
                                                ? `/admin/events/${event.id}`
                                                : `/merchant/events/${event.id}`
                                        )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all font-medium text-sm"
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                {userRole === "merchant" && (
                                    <>
                                        <button
                                            onClick={() =>
                                                router.visit(
                                                    `/merchant/events/${event.id}/edit`
                                                )
                                            }
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm"
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        {event.status === "active" && (
                                            <button
                                                onClick={() =>
                                                    handleDeactivate(event.id)
                                                }
                                                className="px-4 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                                                title="Deactivate"
                                            >
                                                <BadgeX size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
