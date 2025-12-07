import React from "react";
import { FileCheck, DollarSign, Users, BarChart3 } from "lucide-react";

interface QuickActionsProps {
    pendingEvents: number;
    pendingPayouts: number;
    totalUsers: number;
    onReviewEvents: () => void;
    onProcessPayouts: () => void;
    onViewUsers: () => void;
    onViewReports: () => void;
}

export const AdminQuickActions: React.FC<QuickActionsProps> = ({
    pendingEvents,
    pendingPayouts,
    totalUsers,
    onReviewEvents,
    onProcessPayouts,
    onViewUsers,
    onViewReports,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
                onClick={onReviewEvents}
                className="bg-linear-to-br from-orange-500 to-red-500 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-orange-100 mb-2">
                            Action Required
                        </div>
                        <div className="text-xl font-bold mb-1">
                            Review Events
                        </div>
                        <div className="text-orange-100 text-sm">
                            {pendingEvents} pending approval
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <FileCheck size={28} />
                    </div>
                </div>
            </button>

            <button
                onClick={onProcessPayouts}
                className="bg-linear-to-br from-yellow-400 to-yellow-500 text-yellow-900 rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-yellow-800 mb-2">
                            Financial
                        </div>
                        <div className="text-xl font-bold mb-1">
                            Process Payouts
                        </div>
                        <div className="text-yellow-800 text-sm">
                            RM {pendingPayouts.toFixed(2)} pending
                        </div>
                    </div>
                    <div className="bg-white/30 p-3 rounded-lg group-hover:bg-white/40 transition-colors">
                        <DollarSign size={28} />
                    </div>
                </div>
            </button>

            <button
                onClick={onViewUsers}
                className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-blue-100 mb-2">
                            User Management
                        </div>
                        <div className="text-xl font-bold mb-1">
                            View All Users
                        </div>
                        <div className="text-blue-100 text-sm">
                            {totalUsers} recent signups
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <Users size={28} />
                    </div>
                </div>
            </button>

            <button
                onClick={onViewReports}
                className="bg-linear-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-sm p-6 hover:shadow-xl hover:scale-105 transition-all group"
            >
                <div className="flex items-center justify-between">
                    <div className="text-left">
                        <div className="text-sm font-semibold uppercase tracking-wide text-purple-100 mb-2">
                            Analytics
                        </div>
                        <div className="text-xl font-bold mb-1">
                            View Reports
                        </div>
                        <div className="text-purple-100 text-sm">
                            Platform insights
                        </div>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg group-hover:bg-white/30 transition-colors">
                        <BarChart3 size={28} />
                    </div>
                </div>
            </button>
        </div>
    );
};

export default AdminQuickActions;
