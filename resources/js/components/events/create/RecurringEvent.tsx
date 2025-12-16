import { useState } from "react";
import { Calendar, Plus, Trash2, Clock, X, Infinity } from "lucide-react";
import type { Frequency, EventSlot } from "../../../types/events";

export default function RecurringEvent({
    addFrequency,
    frequencies,
    removeFrequency,
    updateFrequency,
    getEventDate,
    handleStartDateChange,
    toggleSingleDayMode,
    singleDayMode,
    addSlot,
    removeSlot,
    updateSlot,
    getSlots,
    calculateDuration,
    updateEventDate,
}: any) {
    const daysOfWeek = [
        { value: 0, label: "Sun" },
        { value: 1, label: "Mon" },
        { value: 2, label: "Tue" },
        { value: 3, label: "Wed" },
        { value: 4, label: "Thu" },
        { value: 5, label: "Fri" },
        { value: 6, label: "Sat" },
    ];

    const [customDateInput, setCustomDateInput] = useState<{
        index: number | null;
        value: string;
    }>({ index: null, value: "" });

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
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Calendar size={24} className="text-orange-600" />
                        Recurring Schedules
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure recurring patterns with time slots
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addFrequency}
                    className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-bold transform hover:scale-105"
                >
                    <Plus size={20} /> Add Schedule
                </button>
            </div>

            {frequencies.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-linear-to-br from-gray-50 to-gray-100">
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
                    {frequencies.map((freq: Frequency, index: number) => {
                        const eventDate = getEventDate(index);
                        return (
                            <div
                                key={index}
                                className="p-8 border-2 border-gray-200 rounded-2xl bg-linear-to-br from-white to-gray-50 hover:border-orange-300 hover:shadow-xl transition-all"
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
                                                removeFrequency(index)
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
                                            value={freq.type || "weekly"}
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
                                        freq.type === "biweekly") && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                Days of Week *
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                {daysOfWeek.map((day) => {
                                                    const isSelected = (
                                                        freq.days_of_week || []
                                                    ).includes(day.value);
                                                    return (
                                                        <button
                                                            key={day.value}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleDayOfWeek(
                                                                    index,
                                                                    day.value
                                                                )
                                                            }
                                                            className={`px-6 py-3 rounded-lg font-bold transition-all ${
                                                                isSelected
                                                                    ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md"
                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                            }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    );
                                                })}
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
                                                            .split("T")[0]
                                                    }
                                                    onChange={(e) =>
                                                        handleStartDateChange(
                                                            index,
                                                            e.target.value
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
                                                            ] || false
                                                        }
                                                        onChange={(e) =>
                                                            toggleSingleDayMode(
                                                                index,
                                                                e.target.checked
                                                            )
                                                        }
                                                        className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                    />
                                                    <span className="text-xs text-gray-600">
                                                        Same as start date
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
                                                            .split("T")[0]
                                                    }
                                                    onChange={(e) =>
                                                        updateEventDate(
                                                            index,
                                                            "end_date",
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        singleDayMode[index]
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
                                                    These slots will apply to
                                                    each occurrence
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => addSlot(index)}
                                                className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                                            >
                                                <Plus size={16} /> Add Slot
                                            </button>
                                        </div>

                                        {getSlots(index).length === 0 ? (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                                                <Clock className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                                <p className="text-gray-600 text-sm font-medium mb-2">
                                                    No time slots defined
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addSlot(index)
                                                    }
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                                                >
                                                    <Plus size={16} /> Add Slot
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {getSlots(index).map(
                                                    (
                                                        slot: EventSlot,
                                                        slotIndex: number
                                                    ) => (
                                                        <div
                                                            key={slotIndex}
                                                            className="p-4 bg-linear-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
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
                                                                        Time *
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
                                                                        End Time
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
                                                                    min={0}
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
                                                            .split("T")[0]
                                                    }
                                                    value={
                                                        customDateInput.index ===
                                                        index
                                                            ? customDateInput.value
                                                            : ""
                                                    }
                                                    onChange={(e) =>
                                                        setCustomDateInput({
                                                            index,
                                                            value: e.target
                                                                .value,
                                                        })
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
                                                    <Plus size={18} />
                                                    Add
                                                </button>
                                            </div>

                                            {freq.selected_dates &&
                                                freq.selected_dates.length >
                                                    0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
                                                            Selected Dates (
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
                                                                        key={i}
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
    );
}
