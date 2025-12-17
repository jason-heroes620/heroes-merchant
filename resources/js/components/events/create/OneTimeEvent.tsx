import {
    Calendar,
    Plus,
    Trash2,
    Clock,
    AlertCircle,
    Infinity,
} from "lucide-react";
import type { EventSlot } from "../../../types/events";

export default function OneTimeEvent({ getEventDate, updateEventDate, addSlot, removeSlot, updateSlot, getSlots, errors, calculateDuration, toggleSingleDayMode, handleStartDateChange, singleDayMode }: any) {
    const firstEventDate = getEventDate(0);

    return (
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
                            <Calendar size={18} className="text-orange-600" />
                            Event Start Date *
                        </label>
                        <input
                            type="date"
                            value={firstEventDate.start_date}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) =>
                                handleStartDateChange(0, e.target.value)
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
                            <Calendar size={18} className="text-orange-600" />
                            Event End Date *
                        </label>

                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={singleDayMode[0] || false}
                                onChange={(e) =>
                                    toggleSingleDayMode(0, e.target.checked)
                                }
                                className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-600">
                                Single day event (same as start date)
                            </span>
                        </label>

                        <input
                            type="date"
                            value={firstEventDate.end_date}
                            min={
                                firstEventDate.start_date ||
                                new Date().toISOString().split("T")[0]
                            }
                            onChange={(e) =>
                                updateEventDate(0, "end_date", e.target.value)
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
                            Add at least one time slot for your event
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
                        {getSlots(0).map((slot: EventSlot, slotIndex: number) => (
                            <div
                                key={slotIndex}
                                className="p-5 bg-linear-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                        {slotIndex + 1}
                                    </div>
                                    <h5 className="font-bold text-gray-800">
                                        Slot {slotIndex + 1}
                                    </h5>
                                    <button
                                        type="button"
                                        onClick={() => removeSlot(0, slotIndex)}
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
                                        {slot.start_time && slot.end_time && (
                                            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                                                <Clock size={12} />
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
                                            checked={slot.is_unlimited}
                                            onChange={(e) => {
                                                updateSlot(
                                                    0,
                                                    slotIndex,
                                                    "is_unlimited",
                                                    e.target.checked
                                                );
                                                if (e.target.checked) {
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
                                                e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value)
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
    );
}
