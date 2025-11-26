import type {
    UserRole,
    AgeGroup,
    EventSlot,
    EventSlotPrice,
    Booking,
    Event,
} from "../../../types/events";
import { Clock, Users } from "lucide-react";

const SlotCard: React.FC<{
    slot: EventSlot;
    slotPrices: EventSlotPrice[];
    ageGroups: AgeGroup[];
    bookings: Booking[];
    userRole: UserRole;
    event: Event;
}> = ({ slot, slotPrices, ageGroups, bookings, userRole, event }) => {
    const slotBookings = bookings.filter(
        (b) => b.slot_id === slot.id && b.status === "confirmed"
    );

    const totalBooked = slotBookings.reduce((sum, b) => sum + b.quantity, 0);

    const capacityText = slot.is_unlimited
        ? "Unlimited"
        : `${totalBooked} / ${slot.capacity}`;

    return (
        <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all">
            <div className="flex gap-10 mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-gray-900">
                        {slot.start_time} - {slot.end_time}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-gray-700 font-medium">
                        {capacityText}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {slotPrices.map((sp) => {
                    const ageGroup = ageGroups.find(
                        (ag) => ag.id === sp.event_age_group_id
                    );
                    return (
                        <div
                            key={sp.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <span className="text-sm text-gray-800 font-medium">
                                {ageGroup ? ageGroup.label : "PRICING"}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">
                                    RM {Number(sp.price_in_rm)?.toFixed(2)}
                                </span>
                                {userRole === "admin" && event.status === "active" && (
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-green-600 font-bold">
                                            {sp.free_credits} FREE
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-blue-600 font-bold">
                                            {sp.paid_credits} PAID
                                        </span>
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
