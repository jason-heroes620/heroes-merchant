import React from "react";
import { CreditCard, Clock } from "lucide-react";

interface Props {
    availablePayouts: number;
    pendingPayouts: number;
    onRequestPayout: () => void;
}

const MerchantPayoutSection: React.FC<Props> = ({
    availablePayouts,
    pendingPayouts,
    onRequestPayout,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Available to Claim */}
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
                onClick={onRequestPayout}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="bg-yellow-100 p-3 rounded-lg mb-4 group-hover:bg-yellow-200 transition-colors">
                        <CreditCard className="text-yellow-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Available to Claim
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                          RM {(availablePayouts ?? 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Ready for payout</p>
                </div>
            </div>

            {/* Pending Payouts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-lg mb-4">
                        <Clock className="text-blue-600" size={24} />
                    </div>
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Pending Payouts
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                        RM {(pendingPayouts ?? 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Processing</p>
                </div>
            </div>
        </div>
    );
};

export default MerchantPayoutSection;
