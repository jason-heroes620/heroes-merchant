import { useForm } from "@inertiajs/react";
import { Loader2, User, Lock, Building2 } from "lucide-react";
import FormField from "../../components/UserBaseForm";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface BaseForm {
    full_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    contact_number: string;
    street_name?: string;
    postcode?: number;
    city?: string;
    state?: string;
    country?: string;
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
        street_name: undefined,
        postcode: undefined,
        city: undefined,
        state: undefined,
        country: undefined,
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
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-linear-to-r from-orange-500 to-orange-600 px-8 py-6">
                            <h1 className="text-3xl font-bold text-white">
                                {title}
                            </h1>
                            <p className="text-orange-100 mt-1">{subtitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Personal Information */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                                    <div className="bg-linear-to-br from-orange-100 to-red-100 p-3 rounded-xl">
                                        <User
                                            className="text-orange-600"
                                            size={24}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Personal Information
                                    </h3>
                                </div>

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
                                        label="Street Address"
                                        value={data.street_name || ""}
                                        onChange={(e) =>
                                            setData(
                                                "street_name",
                                                e.target.value
                                            )
                                        }
                                        autoComplete="address-line1"
                                        error={errors.street_name}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Postcode"
                                        value={data.postcode?.toString() || ""}
                                        onChange={(e) =>
                                            setData(
                                                "postcode",
                                                e.target.value === ""
                                                    ? undefined
                                                    : Number(e.target.value)
                                            )
                                        }
                                        autoComplete="postal-code"
                                        error={errors.postcode}
                                        disabled={processing}
                                    />

                                    <FormField
                                        label="City"
                                        value={data.city || ""}
                                        onChange={(e) =>
                                            setData("city", e.target.value)
                                        }
                                        autoComplete="address-level2"
                                        error={errors.city}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="State/Province"
                                        value={data.state || ""}
                                        onChange={(e) =>
                                            setData("state", e.target.value)
                                        }
                                        autoComplete="address-level1"
                                        error={errors.state}
                                        disabled={processing}
                                    />
                                    <FormField
                                        label="Country"
                                        value={data.country || ""}
                                        onChange={(e) =>
                                            setData("country", e.target.value)
                                        }
                                        autoComplete="country"
                                        error={errors.country}
                                        disabled={processing}
                                    />
                                </div>
                            </div>

                            {/* Security */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                                    <div className="bg-linear-to-br from-purple-100 to-purple-100 p-3 rounded-xl">
                                        <Lock
                                            className="text-purple-600"
                                            size={24}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        Security
                                    </h3>
                                </div>
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
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                                        <div className="bg-linear-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                                            <Building2
                                                className="text-green-600"
                                                size={24}
                                            />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Business Information
                                        </h3>
                                    </div>

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
                                                setData(
                                                    "device_id",
                                                    e.target.value
                                                )
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
        </AuthenticatedLayout>
    );
}
