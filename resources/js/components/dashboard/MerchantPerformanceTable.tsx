import React from "react";
import { Store, TrendingUp, Award } from "lucide-react";

interface MerchantStat {
    merchant_id: string;
    name: string;
    email: string;
    total_events: number;
    total_earned: number;
}

interface Props {
    merchants: MerchantStat[];
    onMerchantClick: (id: string) => void;
}

export const MerchantPerformanceTable: React.FC<Props> = ({
    merchants,
    onMerchantClick,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <Store className="text-green-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Top Merchants
                        </h2>
                        <p className="text-sm text-gray-500">
                            Highest earning merchants
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Rank
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Merchant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Events
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                Total Earned
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {merchants.map((merchant, index) => (
                            <tr
                                key={merchant.merchant_id}
                                onClick={() =>
                                    onMerchantClick(merchant.merchant_id)
                                }
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div
                                        className={`
                                        flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                        ${
                                            index === 0
                                                ? "bg-yellow-100 text-yellow-700"
                                                : ""
                                        }
                                        ${
                                            index === 1
                                                ? "bg-gray-200 text-gray-700"
                                                : ""
                                        }
                                        ${
                                            index === 2
                                                ? "bg-orange-100 text-orange-700"
                                                : ""
                                        }
                                        ${
                                            index > 2
                                                ? "bg-blue-50 text-blue-700"
                                                : ""
                                        }
                                    `}
                                    >
                                        {index === 0 && <Award size={16} />}
                                        {index !== 0 && `#${index + 1}`}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {merchant.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {merchant.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        {merchant.total_events}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 font-bold text-green-600 text-lg">
                                        <TrendingUp size={16} />
                                        RM {merchant.total_earned.toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MerchantPerformanceTable;
