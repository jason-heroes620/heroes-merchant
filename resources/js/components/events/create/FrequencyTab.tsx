import { useState } from "react";
import { Check } from "lucide-react";
import type { Frequency, EventDate, EventSlot } from "../../../types/events";
import OneTimeEvent from "./OneTimeEvent";
import RecurringEvent from "./RecurringEvent";

interface FrequencyTabProps {
    data: any;
    setData: (k: string, v: any) => void;
    errors: Record<string, any>;
    frequencies: Frequency[];
    addFrequency: () => void;
    removeFrequency: (index: number) => void;
    updateFrequency: (index: number, field: string, value: any) => void;
    eventDates: EventDate[];
    updateEventDate: (index: number, field: string, value: any) => void;
    addSlot: (dateIndex: number) => void;
    removeSlot: (dateIndex: number, slotIndex: number) => void;
    updateSlot: (
        dateIndex: number,
        slotIndex: number,
        field: keyof EventSlot,
        value: any
    ) => void;
    getSlots: (dateIndex: number) => EventSlot[];
}

export default function FrequencyTab({
    data,
    setData,
    errors,
    frequencies,
    addFrequency,
    removeFrequency,
    updateFrequency,
    eventDates,
    updateEventDate,
    addSlot,
    removeSlot,
    updateSlot,
    getSlots,
}: FrequencyTabProps) {
    const [singleDayMode, setSingleDayMode] = useState<Record<number, boolean>>(
        {}
    );

    const calculateDuration = (startTime: string, endTime: string): string => {
        if (!startTime || !endTime) return "";

        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        let hours = endHour - startHour;
        let minutes = endMin - startMin;

        if (minutes < 0) {
            hours -= 1;
            minutes += 60;
        }

        if (hours < 0) hours += 24;

        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hr${hours !== 1 ? "s" : ""}`;
        return `${hours} hr${hours !== 1 ? "s" : ""} ${minutes} min`;
    };

    const getEventDate = (index: number): EventDate => {
        if (!eventDates || eventDates.length <= index) {
            return {
                start_date: "",
                end_date: "",
                slots: [],
            };
        }
        return eventDates[index];
    };

    const toggleSingleDayMode = (index: number, checked: boolean) => {
        setSingleDayMode({ ...singleDayMode, [index]: checked });

        if (checked) {
            const eventDate = getEventDate(index);
            if (eventDate.start_date) {
                updateEventDate(index, "end_date", eventDate.start_date);
            }
        }
    };

    const handleStartDateChange = (index: number, value: string) => {
        updateEventDate(index, "start_date", value);

        // If in single day mode, sync end_date
        if (singleDayMode[index]) {
            updateEventDate(index, "end_date", value);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 space-y-6">
                {/* Recurring Toggle */}
                <div className="flex items-center gap-4 p-6 bg-linear-to-r from-orange-50 via-orange-100 to-orange-50 border-2 border-orange-200 rounded-xl shadow-sm">
                    <label className="flex items-center gap-4 cursor-pointer flex-1">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={data.is_recurring ?? false}
                                onChange={(e) =>
                                    setData("is_recurring", e.target.checked)
                                }
                                className="sr-only peer"
                            />
                            <div className="w-16 h-9 bg-gray-300 rounded-full peer-checked:bg-linear-to-r peer-checked:from-orange-500 peer-checked:to-orange-600 transition-all shadow-inner"></div>
                            <div className="absolute left-1 top-1 w-7 h-7 bg-white rounded-full transition-all peer-checked:translate-x-7 shadow-md flex items-center justify-center">
                                {data.is_recurring && (
                                    <Check
                                        size={14}
                                        className="text-orange-600"
                                    />
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-gray-800 text-xl">
                                Recurring Event
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                                Enable to set up multiple sessions or recurring
                                schedules
                            </p>
                        </div>
                    </label>
                </div>

                {/* ONE-TIME EVENT */}
                {!data.is_recurring && (
                    <OneTimeEvent
                        getEventDate={getEventDate}
                        updateEventDate={updateEventDate}
                        addSlot={addSlot}
                        removeSlot={removeSlot}
                        updateSlot={updateSlot}
                        getSlots={getSlots}
                        errors={errors}
                        calculateDuration={calculateDuration}
                        toggleSingleDayMode={toggleSingleDayMode}
                        handleStartDateChange={handleStartDateChange}
                        singleDayMode={singleDayMode}
                    />
                )}

                {/* RECURRING EVENTS */}
                {data.is_recurring && (
                    <RecurringEvent
                        getEventDate={getEventDate}
                        updateEventDate={updateEventDate}
                        addSlot={addSlot}
                        removeSlot={removeSlot}
                        updateSlot={updateSlot}
                        getSlots={getSlots}
                        errors={errors}
                        calculateDuration={calculateDuration}
                        toggleSingleDayMode={toggleSingleDayMode}
                        handleStartDateChange={handleStartDateChange}
                        singleDayMode={singleDayMode}
                        frequencies={frequencies}
                        addFrequency={addFrequency}
                        removeFrequency={removeFrequency}
                        updateFrequency={updateFrequency}
                    />
                )}
            </div>
        </div>
    );
}
