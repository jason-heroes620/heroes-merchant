import { useState } from "react";
import type { UserRole, Event, Conversion } from "../../../types/events";
import { Star, ChevronLeft } from "lucide-react";
import StatusToggleModal from "./StatusToggleModal";
import StatusBadge from "./StatusBadge";

const EventHeader: React.FC<{
    event: Event;
    userRole: UserRole;
    conversion: Conversion | null;
    onStatusUpdate: (newStatus: string, rejectedReason?: string) => void;
}> = ({ event, userRole, conversion }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
        return `${day}-${month}-${year} (${weekday})`;
    };

    const [showModal, setShowModal] = useState(false);

    const canToggleStatus = () => {
        if (userRole === "merchant") {
            return event.status === "draft" || event.status === "active";
        }
        if (userRole === "admin") {
            return ["pending", "active", "inactive"].includes(event.status);
        }
        return false;
    };

    return (
        <>
            <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-6">
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={() => window.history.back()}
                        className="mb-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Events
                    </button>
                </div>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {event.title}
                        </h1>
                        <p className="text-orange-100 text-sm">
                            Created on {formatDate(event.created_at)} • Last
                            updated {formatDate(event.updated_at)}
                        </p>
                    </div>
                    {event.featured && (
                        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm font-medium">
                                Featured
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <StatusBadge status={event.status} />

                    {canToggleStatus() && event.status !== "inactive" && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-white text-orange-600 rounded-full font-medium text-sm hover:bg-orange-50 transition-colors"
                        >
                            Update Status
                        </button>
                    )}
                </div>

                {event.status === "rejected" && event.rejected_reason && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-sm font-medium text-red-900 mb-1">
                            Rejection Reason:
                        </p>
                        <p className="text-sm text-red-800">
                            {event.rejected_reason}
                        </p>
                    </div>
                )}
            </div>

            {showModal && (
                <StatusToggleModal
                    event={event}
                    userRole={userRole}
                    conversion={conversion}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default EventHeader;
