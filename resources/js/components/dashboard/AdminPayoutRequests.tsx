import {
    CheckCircle,
    XCircle,
    Eye,
    DollarSign,
    Clock,
    User,
} from "lucide-react";

interface PayoutRequest {
    id: string;
    merchant: {
        user: {
            full_name: string;
            email: string;
        };
    };
    net_amount_in_rm: number;
    gross_amount_in_rm: number;
    platform_fee_in_rm: number;
    total_bookings: number;
    available_at: string;
    calculated_at: string;
    status: string;
}

interface PayoutRequestsProps {
    requests: PayoutRequest[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onViewDetails: (id: string) => void;
}

export const AdminPayoutRequests: React.FC<PayoutRequestsProps> = ({
    requests,
    onApprove,
    onReject,
    onViewDetails,
}) => {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <DollarSign className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Payout Requests
                            </h2>
                            <p className="text-sm text-gray-500">
                                {requests.length} pending requests
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => onViewDetails("")}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all text-sm hover:scale-105"
                    >
                        View All Payouts
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                {requests.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Merchant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Gross Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Platform Fee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Net Payout
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Bookings
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Requested
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <User
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {
                                                        request.merchant.user
                                                            .full_name
                                                    }
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {
                                                        request.merchant.user
                                                            .email
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">
                                            RM{" "}
                                            {request.gross_amount_in_rm.toFixed(
                                                2
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-orange-600">
                                            -RM{" "}
                                            {request.platform_fee_in_rm.toFixed(
                                                2
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-green-600 text-lg">
                                            RM{" "}
                                            {request.net_amount_in_rm.toFixed(
                                                2
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            <Clock size={14} />
                                            {request.total_bookings}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">
                                            {formatDate(request.available_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    onViewDetails(request.id)
                                                }
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onApprove(request.id)
                                                }
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onReject(request.id)
                                                }
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center">
                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="text-gray-400" size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            No Pending Requests
                        </h3>
                        <p className="text-gray-600 text-sm">
                            All payout requests have been processed
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPayoutRequests;
