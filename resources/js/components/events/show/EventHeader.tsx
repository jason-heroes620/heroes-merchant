import { useState } from "react";
import { router } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import type { UserRole, Event, Conversion } from "../../../types/events";
import { Star, ChevronLeft, AlertCircle } from "lucide-react";
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

    const isAdmin = userRole === "admin";
    const [showModal, setShowModal] = useState(false);
    const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
    const [showRejectionReason, setShowRejectionReason] = useState(false);

    const canToggleStatus = () => {
        if (userRole === "merchant") {
            return event.status === "draft" || event.status === "active";
        }
        if (userRole === "admin") {
            return ["pending", "active", "inactive"].includes(event.status);
        }
        return false;
    };

    const handleToggleFeatured = () => {
        if (!isAdmin || isTogglingFeatured) return;

        setIsTogglingFeatured(true);

        const nextFeaturedState = !event.featured;

        router.patch(
            route("admin.events.feature.update", event.id),
            {
                featured: nextFeaturedState,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    event.featured = nextFeaturedState;

                    toast.success(
                        nextFeaturedState
                            ? "Event featured successfully"
                            : "Event unfeatured successfully"
                    );
                },
                onError: (errors) => {
                    if (errors.featured) {
                        toast.error(errors.featured);
                    } else {
                        toast.error("Failed to update featured status");
                    }
                },
                onFinish: () => {
                    setIsTogglingFeatured(false);
                },
            }
        );
    };

    return (
        <>
            <div className="mb-4 flex">
                <button
                    onClick={() => window.history.back()}
                    className="mb-4 px-4 py-3 bg-orange-500 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Events
                </button>
            </div>
            <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white mb-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">
                            {event.title}
                        </h1>

                        {userRole === "admin" && (
                            <p className="text-orange-100 text-sm">
                                {event.merchant?.company_name}
                            </p>
                        )}

                        <p className="text-orange-100 text-sm">
                            Created on {formatDate(event.created_at)} • Last
                            updated {formatDate(event.updated_at)}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            {/* Status Badge with Rejection Reason Popover */}
                            {event.status === "rejected" &&
                            event.rejected_reason ? (
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowRejectionReason(
                                                !showRejectionReason
                                            )
                                        }
                                        onMouseEnter={() =>
                                            setShowRejectionReason(true)
                                        }
                                        onMouseLeave={() =>
                                            setShowRejectionReason(false)
                                        }
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <StatusBadge status={event.status} />
                                    </button>

                                    {showRejectionReason && (
                                        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-red-200 p-4 z-10 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-start gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-semibold text-red-900">
                                                    Rejection Reason
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                {event.rejected_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <StatusBadge status={event.status} />
                            )}

                            {canToggleStatus() &&
                                event.status !== "inactive" && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="px-4 py-2 bg-white text-orange-600 rounded-full font-medium text-sm hover:bg-orange-50 transition-colors"
                                    >
                                        Update Status
                                    </button>
                                )}

                            {isAdmin && (
                                <button
                                    onClick={handleToggleFeatured}
                                    disabled={isTogglingFeatured}
                                    title={
                                        event.featured
                                            ? "Unfeature event"
                                            : "Feature event"
                                    }
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${
                            event.featured
                                ? "bg-white/20 hover:bg-white/30"
                                : "bg-white/10 hover:bg-white/20"
                        }
                        ${
                            isTogglingFeatured
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                        }
                    `}
                                >
                                    <Star
                                        className={`w-4 h-4 ${
                                            event.featured
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-white"
                                        }`}
                                    />
                                    {event.featured
                                        ? "Featured"
                                        : "Set as Featured"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
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
