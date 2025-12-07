import React from "react";
import { Activity, CheckCircle, Clock, User } from "lucide-react";

type ActivityType =
    | "event_pending"
    | "event_active"
    | "event_inactive"
    | "event_rejected"
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_refunded"
    | "payout_requested";

interface ActivityItem {
    type: ActivityType;
    data: any;
    timestamp: string;
}

interface Props {
    activities: ActivityItem[];
    onActivityClick: (activity: ActivityItem) => void;
}

export const RecentActivityFeed: React.FC<Props> = ({
    activities,
    onActivityClick,
}) => {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const getActivityContent = (activity: ActivityItem) => {
        switch (activity.type) {
            case "event_pending":
            case "event_active":
            case "event_inactive":
            case "event_rejected":
                return {
                    icon: <Clock className="text-yellow-600" size={18} />,
                    bgColor: "bg-yellow-100",
                    title: `Event ${activity.type.split("_")[1]}`, 
                    description: activity.data.title,
                    subtitle: `By ${
                        activity.data.merchant?.user?.full_name || "Merchant"
                    }`,
                };

            // BOOKING TYPES
            case "booking_confirmed":
                return {
                    icon: <CheckCircle className="text-green-600" size={18} />,
                    bgColor: "bg-green-100",
                    title: "Booking Confirmed",
                    description: activity.data.event?.title,
                    subtitle: `By ${activity.data.customer?.user?.full_name}`,
                };

            case "booking_cancelled":
                return {
                    icon: <Activity className="text-red-600" size={18} />,
                    bgColor: "bg-red-100",
                    title: "Booking Cancelled",
                    description: activity.data.event?.title,
                    subtitle: `By ${activity.data.customer?.user?.full_name}`,
                };

            case "booking_refunded":
                return {
                    icon: <Activity className="text-blue-600" size={18} />,
                    bgColor: "bg-blue-100",
                    title: "Booking Refunded",
                    description: activity.data.event?.title,
                    subtitle: `By ${activity.data.customer?.user?.full_name}`,
                };

            case "payout_requested":
                return {
                    icon: <User className="text-blue-600" size={18} />,
                    bgColor: "bg-blue-100",
                    title: "Payout Requested",
                    description: `RM ${activity.data.net_amount_in_rm?.toFixed(
                        2
                    )}`,
                    subtitle: activity.data.merchant?.user?.full_name,
                };

            // FALLBACK
            default:
                return {
                    icon: <Activity className="text-gray-600" size={18} />,
                    bgColor: "bg-gray-100",
                    title: "Activity",
                    description: "Unknown activity",
                    subtitle: "",
                };
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <Activity className="text-purple-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Recent Activity
                        </h2>
                        <p className="text-sm text-gray-500">
                            Latest platform events
                        </p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {activities.length > 0 ? (
                    activities.map((activity, index) => {
                        const content = getActivityContent(activity);
                        console.log(content);

                        return (
                            <div
                                key={index}
                                onClick={() => onActivityClick(activity)}
                                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`${content.bgColor} p-2 rounded-lg shrink-0`}
                                    >
                                        {content.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 text-sm">
                                                    {content.title}
                                                </h4>
                                                <p className="text-sm text-gray-700 truncate">
                                                    {content.description}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {content.subtitle}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatTime(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-12 text-center">
                        <Activity
                            className="mx-auto text-gray-400 mb-3"
                            size={40}
                        />
                        <p className="text-gray-600">No recent activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivityFeed;
