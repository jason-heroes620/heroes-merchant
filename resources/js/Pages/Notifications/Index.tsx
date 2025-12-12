import { Link } from "@inertiajs/react";

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
    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">Notifications</h1>
            <ul>
                {notifications.length === 0 && <li>No notifications yet.</li>}
                {notifications.map((n) => {
                    const href = n.data.event_id
                        ? `/events/${n.data.event_id}`
                        : "#";

                    return (
                        <li
                            key={n.id}
                            className={`p-2 mb-2 border rounded ${
                                n.read_at ? "bg-gray-100" : "bg-white"
                            }`}
                        >
                            <Link href={href} className="block">
                                <div className="font-semibold">
                                    {n.data.title ?? n.type}
                                </div>
                                <div className="text-sm">
                                    {n.data.message ?? ""}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(n.created_at).toLocaleString()}
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
