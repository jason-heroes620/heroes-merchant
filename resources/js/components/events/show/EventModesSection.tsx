import type {
    Event,
    AgeGroup,
    Frequency,
    EventDate,
    EventSlot,
    Booking,
    UserRole,
} from "../../../types/events";
import SlotCard from "./SlotCard";
import { Calendar } from "lucide-react";

const EventModesSection: React.FC<{
    event: Event;
    slots: EventSlot[];
    ageGroups: AgeGroup[];
    bookings: Booking[];
    frequency: Frequency | null;
    dates: EventDate[];
    userRole: UserRole;
}> = ({
    event,
    slots,
    ageGroups,
    bookings,
    frequency,
    dates,
    userRole,
}) => {
    const isWeekend = (dateString: string) => {
        const day = new Date(dateString).getDay();
        return day === 0 || day === 6;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        return `${day}/${month}/${year} (${weekday})`;
    };

    const slotsByDate: Record<string, EventSlot[]> = slots
        .filter((slot): slot is EventSlot & { date: string } => !!slot.date) 
        .reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = [];
            acc[slot.date].push(slot);
            return acc;
        }, {} as Record<string, EventSlot[]>);

    const sortedDates = Object.keys(slotsByDate).sort();

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

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 mb-6 overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Event Schedule</h2>
                        <p className="text-sm text-gray-600">Available time slots and dates</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">
                            {event.is_recurring ? getFrequencyLabel() : "One-Time Event"}
                        </span>
                    </div>

                    {dates.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {dates[0].start_date === dates[0].end_date
                                ? formatDate(dates[0].start_date)
                                : `${formatDate(dates[0].start_date)} to ${formatDate(dates[0].end_date)}`}
                        </div>
                    )}

                    {frequency?.days_of_week?.length ? (
                        <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Days:</span>{" "}
                            {frequency.days_of_week
                                .map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day])
                                .join(", ")}
                        </div>
                    ) : null}
                </div>

                {event.is_recurring ? (
                    <div className="space-y-6">
                        {sortedDates.map((date) => (
                            <div key={date} className="border-l-4 border-orange-500 pl-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <span>{formatDate(date)}</span>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                        {isWeekend(date) ? "Weekend" : "Weekday"}
                                    </span>
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {slotsByDate[date].map((slot) => (
                                        <SlotCard
                                            key={slot.id}
                                            slot={slot}
                                            slotPrices={slot.prices ?? []} 
                                            ageGroups={ageGroups}
                                            bookings={bookings}
                                            userRole={userRole}
                                            event={event}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                            Available Time Slots
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {slots.map((slot) => (
                                <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    slotPrices={slot.prices ?? []} 
                                    ageGroups={ageGroups}
                                    bookings={bookings}
                                    userRole={userRole}
                                    event={event}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {slots.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No event slots have been created yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventModesSection;