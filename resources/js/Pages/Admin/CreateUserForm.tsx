import { useForm } from "@inertiajs/react";
import { Loader2 } from "lucide-react";
import FormField from "../../components/UserBaseForm";

interface BaseForm {
    full_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    contact_number: string;
    address: string;
}

interface MerchantFields {
    company_name: string;
    business_registration_number: string;
    company_details: string;
}

interface CustomerFields {
    date_of_birth: string;
    device_id: string;
    referrer_code: string;
}

type UserForm = BaseForm & Partial<MerchantFields & CustomerFields>;

interface Props {
    type: "merchant" | "customer";
}

export default function CreateUserForm({ type }: Props) {
    const { data, setData, post, processing, errors } = useForm<UserForm>({
        full_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        contact_number: "",
        address: "",
        ...(type === "merchant"
            ? {
                  company_name: "",
                  business_registration_number: "",
                  company_details: "",
              }
            : {
                  date_of_birth: "",
                  device_id: "",
                  referrer_code: "",
              }),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(
            route(
                type === "merchant"
                    ? "admin.merchants.store"
                    : "admin.customers.store"
            )
        );
    };

    const title =
        type === "merchant" ? "Create New Merchant" : "Create New Customer";
    const subtitle =
        type === "merchant"
            ? "Add a new merchant to the platform"
            : "Add a new customer to the platform";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white">
                            {title}
                        </h1>
                        <p className="text-orange-100 mt-1">{subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Personal Information */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Personal Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    label="Full Name"
                                    value={data.full_name}
                                    onChange={(e) =>
                                        setData("full_name", e.target.value)
                                    }
                                    error={errors.full_name}
                                    disabled={processing}
                                />
                                <FormField
                                    label="Email Address"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    error={errors.email}
                                    disabled={processing}
                                />
                                <FormField
                                    label="Contact Number"
                                    type="tel"
                                    value={data.contact_number}
                                    onChange={(e) =>
                                        setData(
                                            "contact_number",
                                            e.target.value
                                        )
                                    }
                                    error={errors.contact_number}
                                    disabled={processing}
                                />
                                <FormField
                                    label="Address"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData("address", e.target.value)
                                    }
                                    error={errors.address}
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        {/* Security */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                Security
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <FormField
                                    label="Password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    error={errors.password}
                                    disabled={processing}
                                />
                                <FormField
                                    label="Confirm Password"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    error={errors.password_confirmation}
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        {/* Conditional Section */}
                        {type === "merchant" ? (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Business Information
                                </h2>
                                <div className="space-y-6">
                                    <FormField
                                        label="Company Name"
                                        value={data.company_name || ""}
                                        onChange={(e) =>
                                            setData(
                                                "company_name",
                                                e.target.value
                                            )
                                        }
                                        error={errors.company_name}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Business Registration Number"
                                        value={
                                            data.business_registration_number ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setData(
                                                "business_registration_number",
                                                e.target.value
                                            )
                                        }
                                        error={
                                            errors.business_registration_number
                                        }
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Company Details"
                                        type="textarea"
                                        rows={4}
                                        value={data.company_details || ""}
                                        onChange={(e) =>
                                            setData(
                                                "company_details",
                                                e.target.value
                                            )
                                        }
                                        error={errors.company_details}
                                        disabled={processing}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                    Customer Details
                                </h2>
                                <div className="space-y-6">
                                    <FormField
                                        label="Date of Birth"
                                        type="date"
                                        value={data.date_of_birth || ""}
                                        onChange={(e) =>
                                            setData(
                                                "date_of_birth",
                                                e.target.value
                                            )
                                        }
                                        error={errors.date_of_birth}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Device ID"
                                        value={data.device_id || ""}
                                        onChange={(e) =>
                                            setData("device_id", e.target.value)
                                        }
                                        error={errors.device_id}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Referred By (Referrer Code)"
                                        value={data.referrer_code || ""}
                                        onChange={(e) =>
                                            setData(
                                                "referrer_code",
                                                e.target.value
                                            )
                                        }
                                        error={errors.referrer_code}
                                        disabled={processing}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                                    processing
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg"
                                }`}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2
                                            className="animate-spin"
                                            size={20}
                                        />
                                        {type === "merchant"
                                            ? "Creating Merchant..."
                                            : "Creating Customer..."}
                                    </span>
                                ) : type === "merchant" ? (
                                    "Create Merchant"
                                ) : (
                                    "Create Customer"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
