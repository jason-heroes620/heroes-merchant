import React, { useState } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import FilterButton from "../../components/dashboard/FilterButton";

interface ChartDataPoint {
    date: string;
    count?: number;
    amount?: number;
}

interface ChartsProps {
    charts: {
        bookingsOverTime: ChartDataPoint[];
        purchasesOverTime: ChartDataPoint[];
        payoutTrend: ChartDataPoint[];
    };
}

export const AdminChartsSection: React.FC<ChartsProps> = ({ charts }) => {
    const [activeChart, setActiveChart] = useState<
        "bookings" | "purchases" | "payouts"
    >("bookings");

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const formatCurrency = (value: number) => {
        return `RM ${value.toFixed(2)}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <TrendingUp className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Platform Analytics
                            </h2>
                            <p className="text-sm text-gray-500">
                                Last 30 days performance
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <FilterButton
                            active={activeChart === "bookings"}
                            onClick={() => setActiveChart("bookings")}
                        >
                            <Calendar size={14} className="mr-1" />
                            Bookings
                        </FilterButton>
                        <FilterButton
                            active={activeChart === "purchases"}
                            onClick={() => setActiveChart("purchases")}
                        >
                            <DollarSign size={14} className="mr-1" />
                            Purchases
                        </FilterButton>
                        <FilterButton
                            active={activeChart === "payouts"}
                            onClick={() => setActiveChart("payouts")}
                        >
                            <TrendingUp size={14} className="mr-1" />
                            Payouts
                        </FilterButton>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <ResponsiveContainer width="100%" height={350}>
                    {activeChart === "bookings" && (
                        <BarChart data={charts.bookingsOverTime}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#888"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis stroke="#888" style={{ fontSize: "12px" }} />
                            <Tooltip
                                labelFormatter={formatDate}
                                formatter={(value: any) => [value, "Bookings"]}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="count"
                                fill="#8b5cf6"
                                radius={[8, 8, 0, 0]}
                                name="Bookings"
                            />
                        </BarChart>
                    )}

                    {activeChart === "purchases" && (
                        <LineChart data={charts.purchasesOverTime}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#888"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis stroke="#888" style={{ fontSize: "12px" }} />
                            <Tooltip
                                labelFormatter={formatDate}
                                formatter={(value: any) => [
                                    formatCurrency(value),
                                    "Amount",
                                ]}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: "#10b981", r: 4 }}
                                name="Purchase Amount (RM)"
                            />
                        </LineChart>
                    )}

                    {activeChart === "payouts" && (
                        <LineChart data={charts.payoutTrend}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#888"
                                style={{ fontSize: "12px" }}
                            />
                            <YAxis stroke="#888" style={{ fontSize: "12px" }} />
                            <Tooltip
                                labelFormatter={formatDate}
                                formatter={(value: any) => [
                                    formatCurrency(value),
                                    "Amount",
                                ]}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={{ fill: "#f59e0b", r: 4 }}
                                name="Payout Amount (RM)"
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AdminChartsSection;
