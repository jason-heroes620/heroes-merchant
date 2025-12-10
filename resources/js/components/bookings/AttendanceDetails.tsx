import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { BookingAttendance, Attendance } from "../../types/events";

type Props = {
    attendance?: BookingAttendance;
};

const AttendanceDetails: React.FC<Props> = ({ attendance }) => {
    if (!attendance || !attendance.list || attendance.list.length === 0) {
        return (
            <div className="space-y-3">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Attendance
                </div>
                <div className="text-xs text-gray-500 italic">
                    No attendance recorded yet
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "attended":
                return "text-green-600 bg-green-50 border-green-200";
            case "pending":
                return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "absent":
                return "text-red-600 bg-red-50 border-red-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "attended":
                return <CheckCircle size={14} className="text-green-600" />;
            case "absent":
                return <XCircle size={14} className="text-red-600" />;
            default:
                return <Clock size={14} className="text-yellow-600" />;
        }
    };

    return (
        <div className="space-y-3">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Attendance
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-lg font-bold text-green-600">
                        {attendance.summary.attended}
                    </div>
                    <div className="text-xs text-gray-600">Attended</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-lg font-bold text-yellow-600">
                        {attendance.summary.pending}
                    </div>
                    <div className="text-xs text-gray-600">Pending</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-lg font-bold text-red-600">
                        {attendance.summary.absent}
                    </div>
                    <div className="text-xs text-gray-600">Absent</div>
                </div>
            </div>

            {/* Attendance List */}
            <div className="space-y-2">
                {attendance.list.map((a: Attendance) => (
                    <div
                        key={a.id}
                        className={`rounded-lg p-2.5 border ${getStatusColor(
                            a.status
                        )}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon(a.status)}
                                <span className="text-xs font-semibold capitalize">
                                    {a.status}
                                </span>
                            </div>
                            {a.scanned_at && (
                                <span className="text-xs text-gray-500">
                                    {a.scanned_at}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttendanceDetails;
