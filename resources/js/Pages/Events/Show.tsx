import React, { useState } from "react";
import type {
    UserRole,
    Event,
    EventMedia,
    AgeGroup,
    Price,
    Frequency,
    EventDate,
    EventSlot,
    EventSlotPrice,
    EventLocation,
    Booking,
    Conversion,
} from "../../types/events";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../types/index";
import EventHeader from "../../components/events/show/EventHeader";
import EventModesSection from "../../components/events/show/EventModesSection";
import BasicInfoSection from "../../components/events/show/BasicInfoSection";
import PricingSection from "../../components/events/show/PricingSection";
import BookingInfoSection from "../../components/events/show/BookingInfoSection";

interface EventDisplayData {
    event: Event;
    media: EventMedia[];
    ageGroups: AgeGroup[];
    prices: Price[];
    frequency: Frequency | null;
    dates: EventDate[];
    slots: EventSlot[];
    slotPrices: EventSlotPrice[];
    bookings: Booking[];
    conversion: Conversion | null;
    location: EventLocation;
}

const EventDisplayPage: React.FC = () => {
    const { props } = usePage<PageProps<{ eventData: EventDisplayData }>>();
    const { eventData: initialEventData } = props;
    const user = props.auth.user;
    const userRole: UserRole = user.role === "admin" ? "admin" : "merchant";

    const [eventData, setEventData] =
        useState<EventDisplayData>(initialEventData);

    const handleStatusUpdate = (newStatus: string, rejectedReason?: string) => {
        setEventData((prev) => {
            const updatedEvent = {
                ...prev.event,
                status: newStatus as Event["status"],
                rejected_reason: rejectedReason || null,
            };

            let updatedSlotPrices = prev.slotPrices;

            if (
                userRole === "admin" &&
                newStatus === "active" &&
                prev.event.status === "pending" &&
                prev.conversion
            ) {
                updatedSlotPrices = prev.slotPrices.map((sp) => {
                    if (sp.price_in_rm) {
                        const totalCredits =
                            sp.price_in_rm * prev.conversion!.credits_per_rm;
                        return {
                            ...sp,
                            free_credits: Math.floor(totalCredits * 0.2),
                            paid_credits: Math.floor(totalCredits * 0.8),
                        };
                    }
                    return sp;
                });
            }

            return {
                ...prev,
                event: updatedEvent,
                slotPrices: updatedSlotPrices,
            };
        });

        alert(`Event status updated to: ${newStatus}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <EventHeader
                    event={eventData.event}
                    userRole={userRole}
                    conversion={eventData.conversion}
                    onStatusUpdate={handleStatusUpdate}
                />

                <BasicInfoSection
                    event={eventData.event}
                    media={eventData.media}
                    ageGroups={eventData.ageGroups}
                    location={eventData.location}
                />

                <PricingSection
                    prices={eventData.prices}
                    ageGroups={eventData.ageGroups}
                    userRole={userRole}
                    conversion={eventData.conversion}
                />

                <EventModesSection
                    event={eventData.event}
                    slots={eventData.slots}
                    ageGroups={eventData.ageGroups}
                    bookings={eventData.bookings}
                    frequency={eventData.frequency}
                    dates={eventData.dates}
                    userRole={userRole}
                />

                <BookingInfoSection
                    event={eventData.event}
                    slots={eventData.slots}
                    bookings={eventData.bookings}
                />
            </div>
        </div>
    );
};

export default EventDisplayPage;
