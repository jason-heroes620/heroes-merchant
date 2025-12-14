import { router } from "@inertiajs/react";
import { useState } from "react";
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Gift,
    ShoppingBag,
    CreditCard,
    ArrowDownCircle,
    ArrowUpCircle,
    Bell,
} from "lucide-react";

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
                    <ArrowUpCircle className={`${iconClass} text-green-600`} />
                ) : (
                    <ArrowDownCircle
                        className={`${iconClass} text-orange-600`}
                    />
                );
            }
            if (data.type === "purchase")
                return <ShoppingBag className={`${iconClass} text-blue-600`} />;
            if (data.type === "bonus")
                return <Gift className={`${iconClass} text-purple-600`} />;
            return <CreditCard className={`${iconClass} text-gray-600`} />;
        }
        if (type.includes("Event")) {
            if (data.status === "active")
                return (
                    <CheckCircle className={`${iconClass} text-green-600`} />
                );
            if (data.status === "rejected")
                return <XCircle className={`${iconClass} text-red-600`} />;
            if (data.status === "pending")
                return <Clock className={`${iconClass} text-yellow-600`} />;
            return <FileText className={`${iconClass} text-blue-600`} />;
        }
        if (type.includes("Booking")) {
            if (data.status === "confirmed")
                return (
                    <CheckCircle className={`${iconClass} text-green-600`} />
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
            Wallet: "bg-green-100 text-green-700",
            Events: "bg-blue-100 text-blue-700",
            Bookings: "bg-purple-100 text-purple-700",
            System: "bg-gray-100 text-gray-700",
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
            if (data.type === "bonus") {
                return {
                    title: "Bonus Credits Received",
                    description: data.message,
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
        <div className="min-h-screen bg-gray-50">
            <div className="bg-linear-to-r from-orange-500 to-red-500 text-white p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                    <p className="text-orange-100">
                        Stay updated with your latest activities
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                filter === "all"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            All Notifications
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                filter === "unread"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Unread
                            {unreadCount > 0 && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        filter === "unread"
                                            ? "bg-white text-orange-500"
                                            : "bg-orange-500 text-white"
                                    }`}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">
                        {filteredNotifications.length}{" "}
                        {filteredNotifications.length === 1
                            ? "notification"
                            : "notifications"}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                {filter === "unread"
                                    ? "All caught up!"
                                    : "No notifications yet"}
                            </h3>
                            <p className="text-gray-500">
                                {filter === "unread"
                                    ? "You've read all your notifications"
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
                            const categoryColor = getCategoryColor(category);

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
                                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                                        !notification.read_at
                                            ? "border-l-4 border-orange-500"
                                            : ""
                                    }`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="shrink-0 w-12 h-12 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                                                {icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {title}
                                                        </h3>
                                                        {!notification.read_at && (
                                                            <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0"></span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                                        {formatRelativeTime(
                                                            notification.created_at
                                                        )}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categoryColor} mb-2`}
                                                >
                                                    {category}
                                                </span>

                                                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                                    {description}
                                                </p>

                                                <p className="text-xs text-gray-400">
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
    );
}
