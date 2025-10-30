import { User, Loader2 } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import InputField from "../ui/InputField";

interface Props {
  data: any;
  setData: (key: string, value: any) => void;
  errors: Record<string, string>;
  processing: boolean;
}

export default function PersonalInfoSection({ data, setData, errors, processing }: Props) {
  return (
    <div className="space-y-6">
      <SectionTitle title="Personal Information" icon={<User className="text-orange-600" size={20} />} />
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
          label="Address"
          value={data.address}
          onChange={(e) => setData("address", e.target.value)}
          placeholder="Enter your address"
          error={errors.address}
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={processing}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
            processing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
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
