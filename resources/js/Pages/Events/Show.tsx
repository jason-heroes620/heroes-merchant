import { useState } from "react";
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Edit,
    Power,
    ArrowLeft,
    CheckCircle,
    XCircle,
    X,
    Info,
    Tag,
    Star,
    TrendingUp,
    Eye,
    Image as ImageIcon,
    Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { router, usePage } from "@inertiajs/react";
import type {
    Media,
    AgeGroup,
    Price,
    Frequency,
    Slot,
    Location,
} from "../../types/events";
import type { PageProps } from "../../types/index";
import StatusModal from "../../components/events/show/StatusModal";

interface Event {
    id: string;
    title: string;
    description?: string;
    type: string;
    category?: string;
    status: string;
    featured: boolean;
    rejected_reason?: string | null;
    default_capacity?: number | null;
    is_unlimited_capacity: boolean;
    is_suitable_for_all_ages: boolean;
    media?: Media[];
    age_groups?: AgeGroup[];
    frequencies?: Frequency[];
    slots?: Slot[];
    prices?: Price[];
    location?: Location;
    like_count?: number;
    click_count?: number;
}

export default function EventShow() {
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [rejectedReason, setRejectedReason] = useState("");
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    const { props } = usePage<PageProps<{ event: Event }>>();
    const { event } = props;
    const user = props.auth.user;
    const isAdmin = user.role === "admin";
    const isMerchant = user.role === "merchant";

    const statusConfig = {
        draft: {
            bg: "bg-gray-100",
            text: "text-gray-700",
            border: "border-gray-300",
            icon: Clock,
        },
        pending: {
            bg: "bg-yellow-100",
            text: "text-yellow-700",
            border: "border-yellow-300",
            icon: Clock,
        },
        active: {
            bg: "bg-green-100",
            text: "text-green-700",
            border: "border-green-300",
            icon: CheckCircle,
        },
        inactive: {
            bg: "bg-red-100",
            text: "text-red-700",
            border: "border-red-300",
            icon: XCircle,
        },
        rejected: {
            bg: "bg-red-100",
            text: "text-red-700",
            border: "border-red-300",
            icon: XCircle,
        },
    };

    type StatusKey = keyof typeof statusConfig;
    const currentStatus =
        statusConfig[event.status as StatusKey] || statusConfig.draft;
    const StatusIcon = currentStatus.icon;

    const formatTime = (timeString: string) => {
        if (!timeString) return "";
        const [hours, minutes] = timeString.split(":");
        return `${hours}:${minutes}`;
    };

    const formatDuration = (startTime: string, endTime: string) => {
        if (!startTime || !endTime) return "";
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diff = (end.getTime() - start.getTime()) / 1000 / 60;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        if (hours === 0) return `${mins}min`;
        if (mins === 0) return `${hours}hr`;
        return `${hours}hr ${mins}min`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatPrice = (price: Price) => {
        switch (price.pricing_type) {
            case "fixed":
                return `RM ${(price.fixed_price_in_cents ?? 0) / 100}`;
            case "age_based":
                return `Children RM ${
                    (price.weekday_price_in_cents ?? 0) / 100
                } / Adult RM ${(price.fixed_price_in_cents ?? 0) / 100}`;
            case "day_type":
                return `Weekday RM ${
                    (price.weekday_price_in_cents ?? 0) / 100
                } / Weekend RM ${(price.weekend_price_in_cents ?? 0) / 100}`;
            case "mixed":
                return `Children RM ${
                    (price.weekday_price_in_cents ?? 0) / 100
                } (Weekday) / RM ${
                    (price.weekend_price_in_cents ?? 0) / 100
                } (Weekend)
Adult RM ${(price.fixed_price_in_cents ?? 0) / 100} (Weekday) / RM ${
                    (price.weekend_price_in_cents ?? 0) / 100
                } (Weekend)`;
            default:
                return "N/A";
        }
    };

    const allSlots = event.slots ?? [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingSlots = allSlots
        .filter((slot) => new Date(slot.date) >= today)
        .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

    const handleToggleStatus = () => {
        let statusToUpdate = newStatus;

        if (isMerchant) {
            if (event.status === "draft") statusToUpdate = "pending";
            else if (event.status === "active") statusToUpdate = "inactive";
            else return;
        } else if (isAdmin) {
            if (!["active", "rejected"].includes(statusToUpdate)) {
                // prevent invalid selection
                toast.error("Please select a valid status");
                return;
            }
        }

        const routeName = isAdmin
            ? `admin.events.updateStatus`
            : `merchant.events.updateStatus`;

        router.post(
            route(routeName, event.id),
            { status: statusToUpdate, rejected_reason: rejectedReason },
            {
                preserveState: true,
                onSuccess: (page) => {
                    event.status = statusToUpdate;
                    console.log(
                        "Event status updated:",
                        statusToUpdate,
                        page.props.flash
                    );
                    setShowStatusModal(false);
                },
                onError: (errors) => {
                    if (errors.status) {
                        toast.error(errors.status);
                    }
                },
            }
        );
    };

    const handleDeactivate = () => {
        if (!confirm("Are you sure you want to deactivate this event?")) return;

        router.post(
            `/merchant/events/${event.id}/deactivate`,
            {},
            {
                onSuccess: () => {
                    alert("Event deactivated successfully!");
                },
                onError: (errors) => {
                    console.error(errors);
                    alert("Failed to deactivate event.");
                },
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium transition-all"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Events</span>
                    </button>
                </div>
            </div>

            {/* Compact Hero Header */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
                        {/* Left: Title & Info */}
                        <div className="flex-1 space-y-4">
                            {/* Status & Type Tags */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}
                                >
                                    <StatusIcon size={16} />
                                    {event.status.charAt(0).toUpperCase() +
                                        event.status.slice(1)}
                                </span>
                                {event.featured && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold">
                                        <Star size={16} fill="currentColor" />
                                        Featured
                                    </span>
                                )}
                                <span className="px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                                    {event.type.replace("_", " ").toUpperCase()}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                                {event.title}
                            </h1>

                            {/* Category */}
                            {event.category && (
                                <div className="flex items-center gap-2 text-white/90">
                                    <Tag size={18} />
                                    <span className="font-medium text-lg">
                                        {event.category}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {isMerchant && (
                                <button
                                    onClick={() =>
                                        router.visit(
                                            `/merchant/events/${event.id}/edit`
                                        )
                                    }
                                    className="flex items-center gap-2 px-5 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    <Edit size={18} />
                                    Edit Event
                                </button>
                            )}

                            {isAdmin && event.status === "pending" && (
                                <button
                                    onClick={() => setShowStatusModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 hover:shadow-lg transition-all"
                                >
                                    <CheckCircle size={18} />
                                    Review
                                </button>
                            )}

                            {isMerchant &&
                                ["draft", "active"].includes(event.status) && (
                                    <button
                                        onClick={() => setShowStatusModal(true)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all ${
                                            event.status === "active"
                                                ? "bg-red-500 text-white hover:bg-red-600"
                                                : "bg-green-500 text-white hover:bg-green-600"
                                        }`}
                                    >
                                        <Power size={18} />
                                        {event.status === "draft"
                                            ? "Submit for Review"
                                            : "Set Inactive"}
                                    </button>
                                )}

                            {isAdmin &&
                                ["active", "inactive"].includes(
                                    event.status
                                ) && (
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all ${
                                            event.status === "active"
                                                ? "bg-red-500 text-white hover:bg-red-600"
                                                : "bg-green-500 text-white hover:bg-green-600"
                                        }`}
                                    >
                                        <Power size={18} />
                                        {event.status === "active"
                                            ? "Set Inactive"
                                            : "Set Active"}
                                    </button>
                                )}

                            {(isMerchant || isAdmin) &&
                                ["active", "draft"].includes(event.status) && (
                                    <button
                                        onClick={handleDeactivate}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 hover:shadow-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                        Deactivate
                                    </button>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Rejection Notice */}
                {event.status === "rejected" && event.rejected_reason && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900 text-lg mb-1">
                                    Rejection Reason
                                </h3>
                                <p className="text-red-800">
                                    {event.rejected_reason}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <TrendingUp size={24} className="text-orange-600" />
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {event.like_count}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Likes
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <Eye size={24} className="text-orange-600" />
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {event.click_count}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Views
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <Calendar size={24} className="text-orange-600" />
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {upcomingSlots.length}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Sessions
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5">
                        <div className="flex items-center gap-3">
                            <Users size={24} className="text-orange-600" />
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {event.is_unlimited_capacity
                                        ? "∞"
                                        : event.default_capacity}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Capacity
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media Gallery */}
                {event.media && event.media.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <ImageIcon
                                    size={24}
                                    className="text-orange-600"
                                />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Event Gallery
                                </h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {event.media.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="aspect-video rounded-xl overflow-hidden cursor-pointer group relative"
                                        onClick={() => setSelectedMedia(item)}
                                    >
                                        <img
                                            src={item.file_path}
                                            alt={`Event media ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Description & Quick Info */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Description */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Info size={24} className="text-orange-600" />
                            <h2 className="text-2xl font-bold text-gray-900">
                                About This Event
                            </h2>
                        </div>
                        {event.description ? (
                            <p className="text-gray-700 leading-relaxed">
                                {event.description}
                            </p>
                        ) : (
                            <p className="text-gray-400 italic">
                                No description provided
                            </p>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Quick Info
                        </h3>

                        {/* Price Range */}
                        {event.prices?.map((price) => (
                            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                                <DollarSign
                                    size={20}
                                    className="text-orange-600 mt-0.5"
                                />
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">
                                        Price
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatPrice(price)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Age Range */}
                        <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                            <Users
                                size={20}
                                className="text-green-600 mt-0.5"
                            />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">
                                    Age Range
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                    {event.is_suitable_for_all_ages ? (
                                        <span className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                                            All Ages
                                        </span>
                                    ) : event.age_groups &&
                                      event.age_groups.length > 0 ? (
                                        event.age_groups.map((group, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-block px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium"
                                            >
                                                {group.label &&
                                                    `${group.label}`}
                                                {group.min_age != null &&
                                                    group.max_age != null &&
                                                    ` (${group.min_age}-${group.max_age})`}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            No age groups
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Capacity */}
                        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                            <Users size={20} className="text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">
                                    Capacity
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                    {event.is_unlimited_capacity
                                        ? "Unlimited"
                                        : event.default_capacity}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <MapPin size={24} className="text-orange-600" />
                            <h2 className="text-2xl font-bold text-gray-900">
                                Location
                            </h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        {event.location?.location_name && (
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                                <MapPin
                                    size={20}
                                    className="text-blue-600 mt-0.5 flex-shrink-0"
                                />
                                <p className="text-base font-semibold text-gray-900">
                                    {event.location.location_name}
                                </p>
                            </div>
                        )}

                        {event.location?.how_to_get_there && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info
                                        size={16}
                                        className="text-orange-600"
                                    />
                                    <span className="text-xs font-bold text-orange-800 uppercase">
                                        How to Get There
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {event.location.how_to_get_there}
                                </p>
                            </div>
                        )}

                        {event.location?.location_name && (
                            <div className="space-y-3">
                                <div className="relative w-full h-80 rounded-xl overflow-hidden border-2 border-gray-200">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                            event.location.location_name
                                        )}&z=15&output=embed`}
                                        title="Event Location"
                                    />
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                                        event.location.location_name
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700"
                                >
                                    <MapPin size={16} />
                                    Open in Google Maps
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                {event.age_groups && event.age_groups.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <DollarSign
                                    size={24}
                                    className="text-orange-600"
                                />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Pricing
                                </h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid sm:grid-cols-2 gap-6">
                                {event.age_groups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="border-2 border-orange-100 rounded-xl p-6 bg-gradient-to-br from-orange-50 to-white"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <Users
                                                size={20}
                                                className="text-orange-600"
                                            />
                                            <h3 className="font-bold text-xl text-gray-900">
                                                {group.label}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b border-orange-100">
                                            <span className="font-medium">
                                                Age:
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                {group.min_age && group.max_age
                                                    ? `${group.min_age} - ${group.max_age} years`
                                                    : group.min_age
                                                    ? `${group.min_age}+ years`
                                                    : group.max_age
                                                    ? `Up to ${group.max_age} years`
                                                    : "All ages"}
                                            </span>
                                        </div>

                                        {group.prices?.map((price) => (
                                            <div
                                                key={price.id}
                                                className="space-y-2"
                                            >
                                                {price.fixed_price_in_cents !=
                                                    null && (
                                                    <div className="flex items-center justify-between bg-orange-100 rounded-lg px-4 py-3">
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            Fixed Price
                                                        </span>
                                                        <span className="text-xl font-bold text-orange-600">
                                                            RM{" "}
                                                            {(
                                                                price.fixed_price_in_cents /
                                                                100
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}
                                                {price.weekday_price_in_cents !=
                                                    null &&
                                                    price.weekend_price_in_cents !=
                                                        null && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2">
                                                                <span className="text-sm font-semibold text-gray-700">
                                                                    Weekday
                                                                </span>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    RM{" "}
                                                                    {(
                                                                        price.weekday_price_in_cents /
                                                                        100
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2">
                                                                <span className="text-sm font-semibold text-gray-700">
                                                                    Weekend
                                                                </span>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    RM{" "}
                                                                    {(
                                                                        price.weekend_price_in_cents /
                                                                        100
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Available Sessions */}
                {event.slots && event.slots.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar
                                        size={24}
                                        className="text-orange-600"
                                    />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Available Sessions
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {upcomingSlots.length}{" "}
                                            {upcomingSlots.length === 1
                                                ? "session"
                                                : "sessions"}{" "}
                                            scheduled
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingSlots.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="border-2 border-orange-100 rounded-xl p-5 bg-white hover:shadow-md hover:border-orange-200 transition-all"
                                    >
                                        {/* Date Header */}
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Calendar
                                                    size={18}
                                                    className="text-orange-600"
                                                />
                                                <span className="font-bold text-gray-900">
                                                    {formatDate(slot.date)}
                                                </span>
                                            </div>
                                            {slot.slot_type && (
                                                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold uppercase">
                                                    {slot.slot_type}
                                                </span>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <div className="space-y-3">
                                            {!slot.is_all_day &&
                                            slot.start_time &&
                                            slot.end_time ? (
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                                                    <Clock
                                                        size={16}
                                                        className="text-orange-600"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900 text-sm">
                                                            {formatTime(
                                                                slot.start_time
                                                            )}{" "}
                                                            -{" "}
                                                            {formatTime(
                                                                slot.end_time
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatDuration(
                                                                slot.start_time,
                                                                slot.end_time
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
                                                    <Clock
                                                        size={16}
                                                        className="text-orange-600"
                                                    />
                                                    <span className="font-semibold text-gray-900 text-sm">
                                                        All Day
                                                    </span>
                                                </div>
                                            )}

                                            {/* Availability */}
                                            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2.5">
                                                <Users
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                                <span className="text-sm font-bold text-gray-900">
                                                    {slot.is_unlimited
                                                        ? "Unlimited"
                                                        : `${
                                                              (slot.capacity ||
                                                                  0) -
                                                              (slot.booked || 0)
                                                          } / ${
                                                              slot.capacity || 0
                                                          } spots`}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            {slot.price_in_cents != null && (
                                                <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign
                                                            size={16}
                                                            className="text-orange-600"
                                                        />
                                                        <span className="text-sm font-medium text-gray-600">
                                                            Price
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-orange-600">
                                                        RM{" "}
                                                        {(
                                                            slot.price_in_cents /
                                                            100
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Details */}
                {event.frequencies && event.frequencies.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Calendar
                                    size={24}
                                    className="text-orange-600"
                                />
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Schedule Information
                                </h2>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {event.frequencies.map((freq, index) => (
                                <div
                                    key={freq.id}
                                    className="border border-gray-200 rounded-xl overflow-hidden"
                                >
                                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                                        <h3 className="font-bold text-lg text-gray-900">
                                            Schedule {index + 1}
                                        </h3>
                                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold uppercase">
                                            {freq.type.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="p-6 grid sm:grid-cols-2 gap-4">
                                        {freq.start_date && (
                                            <div className="flex items-start gap-3">
                                                <Calendar
                                                    size={18}
                                                    className="text-orange-600 mt-1"
                                                />
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                        Start Date
                                                    </p>
                                                    <p className="font-semibold text-gray-900">
                                                        {formatDate(
                                                            freq.start_date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {freq.end_date && (
                                            <div className="flex items-start gap-3">
                                                <Calendar
                                                    size={18}
                                                    className="text-orange-600 mt-1"
                                                />
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                        End Date
                                                    </p>
                                                    <p className="font-semibold text-gray-900">
                                                        {formatDate(
                                                            freq.end_date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {freq.start_time && freq.end_time && (
                                            <div className="flex items-start gap-3">
                                                <Clock
                                                    size={18}
                                                    className="text-orange-600 mt-1"
                                                />
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                        Time Range
                                                    </p>
                                                    <p className="font-semibold text-gray-900">
                                                        {formatTime(
                                                            freq.start_time
                                                        )}{" "}
                                                        -{" "}
                                                        {formatTime(
                                                            freq.end_time
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {freq.slots &&
                                            freq.slots.length > 0 && (
                                                <div className="flex items-start gap-3">
                                                    <Tag
                                                        size={18}
                                                        className="text-orange-600 mt-1"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                            Total Sessions
                                                        </p>
                                                        <p className="font-semibold text-gray-900">
                                                            {freq.slots.length}{" "}
                                                            {freq.slots
                                                                .length === 1
                                                                ? "session"
                                                                : "sessions"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <StatusModal
                    setShowStatusModal={setShowStatusModal}
                    handleToggleStatus={handleToggleStatus}
                    newStatus={newStatus}
                    setNewStatus={setNewStatus}
                    rejectedReason={rejectedReason}
                    setRejectedReason={setRejectedReason}
                />
            )}

            {/* Media Lightbox */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={selectedMedia.file_path}
                        alt="Selected media"
                        className="max-h-[90vh] max-w-full rounded-lg"
                    />
                </div>
            )}
        </div>
    );
}
