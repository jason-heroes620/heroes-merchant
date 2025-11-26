import { AlertCircle, CheckCircle, XCircle, Loader, Clock } from "lucide-react";
import type { Event } from "../../../types/events";

const StatusBadge: React.FC<{ status: Event["status"] }> = ({ status }) => {
    const getStatusIcon = (status: Event["status"]) => {
        const icons = {
            draft: Loader,
            pending: Clock,
            active: CheckCircle,
            inactive: XCircle,
            rejected: AlertCircle,
        };
        return icons[status];
    };

    const StatusIcon = getStatusIcon(status);

    const getStatusColor = (status: Event["status"]) => {
        const colors = {
            draft: "bg-gray-100 text-gray-700",
            pending: "bg-yellow-100 text-yellow-700",
            active: "bg-green-100 text-green-700",
            inactive: "bg-gray-100 text-gray-500",
            rejected: "bg-red-100 text-red-700",
        };
        return colors[status];
    };

    return (
        <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(
                status
            )} font-medium text-sm`}
        >
            <StatusIcon className="w-4 h-4" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
    );
};

export default StatusBadge;
