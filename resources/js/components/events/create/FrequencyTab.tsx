import { useState } from "react";
import {
    Calendar,
    Plus,
    Trash2,
    Clock,
    Users,
    AlertCircle,
    Check,
    X,
    Infinity,
    Sun,
} from "lucide-react";

interface FrequencyTabProps {
    data: any;
    setData: (k: string, v: any) => void;
    errors: Record<string, any>;
    frequencies: any[];
    addFrequency: () => void;
    removeFrequency: (index: number) => void;
    updateFrequency: (index: number, field: string, value: any) => void;
}

export default function FrequencyTab({
    data,
    setData,
    errors,
    frequencies,
    addFrequency,
    removeFrequency,
    updateFrequency,
}: FrequencyTabProps) {
    const [customDateInput, setCustomDateInput] = useState<{
        index: number | null;
        value: string;
    }>({
        index: null,
        value: "",
    });

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

    // Generate dates based on recurrence pattern
    const generateDates = (freq: any): string[] => {
        if (!freq.start_date || !freq.end_date) return [];

        const start = new Date(freq.start_date);
        const end = new Date(freq.end_date);
        const dates: string[] = [];

        if (freq.type === "daily") {
            let current = new Date(start);
            while (current <= end) {
                dates.push(current.toISOString().split("T")[0]);
                current.setDate(current.getDate() + 1);
            }
        } else if (freq.type === "weekly" || freq.type === "biweekly") {
            const daysOfWeek = freq.days_of_week || [];
            const increment = freq.type === "biweekly" ? 14 : 7;

            if (daysOfWeek.length > 0) {
                let current = new Date(start);
                while (current <= end) {
                    if (daysOfWeek.includes(current.getDay())) {
                        dates.push(current.toISOString().split("T")[0]);
                    }
                    current.setDate(current.getDate() + 1);
                }
                current.setDate(current.getDate() + (increment - 7));
            }
        } else if (freq.type === "monthly") {
            let current = new Date(start);
            while (current <= end) {
                dates.push(current.toISOString().split("T")[0]);
                current.setMonth(current.getMonth() + 1);
            }
        } else if (freq.type === "annually") {
            let current = new Date(start);
            while (current <= end) {
                dates.push(current.toISOString().split("T")[0]);
                current.setFullYear(current.getFullYear() + 1);
            }
        }

        return dates;
    };

    // Calculate duration between times
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

        if (hours < 0) {
            hours += 24;
        }

        if (hours === 0) {
            return `${minutes} min`;
        } else if (minutes === 0) {
            return `${hours} hr${hours !== 1 ? "s" : ""}`;
        } else {
            return `${hours} hr${hours !== 1 ? "s" : ""} ${minutes} min`;
        }
    };

    // Validate dates and times
    const validateDateTime = (freq: any) => {
        const errors: any = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (freq.start_date) {
            const startDate = new Date(freq.start_date);
            if (startDate < today) {
                errors.start_date = "Start date must be today or later";
            }
        }

        if (freq.end_date && freq.start_date) {
            const startDate = new Date(freq.start_date);
            const endDate = new Date(freq.end_date);
            if (endDate < startDate) {
                errors.end_date = "End date must be after start date";
            }
            if (endDate < today) {
                errors.end_date = "End date must be today or later";
            }
        }

        if (freq.start_time && freq.end_time && !freq.is_all_day) {
            const [startHour, startMin] = freq.start_time
                .split(":")
                .map(Number);
            const [endHour, endMin] = freq.end_time.split(":").map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (endMinutes <= startMinutes) {
                errors.end_time = "End time must be later than start time";
            }
        }

        if (freq.capacity != null && freq.capacity < 0) {
            errors.capacity = "Capacity cannot be negative";
        }

        return errors;
    };

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

                {/* One-Time Event */}
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
                                    Set the date and time for your single event
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    <Calendar
                                        size={18}
                                        className="text-orange-600"
                                    />
                                    Event Date *
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date ?? ""}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) =>
                                        setData("start_date", e.target.value)
                                    }
                                    className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                />
                                {errors?.start_date && (
                                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                                        <AlertCircle size={14} />
                                        {errors.start_date}
                                    </p>
                                )}
                            </div>

                            {/* All Day Checkbox */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_all_day || false}
                                        onChange={(e) => {
                                            setData(
                                                "is_all_day",
                                                e.target.checked
                                            );
                                            if (e.target.checked) {
                                                setData("start_time", "");
                                                setData("end_time", "");
                                            }
                                        }}
                                        className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Sun
                                            size={18}
                                            className="text-orange-500"
                                        />
                                        All Day Event
                                    </span>
                                </label>
                            </div>

                            {!data.is_all_day && (
                                <>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                            <Clock
                                                size={18}
                                                className="text-orange-600"
                                            />
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={data.start_time ?? ""}
                                            onChange={(e) =>
                                                setData(
                                                    "start_time",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                            <Clock
                                                size={18}
                                                className="text-orange-600"
                                            />
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={data.end_time ?? ""}
                                            onChange={(e) =>
                                                setData(
                                                    "end_time",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                        />
                                        {data.start_time && data.end_time && (
                                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                                                <Clock size={14} />
                                                Duration:{" "}
                                                {calculateDuration(
                                                    data.start_time,
                                                    data.end_time
                                                )}
                                            </p>
                                        )}
                                        {errors?.end_time && (
                                            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                                <AlertCircle size={12} />{" "}
                                                {errors.end_time}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                    <Users
                                        size={18}
                                        className="text-orange-600"
                                    />
                                    Participant Capacity
                                </label>

                                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={
                                            data.is_unlimited_capacity || false
                                        }
                                        onChange={(e) => {
                                            setData(
                                                "is_unlimited_capacity",
                                                e.target.checked
                                            );
                                            if (e.target.checked) {
                                                setData(
                                                    "default_capacity",
                                                    null
                                                );
                                            }
                                        }}
                                        className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Infinity
                                            size={18}
                                            className="text-orange-500"
                                        />
                                        Unlimited Capacity
                                    </span>
                                </label>

                                <input
                                    type="number"
                                    min={0}
                                    value={data.default_capacity ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (
                                            value === "" ||
                                            Number(value) >= 0
                                        ) {
                                            setData(
                                                "default_capacity",
                                                value === ""
                                                    ? null
                                                    : Number(value)
                                            );
                                        }
                                    }}
                                    disabled={data.is_unlimited_capacity}
                                    className="w-full px-5 py-4 text-lg border-2 border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder={
                                        data.is_unlimited_capacity
                                            ? "Unlimited"
                                            : "e.g., 30"
                                    }
                                />
                                {errors?.default_capacity && (
                                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                        <AlertCircle size={12} />{" "}
                                        {errors.default_capacity}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Recurring Event */}
                {data.is_recurring && (
                    <div className="space-y-6">
                        {/* Header & Add Schedule */}
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
                                    Configure one or more recurring patterns for
                                    your event
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

                        {/* Empty State */}
                        {(frequencies ?? []).length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                                <Calendar className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                                <p className="text-gray-600 font-bold text-lg mb-2">
                                    No recurring schedules defined
                                </p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Click "Add Schedule" to create your first
                                    recurring pattern
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
                                {frequencies.map((freq: any, index: number) => {
                                    const generatedDates =
                                        freq.type !== "custom"
                                            ? generateDates(freq)
                                            : [];
                                    const validationErrors =
                                        validateDateTime(freq);

                                    return (
                                        <div
                                            key={index}
                                            className="p-8 border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:border-orange-300 hover:shadow-xl transition-all"
                                        >
                                            <div className="space-y-6">
                                                {/* Schedule Header */}
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
                                                            freq.type ??
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
                                                        {(
                                                            freq.days_of_week ||
                                                            []
                                                        ).length === 0 && (
                                                            <p className="text-orange-600 text-sm mt-2 flex items-center gap-1 font-medium">
                                                                <AlertCircle
                                                                    size={14}
                                                                />
                                                                Please select at
                                                                least one day
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Date Range */}
                                                {freq.type !== "custom" && (
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        {/* Start Date */}
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                Start Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={
                                                                    freq.start_date
                                                                        ? new Date(
                                                                              freq.start_date
                                                                          )
                                                                              .toISOString()
                                                                              .split(
                                                                                  "T"
                                                                              )[0]
                                                                        : ""
                                                                }
                                                                min={
                                                                    new Date()
                                                                        .toISOString()
                                                                        .split(
                                                                            "T"
                                                                        )[0]
                                                                }
                                                                onChange={(e) =>
                                                                    updateFrequency(
                                                                        index,
                                                                        "start_date",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                                            />
                                                            {validationErrors.start_date && (
                                                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                                                    <AlertCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{" "}
                                                                    {
                                                                        validationErrors.start_date
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* End Date */}
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                End Date *
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={
                                                                    freq.end_date
                                                                        ? new Date(
                                                                              freq.end_date
                                                                          )
                                                                              .toISOString()
                                                                              .split(
                                                                                  "T"
                                                                              )[0]
                                                                        : ""
                                                                }
                                                                min={
                                                                    freq.start_date
                                                                        ? new Date(
                                                                              freq.start_date
                                                                          )
                                                                              .toISOString()
                                                                              .split(
                                                                                  "T"
                                                                              )[0]
                                                                        : new Date()
                                                                              .toISOString()
                                                                              .split(
                                                                                  "T"
                                                                              )[0]
                                                                }
                                                                onChange={(e) =>
                                                                    updateFrequency(
                                                                        index,
                                                                        "end_date",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                                            />
                                                            {validationErrors.end_date && (
                                                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                                                    <AlertCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{" "}
                                                                    {
                                                                        validationErrors.end_date
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* All Day Checkbox */}
                                                <div>
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                freq.is_all_day ||
                                                                false
                                                            }
                                                            onChange={(e) => {
                                                                updateFrequency(
                                                                    index,
                                                                    "is_all_day",
                                                                    e.target
                                                                        .checked
                                                                );
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    updateFrequency(
                                                                        index,
                                                                        "start_time",
                                                                        ""
                                                                    );
                                                                    updateFrequency(
                                                                        index,
                                                                        "end_time",
                                                                        ""
                                                                    );
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                        />
                                                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <Sun
                                                                size={18}
                                                                className="text-orange-500"
                                                            />
                                                            All Day Event
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* Time Range */}
                                                {!freq.is_all_day && (
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                Start Time
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={
                                                                    freq.start_time ??
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateFrequency(
                                                                        index,
                                                                        "start_time",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                                End Time
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={
                                                                    freq.end_time ??
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateFrequency(
                                                                        index,
                                                                        "end_time",
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                                                            />
                                                            {freq.start_time &&
                                                                freq.end_time && (
                                                                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                                                                        <Clock
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                        Duration:{" "}
                                                                        {calculateDuration(
                                                                            freq.start_time,
                                                                            freq.end_time
                                                                        )}
                                                                    </p>
                                                                )}
                                                            {validationErrors.end_time && (
                                                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                                                    <AlertCircle
                                                                        size={
                                                                            12
                                                                        }
                                                                    />{" "}
                                                                    {
                                                                        validationErrors.end_time
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Capacity */}
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                                                        Capacity
                                                    </label>

                                                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                freq.is_unlimited_capacity ||
                                                                false
                                                            }
                                                            onChange={(e) => {
                                                                updateFrequency(
                                                                    index,
                                                                    "is_unlimited_capacity",
                                                                    e.target
                                                                        .checked
                                                                );
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    updateFrequency(
                                                                        index,
                                                                        "capacity",
                                                                        null
                                                                    );
                                                                }
                                                            }}
                                                            className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                            <Infinity
                                                                size={18}
                                                                className="text-orange-500"
                                                            />
                                                            Unlimited Capacity
                                                        </span>
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={
                                                            freq.capacity ?? ""
                                                        }
                                                        onChange={(e) => {
                                                            const value =
                                                                e.target.value;
                                                            if (
                                                                value === "" ||
                                                                Number(value) >=
                                                                    0
                                                            ) {
                                                                updateFrequency(
                                                                    index,
                                                                    "capacity",
                                                                    value === ""
                                                                        ? null
                                                                        : Number(
                                                                              value
                                                                          )
                                                                );
                                                            }
                                                        }}
                                                        disabled={
                                                            freq.is_unlimited_capacity
                                                        }
                                                        placeholder={
                                                            freq.is_unlimited_capacity
                                                                ? "Unlimited"
                                                                : "e.g., 30"
                                                        }
                                                        className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                    {validationErrors.capacity && (
                                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                                            <AlertCircle
                                                                size={12}
                                                            />{" "}
                                                            {
                                                                validationErrors.capacity
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Generated Dates Preview */}
                                                {freq.type !== "custom" &&
                                                    generatedDates.length >
                                                        0 && (
                                                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                                            <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                                <Calendar
                                                                    size={16}
                                                                />
                                                                Generated Dates
                                                                (
                                                                {
                                                                    generatedDates.length
                                                                }{" "}
                                                                sessions)
                                                            </p>
                                                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                                                {generatedDates
                                                                    .slice(
                                                                        0,
                                                                        20
                                                                    )
                                                                    .map(
                                                                        (
                                                                            date,
                                                                            i
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="px-3 py-1 bg-white text-xs font-medium text-blue-800 rounded-full border border-blue-300"
                                                                            >
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
                                                                        )
                                                                    )}
                                                                {generatedDates.length >
                                                                    20 && (
                                                                    <span className="px-3 py-1 bg-blue-100 text-xs font-bold text-blue-800 rounded-full">
                                                                        +
                                                                        {generatedDates.length -
                                                                            20}{" "}
                                                                        more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* Custom Dates */}
                                                {freq.type === "custom" && (
                                                    <div className="p-6 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50">
                                                        <label className="block text-sm font-bold text-orange-800 mb-3">
                                                            Custom Dates
                                                        </label>

                                                        {/* Date Input */}
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
                                                                placeholder="Select a date"
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
                                                                Add Date
                                                            </button>
                                                        </div>

                                                        {/* Selected Dates */}
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