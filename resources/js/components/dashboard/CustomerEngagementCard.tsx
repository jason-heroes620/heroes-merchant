import React from "react";
import { Users, UserCheck, BarChart } from "lucide-react";

interface CustomerStats {
    totalCustomers: number;
    activeCustomers: number;
    averageBookingsPerCustomer: number;
}

interface Props {
    stats: CustomerStats;
    onViewCustomers: () => void;
}

export const CustomerEngagementCard: React.FC<Props> = ({
    stats,
    onViewCustomers,
}) => {
    const engagementRate =
        stats.totalCustomers > 0
            ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1)
            : 0;

    return (
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">
                            Customer Engagement
                        </h3>
                        <p className="text-blue-100 text-sm">
                            Platform activity metrics
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-1 text-blue-100 text-sm mb-1">
                        <Users size={14} />
                        <span>Total</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {stats.totalCustomers.toLocaleString()}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1 text-blue-100 text-sm mb-1">
                        <UserCheck size={14} />
                        <span>Active</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {stats.activeCustomers.toLocaleString()}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-1 text-blue-100 text-sm mb-1">
                        <BarChart size={14} />
                        <span>Avg. Bookings</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {stats.averageBookingsPerCustomer.toFixed(1)}
                    </div>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                        Engagement Rate
                    </span>
                    <span className="text-lg font-bold">{engagementRate}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${engagementRate}%` }}
                    />
                </div>
            </div>

            <button
                onClick={onViewCustomers}
                className="w-full bg-white text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
                View All Customers
            </button>
        </div>
    );
};

export default CustomerEngagementCard;
