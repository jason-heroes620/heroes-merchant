import type { User } from "../../types";
import { Building2, Pencil } from "lucide-react";
import InputField from "../ui/InputField";
import TextAreaField from "../ui/TextAreaField";

export default function MerchantSection ({
    user,
    data,
    setData,
    errors,
    isEditing,
    setIsEditing,
}: {
    user: User;
    data: any;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
}) {
    const merchant = user.merchant!;
    const isPending = merchant.business_status === "pending_verification";

    return (
        <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Building2 className="text-orange-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                    {merchant.business_status && (
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                merchant.business_status === "verified"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : merchant.business_status === "rejected"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                        >
                            {merchant.business_status
                                ?.replace("_", " ")
                                .toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="flex items-center">
                    {!isEditing && !isPending && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <InputField
                    label="Company Name"
                    value={data.company_name}
                    onChange={(e) => setData("company_name", e.target.value)}
                    disabled={!isEditing}
                    error={errors.company_name}
                />
                <InputField
                    label="Business Registration Number"
                    value={data.business_registration_number}
                    onChange={(e) =>
                        setData("business_registration_number", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="Enter business registration number"
                    error={errors.business_registration_number}
                />
                <TextAreaField
                    label="Company Details"
                    value={data.company_details}
                    onChange={(e) => setData("company_details", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your company information"
                    error={errors.company_details}
                    rows={4}
                />

                {isEditing && (
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                            Save Changes
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                setData(
                                    "company_name",
                                    merchant.company_name || ""
                                );
                                setData(
                                    "business_registration_number",
                                    merchant.business_registration_number || ""
                                );
                                setData(
                                    "company_details",
                                    merchant.company_details || ""
                                );
                            }}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};