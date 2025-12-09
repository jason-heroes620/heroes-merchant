import { User, Loader2 } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import InputField from "../ui/InputField";

interface Props {
    data: any;
    setData: (key: string, value: any) => void;
    errors: Record<string, string>;
    processing: boolean;
}

export default function PersonalInfoSection({
    data,
    setData,
    errors,
    processing,
}: Props) {
    return (
        <div className="space-y-6">
            <SectionTitle
                title="Personal Information"
                icon={<User className="text-orange-600" size={20} />}
            />
            <div className="grid md:grid-cols-2 gap-6">
                <InputField label="Full Name" value={data.full_name} disabled />
                <InputField label="Email Address" value={data.email} disabled />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <InputField
                    label="Contact Number"
                    type="tel"
                    value={data.contact_number}
                    onChange={(e) => setData("contact_number", e.target.value)}
                    placeholder="Enter your contact number"
                    error={errors.contact_number}
                />
                <InputField
                    label="Street Address"
                    value={data.street_name}
                    onChange={(e) => setData("street_name", e.target.value)}
                    placeholder="Street Address"
                    autoComplete="address-line1"
                    error={errors.street_name}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <InputField
                    label="Postcode"
                    value={data.postcode}
                    onChange={(e) => setData("postcode", e.target.value)}
                    placeholder="Enter your postal code"
                    autoComplete="postal-code"
                    error={errors.postcode}
                />
                <InputField
                    label="City"
                    value={data.city}
                    onChange={(e) => setData("city", e.target.value)}
                    placeholder="City"
                    autoComplete="address-level2"
                    error={errors.city}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <InputField
                    label="State/Province"
                    value={data.state}
                    onChange={(e) => setData("state", e.target.value)}
                    placeholder="State"
                    autoComplete="address-level1"
                    error={errors.state}
                />
                <InputField
                    label="Country"
                    value={data.country}
                    onChange={(e) => setData("country", e.target.value)}
                    placeholder="Country"
                    autoComplete="country"
                    error={errors.country}
                />
            </div>

            <div className="pt-4 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={processing}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                        processing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                    }`}
                >
                    {processing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Saving Changes...
                        </span>
                    ) : (
                        "Save Changes"
                    )}
                </button>
            </div>
        </div>
    );
}
