import { useState } from "react";
import type {
    Event,
    AgeGroup,
    Frequency,
    EventDate,
    EventSlot,
    UserRole,
} from "../../../types/events";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SlotCard from "./SlotCard";

const EventSchedule: React.FC<{
    event: Event;
    slots: EventSlot[];
    ageGroups: AgeGroup[];
    frequency: Frequency | null;
    dates: EventDate;
    userRole: UserRole;
}> = ({ event, slots, ageGroups, frequency, dates, userRole }) => {
    const [selectedDate, setSelectedDate] = useState<string>("");

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

    const formatDateTab = (dateString: string) => {
        const date = new Date(dateString);
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        return `${weekday}, ${month} ${day}`;
    };

    const slotsByDate: Record<string, EventSlot[]> = slots
        .filter((slot): slot is EventSlot & { date: string } => !!slot.date)
        .reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = [];
            acc[slot.date].push(slot);
            return acc;
        }, {} as Record<string, EventSlot[]>);

    const sortedDates = Object.keys(slotsByDate).sort();

    // Set initial selected date if not set
    if (!selectedDate && sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
    }

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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                        Event Schedule
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Frequency Info */}
                <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-gray-900 text-sm">
                            {event.is_recurring
                                ? getFrequencyLabel()
                                : "One-Time Event"}
                        </span>
                        {frequency?.days_of_week?.length ? (
                            <div className="text-sm text-gray-700 font-medium">
                                (
                                {frequency.days_of_week
                                    .map(
                                        (day) =>
                                            [
                                                "Sun",
                                                "Mon",
                                                "Tue",
                                                "Wed",
                                                "Thu",
                                                "Fri",
                                                "Sat",
                                            ][day]
                                    )
                                    .join(", ")}
                                )
                            </div>
                        ) : null}
                    </div>

                    {dates && (
                        <div className="text-sm text-gray-600 mt-1">
                            {dates.start_date === dates.end_date
                                ? formatDate(dates.start_date)
                                : `${formatDate(
                                      dates.start_date
                                  )} to ${formatDate(dates.end_date)}`}
                        </div>
                    )}
                </div>

                {event.is_recurring && sortedDates.length > 0 ? (
                    <>
                        {/* Date Tabs */}
                        <div className="mb-6 flex flex-wrap gap-2">
                            {sortedDates.map((date) => (
                                <Button
                                    key={date}
                                    onClick={() => setSelectedDate(date)}
                                    variant={
                                        selectedDate === date
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    className={
                                        selectedDate === date
                                            ? "bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg"
                                            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium rounded-lg"
                                    }
                                >
                                    {formatDateTab(date)}
                                </Button>
                            ))}
                        </div>

                        {/* Selected Date Slots */}
                        {selectedDate && slotsByDate[selectedDate] && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="font-semibold text-gray-900 text-base">
                                        {formatDate(selectedDate)}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className={
                                            isWeekend(selectedDate)
                                                ? "bg-orange-50/50 text-orange-700 border-orange-200 text-xs font-medium"
                                                : "bg-gray-50 text-gray-600 border-gray-200 text-xs font-medium"
                                        }
                                    >
                                        {isWeekend(selectedDate)
                                            ? "Weekend"
                                            : "Weekday"}
                                    </Badge>
                                </div>
                                <div className="grid md:grid-cols-4 gap-4">
                                    {slotsByDate[selectedDate].map((slot) => (
                                        <SlotCard
                                            key={slot.id}
                                            slot={slot}
                                            slotPrices={slot.prices ?? []}
                                            ageGroups={ageGroups}
                                            userRole={userRole}
                                            event={event}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : !event.is_recurring && slots.length > 0 ? (
                    <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wider">
                            Available Time Slots
                        </h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            {slots.map((slot) => (
                                <SlotCard
                                    key={slot.id}
                                    slot={slot}
                                    slotPrices={slot.prices ?? []}
                                    ageGroups={ageGroups}
                                    userRole={userRole}
                                    event={event}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">
                            No event slots have been created yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventSchedule;
