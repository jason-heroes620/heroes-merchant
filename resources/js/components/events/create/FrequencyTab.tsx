import { useState } from "react";
import {
    Calendar,
    Plus,
    Trash2,
    Clock,
    AlertCircle,
    Check,
    X,
    Infinity,
} from "lucide-react";
import type { Frequency, EventDate, EventSlot } from "../../../types/events";

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
    const [customDateInput, setCustomDateInput] = useState<{
        index: number | null;
        value: string;
    }>({ index: null, value: "" });

    const [singleDayMode, setSingleDayMode] = useState<Record<number, boolean>>(
        {}
    );

    const daysOfWeek = [
        { value: 0, label: "Sun" },
        { value: 1, label: "Mon" },
        { value: 2, label: "Tue" },
        { value: 3, label: "Wed" },
        { value: 4, label: "Thu" },
        { value: 5, label: "Fri" },
        { value: 6, label: "Sat" },
    ];

    const toggleDayOfWeek = (freqIndex: number, day: number) => {
        const freq = frequencies[freqIndex];
        const current = freq.days_of_week || [];
        const updated = current.includes(day)
            ? current.filter((d: number) => d !== day)
            : [...current, day].sort();
        updateFrequency(freqIndex, "days_of_week", updated);
    };

    const handleAddCustomDate = (index: number) => {
        if (customDateInput.value) {
            const freq = frequencies[index];
            const currentDates = freq.selected_dates || [];

            if (!currentDates.includes(customDateInput.value)) {
                const newDates = [
                    ...currentDates,
                    customDateInput.value,
                ].sort();
                updateFrequency(index, "selected_dates", newDates);
            }

            setCustomDateInput({ index: null, value: "" });
        }
    };

    const removeCustomDate = (freqIndex: number, dateToRemove: string) => {
        const freq = frequencies[freqIndex];
        const updated = (freq.selected_dates || []).filter(
            (d: string) => d !== dateToRemove
        );
        updateFrequency(freqIndex, "selected_dates", updated);
    };

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

    const firstEventDate = getEventDate(0);

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 space-y-6">
                {/* Recurring Toggle */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 border-2 border-orange-200 rounded-xl shadow-sm">
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
                            <div className="w-16 h-9 bg-gray-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600 transition-all shadow-inner"></div>
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
                    <section className="border-2 border-orange-300 rounded-xl p-8 space-y-6 shadow-md">
                        <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-200">
                            <div className="p-3 bg-orange-500 rounded-lg">
                                <Calendar size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    One-Time Event Schedule
                                </h3>
                                <p className="text-sm text-gray-700">
                                    Set the date and time slots for your event
                                </p>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                        <Calendar
                                            size={18}
                                            className="text-orange-600"
                                        />
                                        Event Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={firstEventDate.start_date}
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        onChange={(e) =>
                                            handleStartDateChange(
                                                0,
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                    />
                                    {errors?.["event_dates.0.start_date"] && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                                            <AlertCircle size={14} />
                                            {errors["event_dates.0.start_date"]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                        <Calendar
                                            size={18}
                                            className="text-orange-600"
                                        />
                                        Event End Date *
                                    </label>

                                    <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={singleDayMode[0] || false}
                                            onChange={(e) =>
                                                toggleSingleDayMode(
                                                    0,
                                                    e.target.checked
                                                )
                                            }
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            Single day event (same as start
                                            date)
                                        </span>
                                    </label>

                                    <input
                                        type="date"
                                        value={firstEventDate.end_date}
                                        min={
                                            firstEventDate.start_date ||
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        onChange={(e) =>
                                            updateEventDate(
                                                0,
                                                "end_date",
                                                e.target.value
                                            )
                                        }
                                        disabled={singleDayMode[0]}
                                        className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {errors?.["event_dates.0.end_date"] && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                                            <AlertCircle size={14} />
                                            {errors["event_dates.0.end_date"]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Time Slots Section */}
                        <div className="border-t-2 border-orange-200 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">
                                        Time Slots
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Add multiple time slots for this event
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addSlot(0)}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
                                >
                                    <Plus size={18} /> Add Slot
                                </button>
                            </div>

                            {getSlots(0).length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                                    <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                    <p className="text-gray-600 font-medium mb-2">
                                        No time slots defined
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Add at least one time slot for your
                                        event
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => addSlot(0)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
                                    >
                                        <Plus size={18} /> Add First Slot
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {getSlots(0).map((slot, slotIndex) => (
                                        <div
                                            key={slotIndex}
                                            className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                    {slotIndex + 1}
                                                </div>
                                                <h5 className="font-bold text-gray-800">
                                                    Slot {slotIndex + 1}
                                                </h5>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeSlot(0, slotIndex)
                                                    }
                                                    className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                        Start Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={slot.start_time}
                                                        onChange={(e) =>
                                                            updateSlot(
                                                                0,
                                                                slotIndex,
                                                                "start_time",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 text-base border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                        End Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={slot.end_time}
                                                        onChange={(e) =>
                                                            updateSlot(
                                                                0,
                                                                slotIndex,
                                                                "end_time",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 text-base border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                    />
                                                    {slot.start_time &&
                                                        slot.end_time && (
                                                            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                                                                <Clock
                                                                    size={12}
                                                                />
                                                                Duration:{" "}
                                                                {calculateDuration(
                                                                    slot.start_time,
                                                                    slot.end_time
                                                                )}
                                                            </p>
                                                        )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                    Capacity
                                                </label>

                                                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            slot.is_unlimited
                                                        }
                                                        onChange={(e) => {
                                                            updateSlot(
                                                                0,
                                                                slotIndex,
                                                                "is_unlimited",
                                                                e.target.checked
                                                            );
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                updateSlot(
                                                                    0,
                                                                    slotIndex,
                                                                    "is_unlimited",
                                                                    true
                                                                );
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                    />
                                                    <span className="text-sm text-gray-700 flex items-center gap-1">
                                                        <Infinity
                                                            size={16}
                                                            className="text-orange-500"
                                                        />
                                                        Unlimited
                                                    </span>
                                                </label>

                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={slot.capacity ?? ""}
                                                    onChange={(e) =>
                                                        updateSlot(
                                                            0,
                                                            slotIndex,
                                                            "capacity",
                                                            e.target.value ===
                                                                ""
                                                                ? null
                                                                : Number(
                                                                      e.target
                                                                          .value
                                                                  )
                                                        )
                                                    }
                                                    disabled={slot.is_unlimited}
                                                    placeholder="e.g., 30"
                                                    className="w-full px-4 py-3 text-base border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* RECURRING EVENTS */}
                {data.is_recurring && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                    <Calendar
                                        size={24}
                                        className="text-orange-600"
                                    />
                                    Recurring Schedules
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Configure recurring patterns with time slots
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addFrequency}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-bold transform hover:scale-105"
                            >
                                <Plus size={20} /> Add Schedule
                            </button>
                        </div>

                        {frequencies.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                                <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                                <p className="text-gray-600 font-bold text-lg mb-2">
                                    No recurring schedules defined
                                </p>
                                <button
                                    type="button"
                                    onClick={addFrequency}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold"
                                >
                                    <Plus size={18} />
                                    Get Started
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {frequencies.map((freq, index) => {
                                    const eventDate = getEventDate(index);
                                    return (
                                        <div
                                            key={index}
                                            className="p-8 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:border-orange-300 hover:shadow-xl transition-all"
                                        >
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-orange-100 rounded-lg">
                                                            <Calendar
                                                                size={20}
                                                                className="text-orange-600"
                                                            />
                                                        </div>
                                                        <h4 className="font-bold text-xl text-gray-800">
                                                            Schedule {index + 1}
                                                        </h4>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFrequency(
                                                                index
                                                            )
                                                        }
                                                        className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-all font-medium"
                                                    >
                                                        <Trash2 size={18} />
                                                        Remove
                                                    </button>
                                                </div>

                                                {/* Recurrence Type */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                        Recurrence Pattern *
                                                    </label>
                                                    <select
                                                        value={
                                                            freq.type ||
                                                            "weekly"
                                                        }
                                                        onChange={(e) =>
                                                            updateFrequency(
                                                                index,
                                                                "type",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-5 py-4 text-base font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
                                                    >
                                                        <option value="daily">
                                                            Every Day
                                                        </option>
                                                        <option value="weekly">
                                                            Every Week
                                                        </option>
                                                        <option value="biweekly">
                                                            Every 2 Weeks
                                                        </option>
                                                        <option value="monthly">
                                                            Every Month
                                                        </option>
                                                        <option value="annually">
                                                            Every Year
                                                        </option>
                                                        <option value="custom">
                                                            Custom Dates
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Days of Week */}
                                                {(freq.type === "weekly" ||
                                                    freq.type ===
                                                        "biweekly") && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                            Days of Week *
                                                        </label>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {daysOfWeek.map(
                                                                (day) => {
                                                                    const isSelected =
                                                                        (
                                                                            freq.days_of_week ||
                                                                            []
                                                                        ).includes(
                                                                            day.value
                                                                        );
                                                                    return (
                                                                        <button
                                                                            key={
                                                                                day.value
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                toggleDayOfWeek(
                                                                                    index,
                                                                                    day.value
                                                                                )
                                                                            }
                                                                            className={`px-6 py-3 rounded-lg font-bold transition-all ${
                                                                                isSelected
                                                                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                day.label
                                                                            }
                                                                        </button>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Date Range */}
                                                {freq.type !== "custom" && (
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                Start Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={
                                                                    eventDate?.start_date ||
                                                                    ""
                                                                }
                                                                min={
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            "T"
                                                                        )[0]
                                                                }
                                                                onChange={(e) =>
                                                                    handleStartDateChange(
                                                                        index,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                End Date *
                                                            </label>

                                                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        singleDayMode[
                                                                            index
                                                                        ] ||
                                                                        false
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        toggleSingleDayMode(
                                                                            index,
                                                                            e
                                                                                .target
                                                                                .checked
                                                                        )
                                                                    }
                                                                    className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                                />
                                                                <span className="text-xs text-gray-600">
                                                                    Same as
                                                                    start date
                                                                </span>
                                                            </label>

                                                            <input
                                                                type="date"
                                                                value={
                                                                    eventDate?.end_date ||
                                                                    ""
                                                                }
                                                                min={
                                                                    eventDate?.start_date ||
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            "T"
                                                                        )[0]
                                                                }
                                                                onChange={(e) =>
                                                                    updateEventDate(
                                                                        index,
                                                                        "end_date",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={
                                                                    singleDayMode[
                                                                        index
                                                                    ]
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Time Slots for Recurring */}
                                                <div className="border-t-2 border-gray-200 pt-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h5 className="text-base font-bold text-gray-800">
                                                                Time Slots
                                                            </h5>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                These slots will
                                                                apply to each
                                                                occurrence
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                addSlot(index)
                                                            }
                                                            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                                                        >
                                                            <Plus size={16} />{" "}
                                                            Add Slot
                                                        </button>
                                                    </div>

                                                    {getSlots(index).length ===
                                                    0 ? (
                                                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                                                            <Clock className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                                            <p className="text-gray-600 text-sm font-medium mb-2">
                                                                No time slots
                                                                defined
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addSlot(
                                                                        index
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                                                            >
                                                                <Plus
                                                                    size={16}
                                                                />{" "}
                                                                Add Slot
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {getSlots(
                                                                index
                                                            ).map(
                                                                (
                                                                    slot,
                                                                    slotIndex
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            slotIndex
                                                                        }
                                                                        className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg"
                                                                    >
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <div className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                                                                {slotIndex +
                                                                                    1}
                                                                            </div>
                                                                            <h6 className="font-bold text-gray-800 text-sm">
                                                                                Slot{" "}
                                                                                {slotIndex +
                                                                                    1}
                                                                            </h6>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    removeSlot(
                                                                                        index,
                                                                                        slotIndex
                                                                                    )
                                                                                }
                                                                                className="ml-auto p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                            >
                                                                                <Trash2
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </div>

                                                                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                                                                            <div>
                                                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                                    Start
                                                                                    Time
                                                                                    *
                                                                                </label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={
                                                                                        slot.start_time
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        updateSlot(
                                                                                            index,
                                                                                            slotIndex,
                                                                                            "start_time",
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-3 py-2 text-sm border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                                                />
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                                    End
                                                                                    Time
                                                                                    *
                                                                                </label>
                                                                                <input
                                                                                    type="time"
                                                                                    value={
                                                                                        slot.end_time
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) =>
                                                                                        updateSlot(
                                                                                            index,
                                                                                            slotIndex,
                                                                                            "end_time",
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        )
                                                                                    }
                                                                                    className="w-full px-3 py-2 text-sm border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                                                />
                                                                                {slot.start_time &&
                                                                                    slot.end_time && (
                                                                                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                                                                            <Clock
                                                                                                size={
                                                                                                    10
                                                                                                }
                                                                                            />
                                                                                            {calculateDuration(
                                                                                                slot.start_time,
                                                                                                slot.end_time
                                                                                            )}
                                                                                        </p>
                                                                                    )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                                                Capacity
                                                                            </label>

                                                                            <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={
                                                                                        slot.is_unlimited
                                                                                    }
                                                                                    onChange={(
                                                                                        e
                                                                                    ) => {
                                                                                        updateSlot(
                                                                                            index,
                                                                                            slotIndex,
                                                                                            "is_unlimited",
                                                                                            e
                                                                                                .target
                                                                                                .checked
                                                                                        );
                                                                                        if (
                                                                                            e
                                                                                                .target
                                                                                                .checked
                                                                                        ) {
                                                                                            updateSlot(
                                                                                                index,
                                                                                                slotIndex,
                                                                                                "is_unlimited",
                                                                                                true
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                                                />
                                                                                <span className="text-xs text-gray-700 flex items-center gap-1">
                                                                                    <Infinity
                                                                                        size={
                                                                                            14
                                                                                        }
                                                                                        className="text-orange-500"
                                                                                    />
                                                                                    Unlimited
                                                                                </span>
                                                                            </label>

                                                                            <input
                                                                                type="number"
                                                                                min={
                                                                                    0
                                                                                }
                                                                                value={
                                                                                    slot.capacity ??
                                                                                    ""
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    updateSlot(
                                                                                        index,
                                                                                        slotIndex,
                                                                                        "capacity",
                                                                                        e
                                                                                            .target
                                                                                            .value ===
                                                                                            ""
                                                                                            ? null
                                                                                            : Number(
                                                                                                  e
                                                                                                      .target
                                                                                                      .value
                                                                                              )
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    slot.is_unlimited
                                                                                }
                                                                                placeholder="e.g., 30"
                                                                                className="w-full px-3 py-2 text-sm border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Custom Dates */}
                                                {freq.type === "custom" && (
                                                    <div className="p-6 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50">
                                                        <label className="block text-sm font-bold text-orange-800 mb-3">
                                                            Custom Dates
                                                        </label>
                                                        <div className="flex gap-2 mb-4">
                                                            <input
                                                                type="date"
                                                                min={
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            "T"
                                                                        )[0]
                                                                }
                                                                value={
                                                                    customDateInput.index ===
                                                                    index
                                                                        ? customDateInput.value
                                                                        : ""
                                                                }
                                                                onChange={(e) =>
                                                                    setCustomDateInput(
                                                                        {
                                                                            index,
                                                                            value: e
                                                                                .target
                                                                                .value,
                                                                        }
                                                                    )
                                                                }
                                                                className="flex-1 px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleAddCustomDate(
                                                                        index
                                                                    )
                                                                }
                                                                disabled={
                                                                    !customDateInput.value ||
                                                                    customDateInput.index !==
                                                                        index
                                                                }
                                                                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                            >
                                                                <Plus
                                                                    size={18}
                                                                />
                                                                Add
                                                            </button>
                                                        </div>

                                                        {freq.selected_dates &&
                                                            freq.selected_dates
                                                                .length > 0 && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
                                                                        Selected
                                                                        Dates (
                                                                        {
                                                                            freq
                                                                                .selected_dates
                                                                                .length
                                                                        }
                                                                        )
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {freq.selected_dates.map(
                                                                            (
                                                                                date: string,
                                                                                i: number
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-xs font-semibold text-gray-700 rounded-lg border border-orange-200 shadow-sm"
                                                                                >
                                                                                    <span>
                                                                                        {new Date(
                                                                                            date
                                                                                        ).toLocaleDateString(
                                                                                            "en-MY",
                                                                                            {
                                                                                                day: "2-digit",
                                                                                                month: "short",
                                                                                                year: "numeric",
                                                                                            }
                                                                                        )}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            removeCustomDate(
                                                                                                index,
                                                                                                date
                                                                                            )
                                                                                        }
                                                                                        className="text-red-600 hover:text-red-700 transition-colors"
                                                                                    >
                                                                                        <X
                                                                                            size={
                                                                                                14
                                                                                            }
                                                                                        />
                                                                                    </button>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
