import type { Event, EventSlot, Booking } from "../../../types/events";
import { Users, ChevronRight, Layers, CheckCircle2 } from "lucide-react";

const BookingInfoSection: React.FC<{
    event: Event;
    slots: EventSlot[];
    bookings: Booking[];
}> = ({ event, slots, bookings }) => {
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const totalBookings = confirmedBookings.reduce(
        (sum, b) => sum + b.quantity,
        0
    );
    const totalCapacity = slots.reduce(
        (sum, s) => sum + (s.is_unlimited ? 0 : s.capacity || 0),
        0
    );
    const hasUnlimited = slots.some((s) => s.is_unlimited);

    return (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Booking Information
                        </h2>
                        <p className="text-sm text-gray-600">
                            Track bookings and engagement
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {/* Total Bookings */}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs uppercase text-gray-600 font-medium">
                                Total Bookings
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                                {totalBookings}
                            </p>
                        </div>
                    </div>

                    {/* Total Capacity */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Layers className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs uppercase text-gray-600 font-medium">
                                Total Capacity
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {hasUnlimited ? "∞" : totalCapacity}
                            </p>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs uppercase text-gray-600 font-medium">
                                Availability
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {hasUnlimited
                                    ? "∞"
                                    : totalCapacity - totalBookings}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                            Engagement Metrics
                        </p>
                        <div className="flex gap-4 text-xl text-gray-600">
                            <span>
                                <strong className="text-gray-900">
                                    {event.like_count}
                                </strong>{" "}
                                likes
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                                <strong className="text-gray-900">
                                    {event.click_count}
                                </strong>{" "}
                                views
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>
                                <strong className="text-gray-900">
                                    {event.click_count > 0
                                        ? (
                                              (totalBookings /
                                                  event.click_count) *
                                              100
                                          ).toFixed(1)
                                        : 0}
                                    %
                                </strong>{" "}
                                conversion
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                            Manage Bookings
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                            View all bookings, check-in attendees, and manage
                            cancellations
                        </p>
                        <a
                            href={`/bookings/event/${event.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                        >
                            Go to Booking Page
                            <ChevronRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingInfoSection;
