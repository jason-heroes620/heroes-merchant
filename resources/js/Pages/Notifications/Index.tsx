import { router } from "@inertiajs/react";
import { useState } from "react";
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    ShoppingBag,
    CreditCard,
    ArrowDownCircle,
    ArrowUpCircle,
    Bell,
    UserPlus,
    Users,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";

type NotificationData = {
    [key: string]: any;
};

type Notification = {
    id: string;
    type: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
};

type Props = {
    notifications: Notification[];
};

export default function NotificationsPage({ notifications }: Props) {
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const filteredNotifications =
        filter === "unread"
            ? notifications.filter((n) => !n.read_at)
            : notifications;

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    const getNotificationIcon = (type: string, data: any) => {
        const iconClass = "w-5 h-5";

        if (type.includes("WalletTransaction")) {
            if (data.type === "booking") {
                return data.message?.includes("Refund") ? (
                    <ArrowUpCircle
                        className={`${iconClass} text-emerald-600`}
                    />
                ) : (
                    <ArrowDownCircle
                        className={`${iconClass} text-orange-600`}
                    />
                );
            }
            if (data.type === "purchase")
                return <ShoppingBag className={`${iconClass} text-blue-600`} />;
            if (data.type === "registration")
                return <UserPlus className={`${iconClass} text-purple-600`} />;
            if (data.type === "referral")
                return <Users className={`${iconClass} text-pink-600`} />;
            return <CreditCard className={`${iconClass} text-gray-600`} />;
        }
        if (type.includes("Event")) {
            if (data.status === "active")
                return (
                    <CheckCircle className={`${iconClass} text-emerald-600`} />
                );
            if (data.status === "rejected")
                return <XCircle className={`${iconClass} text-red-600`} />;
            if (data.status === "pending")
                return <Clock className={`${iconClass} text-amber-600`} />;
            return <FileText className={`${iconClass} text-blue-600`} />;
        }
        if (type.includes("Booking")) {
            if (data.status === "confirmed")
                return (
                    <CheckCircle className={`${iconClass} text-emerald-600`} />
                );
            if (data.status === "cancelled")
                return <XCircle className={`${iconClass} text-red-600`} />;
            return <Calendar className={`${iconClass} text-blue-600`} />;
        }
        return <Bell className={`${iconClass} text-gray-600`} />;
    };

    const getNotificationCategory = (type: string) => {
        if (type.includes("WalletTransaction")) return "Wallet";
        if (type.includes("Event")) return "Events";
        if (type.includes("Booking")) return "Bookings";
        return "System";
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            Wallet: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            Events: "bg-blue-50 text-blue-700 border border-blue-200",
            Bookings: "bg-purple-50 text-purple-700 border border-purple-200",
            System: "bg-gray-50 text-gray-700 border border-gray-200",
        };
        return colors[category as keyof typeof colors] || colors.System;
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString("en-MY", {
            month: "short",
            day: "numeric",
            year:
                date.getFullYear() !== now.getFullYear()
                    ? "numeric"
                    : undefined,
        });
    };

    const formatFullDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-MY", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleNotificationClick = async (
        notification: Notification,
        href: string
    ) => {
        // Mark as read if unread
        if (!notification.read_at) {
            try {
                await router.post(
                    `/notifications/${notification.id}/mark-as-read`,
                    {},
                    {
                        preserveScroll: true,
                        preserveState: true,
                        only: ["notifications"],
                    }
                );
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }

        // Navigate to the link if it's not just '#'
        if (href && href !== "#") {
            router.visit(href);
        }
    };

    const enhanceMessage = (notification: Notification) => {
        const { type, data } = notification;

        // Wallet Transaction Notifications
        if (type.includes("WalletTransaction")) {
            if (
                data.message?.includes(
                    "Booking Cancellation (Credits Forfeited)"
                )
            ) {
                return {
                    title: "Booking Cancelled - Credits Forfeited",
                    description: data.message
                        .replace("Booking Cancellation (Credits Forfeited)", "")
                        .trim(),
                };
            }
            if (data.message?.includes("Booking Refund")) {
                return {
                    title: "Booking Refund Processed",
                    description: data.message
                        .replace("Booking Refund", "")
                        .trim(),
                };
            }
            if (data.message?.includes("Booking Deduction")) {
                return {
                    title: "Credits Deducted for Booking",
                    description: data.message
                        .replace("Booking Deduction", "")
                        .trim(),
                };
            }
            if (data.message?.includes("Package Purchase")) {
                return {
                    title: "Credit Package Purchased",
                    description: data.message,
                };
            }
            if (data.message?.includes("Free credits on registration")) {
                return {
                    title: "Registration Bonus Credits",
                    description: data.message,
                };
            }
            if (data.type === "registration") {
                return {
                    title: "Welcome! Registration Credits Received",
                    description:
                        data.message ||
                        "You've received credits for joining us",
                };
            }
            if (data.type === "referral") {
                return {
                    title: "Referral Bonus Credits",
                    description:
                        data.message ||
                        "You've earned credits from a successful referral",
                };
            }
        }

        // Event Notifications
        if (type.includes("Event")) {
            if (data.status === "active") {
                return {
                    title: "Event Approved & Activated",
                    description:
                        data.message ||
                        `Your event "${data.title}" is now live and accepting bookings`,
                };
            }
            if (data.status === "rejected") {
                return {
                    title: "Event Submission Rejected",
                    description:
                        data.message ||
                        `Your event "${data.title}" requires attention`,
                };
            }
            if (data.action === "created") {
                return {
                    title: "New Event Created",
                    description: data.message,
                };
            }
            if (data.action === "updated") {
                return {
                    title: "Event Details Updated",
                    description: data.message,
                };
            }
        }

        // Booking Notifications
        if (type.includes("Booking")) {
            if (data.status === "confirmed") {
                return {
                    title: "Booking Confirmed",
                    description: data.message,
                };
            }
            if (data.status === "cancelled") {
                return {
                    title: "Booking Cancelled",
                    description: data.message,
                };
            }
        }

        // Fallback
        return {
            title: data.title || type.split("\\").pop() || "Notification",
            description: data.message || "You have a new notification",
        };
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-orange-50/30 to-red-50/20">
                {/* Header Section */}
                <div className="bg-linear-to-r from-orange-600 via-orange-500 to-red-500 shadow-lg">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
                                    Notifications
                                </h1>
                                <p className="text-orange-50 text-sm sm:text-base">
                                    Stay updated with your latest activities
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    <span className="text-white font-semibold text-sm">
                                        {unreadCount} unread
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {/* Filter Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                                        filter === "all"
                                            ? "bg-linear-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200"
                                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                                >
                                    All Notifications
                                </button>
                                <button
                                    onClick={() => setFilter("unread")}
                                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                        filter === "unread"
                                            ? "bg-linear-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-200"
                                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                                >
                                    Unread
                                    {unreadCount > 0 && (
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                filter === "unread"
                                                    ? "bg-white text-orange-600"
                                                    : "bg-orange-500 text-white"
                                            }`}
                                        >
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="text-sm text-gray-500 font-medium">
                                {filteredNotifications.length}{" "}
                                {filteredNotifications.length === 1
                                    ? "notification"
                                    : "notifications"}
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-3">
                        {filteredNotifications.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="w-20 h-20 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-10 h-10 text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {filter === "unread"
                                        ? "All caught up!"
                                        : "No notifications yet"}
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    {filter === "unread"
                                        ? "You've read all your notifications. Great job staying on top of things!"
                                        : "When you get notifications, they'll appear here"}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => {
                                const { title, description } =
                                    enhanceMessage(notification);
                                const category = getNotificationCategory(
                                    notification.type
                                );
                                const icon = getNotificationIcon(
                                    notification.type,
                                    notification.data
                                );
                                const categoryColor =
                                    getCategoryColor(category);

                                const href =
                                    notification.data.link ||
                                    (notification.data.event_id
                                        ? `/events/${notification.data.event_id}`
                                        : "#");

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification,
                                                href
                                            )
                                        }
                                        className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border ${
                                            !notification.read_at
                                                ? "border-l-4 border-l-orange-500 border-t border-r border-b border-gray-200 bg-linear-to-r from-orange-50/30 to-transparent"
                                                : "border-gray-200 hover:border-orange-200"
                                        }`}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Icon */}
                                                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-orange-100 via-orange-50 to-red-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                                                    {icon}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition-colors">
                                                                {title}
                                                            </h3>
                                                            {!notification.read_at && (
                                                                <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 animate-pulse"></span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 whitespace-nowrap font-medium bg-gray-50 px-2 py-1 rounded-md">
                                                            {formatRelativeTime(
                                                                notification.created_at
                                                            )}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${categoryColor} mb-2`}
                                                    >
                                                        {category}
                                                    </span>

                                                    <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                                        {description}
                                                    </p>

                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatFullDateTime(
                                                            notification.created_at
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
