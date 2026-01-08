import type {
    UserRole,
    AgeGroup,
    EventSlot,
    EventSlotPrice,
    Event,
} from "../../../types/events";
import { Clock, Users, Gift, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SlotCard: React.FC<{
    slot: EventSlot;
    slotPrices: EventSlotPrice[];
    ageGroups: AgeGroup[];
    userRole: UserRole;
    event: Event;
}> = ({ slot, slotPrices, ageGroups, userRole, event }) => {
    const capacityText = slot.is_unlimited ? "Unlimited" : `${slot.capacity}`;

    const getActivationModeLabel = (mode: string | null | undefined) => {
        if (!mode) return null;

        const labels: Record<string, { text: string; color: string }> = {
            keep_rm: {
                text: "Pay in RM",
                color: "bg-gray-50 text-gray-700 border-gray-200",
            },
            custom_free_credits: {
                text: "RM + Free Rewards",
                color: "bg-green-50 text-green-700 border-green-200",
            },
            convert_credits: {
                text: "Pay in Credits",
                color: "bg-blue-50 text-blue-700 border-blue-200",
            },
        };

        return labels[mode] || null;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all">
            {/* Header */}
            <div className="px-3 py-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-gray-900 text-sm">
                            {slot.start_time} - {slot.end_time}
                        </span>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-orange-50/50 text-orange-700 border-orange-200 text-xs px-2.5 py-1 font-medium"
                    >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        {capacityText}
                    </Badge>
                </div>
            </div>

            {/* Pricing Rows */}
            <div className="p-3 space-y-2">
                {slotPrices.map((sp) => {
                    const ageGroup = ageGroups.find(
                        (ag) => ag.id === sp.event_age_group_id
                    );
                    const modeInfo = getActivationModeLabel(sp.activation_mode);

                    return (
                        <div
                            key={sp.id}
                            className="p-3 bg-gray-50/50 rounded-lg border border-gray-100"
                        >
                            {/* Top Row: Age Group + Activation Mode Badge */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-700 font-medium">
                                    {ageGroup ? ageGroup.label : "All Ages"}
                                </span>
                                {userRole === "admin" &&
                                    event.status === "active" &&
                                    modeInfo && (
                                        <Badge
                                            variant="outline"
                                            className={`text-xs px-2 py-0.5 font-medium ${modeInfo.color}`}
                                        >
                                            {modeInfo.text}
                                        </Badge>
                                    )}
                            </div>

                            {/* Bottom Row: Price + Credits */}
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-base">
                                    RM {Number(sp.price_in_rm || 0).toFixed(2)}
                                </span>

                                {/* Credits Display (Admin Only) */}
                                {userRole === "admin" &&
                                    event.status === "active" && (
                                        <div className="flex items-center gap-2">
                                            {sp.free_credits != null &&
                                                sp.free_credits > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                                        <Gift className="w-3.5 h-3.5" />
                                                        <span>
                                                            {sp.free_credits}{" "}
                                                            FREE
                                                        </span>
                                                    </div>
                                                )}
                                            {sp.paid_credits != null &&
                                                sp.paid_credits > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                                                        <DollarSign className="w-3.5 h-3.5" />
                                                        <span>
                                                            {sp.paid_credits}{" "}
                                                            PAID
                                                        </span>
                                                    </div>
                                                )}
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

export default SlotCard;
