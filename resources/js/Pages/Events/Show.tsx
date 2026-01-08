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
    ClaimConfigurationForm,
} from "../../types/events";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../types/index";
import EventHeader from "../../components/events/show/EventHeader";
import EventModesSection from "../../components/events/show/EventSchedule";
import BasicInfoSection from "../../components/events/show/BasicInfoSection";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface EventDisplayData {
    event: Event;
    media: EventMedia[];
    ageGroups: AgeGroup[];
    prices: Price[];
    frequency: Frequency;
    dates: EventDate;
    slots: EventSlot[];
    slotPrices: EventSlotPrice[];
    bookings: Booking[];
    conversion: Conversion;
    location: EventLocation;
    claim_configuration: ClaimConfigurationForm;
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

            return {
                ...prev,
                event: updatedEvent,
            };
        });

        alert(`Event status updated to: ${newStatus}`);
    };

    return (
        <AuthenticatedLayout>
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
                        frequency={eventData.frequency}
                        media={eventData.media}
                        location={eventData.location}
                        ageGroups={eventData.ageGroups}
                        prices={eventData.prices}
                        claimConfiguration={eventData.claim_configuration}
                        userRole={userRole}
                    />

                    <EventModesSection
                        event={eventData.event}
                        slots={eventData.slots}
                        ageGroups={eventData.ageGroups}
                        frequency={eventData.frequency}
                        dates={eventData.dates}
                        userRole={userRole}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default EventDisplayPage;
