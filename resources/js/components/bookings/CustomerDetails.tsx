import { Phone, Mail, User } from "lucide-react";
import type { Booking } from "../../types/events";

type Props = {
    customer: Booking["customer"];
    compact?: boolean;
};

const CustomerDetails: React.FC<Props> = ({ customer, compact = false }) => {
    if (!customer) return null;

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {customer.profile_picture ? (
                    <img
                        src={`/storage/${customer.profile_picture}`}
                        alt={customer.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <User size={14} className="text-orange-600" />
                    </div>
                )}
                <div>
                    <div className="text-xs font-semibold text-gray-900 leading-tight">
                        {customer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                        {customer.email}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Customer
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                {customer.profile_picture ? (
                    <img
                        src={`/storage/${customer.profile_picture}`}
                        alt={customer.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-200"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <User size={20} className="text-orange-600" />
                    </div>
                )}
                <div className="font-semibold text-gray-900 text-sm">
                    {customer.name}
                </div>
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700 truncate">
                        {customer.email}
                    </span>
                </div>
                <a
                    href={`mailto:${customer.email}`}
                    className="p-1.5 bg-white hover:bg-orange-50 rounded-md transition-colors shrink-0 border border-gray-200"
                    title="Send email"
                >
                    <Mail size={12} className="text-orange-600" />
                </a>
            </div>

            {/* Phone */}
            {customer.phone && (
                <div className="bg-gray-50 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-700 truncate">
                            {customer.phone}
                        </span>
                    </div>
                    <a
                        href={`tel:${customer.phone}`}
                        className="p-1.5 bg-white hover:bg-orange-50 rounded-md transition-colors shrink-0 border border-gray-200"
                        title="Call customer"
                    >
                        <Phone size={12} className="text-orange-600" />
                    </a>
                </div>
            )}
        </div>
    );
};

export default CustomerDetails;
