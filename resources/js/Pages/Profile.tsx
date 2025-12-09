import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import {
    User,
    Lock,
    Loader2,
    Upload,
    Building2,
    Pencil,
    Mail,
    Phone,
    MapPin,
    Globe,
} from "lucide-react";
import { toast } from "react-hot-toast";
import type { User as UserType } from "../types/index";
import AuthenticatedLayout from "../AuthenticatedLayout";
import TextAreaField from "@/components/ui/TextAreaField";
import InputField from "@/components/ui/InputField";

const Profile: React.FC<{ user: UserType }> = ({ user }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "password">(
        "profile"
    );
    const [isEditingMerchant, setIsEditingMerchant] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        full_name: user.full_name,
        email: user.email,
        contact_number: user.contact_number || "",
        street_name: user.street_name || "",
        postcode: user.postcode || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        profile_picture: null as File | null,
        company_name: user.merchant?.company_name || "",
        business_registration_number:
            user.merchant?.business_registration_number || "",
        company_details: user.merchant?.company_details || "",
    });

    const {
        data: pwData,
        setData: setPwData,
        post: postPassword,
        processing: pwProcessing,
        errors: pwErrors,
        reset: resetPassword,
    } = useForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/profile/update", {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setPreview(null);
                setIsEditingMerchant(false);
                toast.success("Profile updated successfully!");
            },
            onError: () =>
                toast.error(
                    "Failed to update profile. Please check your input."
                ),
        });
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        postPassword("/profile/change-password", {
            onSuccess: () => {
                resetPassword();
                toast.success("Password updated successfully!");
            },
            onError: () =>
                toast.error("Failed to update password. Please try again."),
        });
    };

    const tabs = [
        { key: "profile", label: "Profile Information", icon: User },
        { key: "password", label: "Change Password", icon: Lock },
    ];

    const handleFileChange = (file: File | null) => {
        setData("profile_picture", file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50/20">
                <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 text-white shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                    <User size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold mb-1">
                                        My Profile
                                    </h1>
                                    <p className="text-orange-100">
                                        Welcome back! Here's your business
                                        overview
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="flex border-b border-gray-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() =>
                                        setActiveTab(
                                            tab.key as "profile" | "password"
                                        )
                                    }
                                    className={`flex-1 py-4 px-6 font-medium transition-all flex items-center justify-center gap-2 ${
                                        activeTab === tab.key
                                            ? "text-orange-600 bg-linear-to-r from-orange-50 to-red-50 border-b-3 border-orange-500"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                                >
                                    <tab.icon size={20} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === "profile" ? (
                        <div className="space-y-6">
                            {/* Profile Picture */}
                            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
                                <div className="relative group mb-4">
                                    <div className="absolute -inset-2 bg-linear-to-r from-orange-500 to-red-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition duration-300"></div>
                                    <img
                                        src={
                                            preview ||
                                            (user.profile_picture
                                                ? `/storage/${user.profile_picture}`
                                                : "/default-avatar.png")
                                        }
                                        alt="Profile"
                                        className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl"
                                    />
                                </div>
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 transform">
                                    <Upload className="w-5 h-5" />
                                    Upload New Photo
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                            handleFileChange(
                                                e.target.files?.[0] || null
                                            )
                                        }
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-3">
                                    JPG, PNG or GIF
                                </p>
                                {errors.profile_picture && (
                                    <p className="text-red-600 text-sm mt-2">
                                        {errors.profile_picture}
                                    </p>
                                )}
                            </div>

                            {/* Personal Info */}
                            <div className="bg-white rounded-2xl shadow-xl p-8">
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
                                    <InputField
                                        label="Full Name"
                                        value={data.full_name}
                                        icon={User}
                                        disabled
                                    />
                                    <InputField
                                        label="Email Address"
                                        value={data.email}
                                        icon={Mail}
                                        disabled
                                    />
                                    <InputField
                                        label="Contact Number"
                                        value={data.contact_number}
                                        icon={Phone}
                                        onChange={(val) =>
                                            setData("contact_number", val)
                                        }
                                        error={errors.contact_number}
                                        placeholder="Enter your contact number"
                                    />
                                    <InputField
                                        label="Street Address"
                                        value={data.street_name}
                                        icon={MapPin}
                                        onChange={(val) =>
                                            setData("street_name", val)
                                        }
                                        error={errors.street_name}
                                        placeholder="Street Address"
                                        autoComplete="address-line1"
                                    />
                                    <InputField
                                        label="Postcode"
                                        value={String(data.postcode)}
                                        onChange={(val) =>
                                            setData("postcode", val)
                                        }
                                        error={errors.postcode}
                                        placeholder="Enter your postal code"
                                        autoComplete="postal-code"
                                    />
                                    <InputField
                                        label="City"
                                        value={data.city}
                                        onChange={(val) => setData("city", val)}
                                        error={errors.city}
                                        placeholder="City"
                                        autoComplete="address-level2"
                                    />
                                    <InputField
                                        label="State/Province"
                                        value={data.state}
                                        onChange={(val) =>
                                            setData("state", val)
                                        }
                                        error={errors.state}
                                        placeholder="State"
                                        autoComplete="address-level1"
                                    />
                                    <InputField
                                        label="Country"
                                        value={data.country}
                                        icon={Globe}
                                        onChange={(val) =>
                                            setData("country", val)
                                        }
                                        error={errors.country}
                                        placeholder="Country"
                                        autoComplete="country"
                                    />
                                </div>

                                <div className="mt-8 pt-6 border-t-2 border-gray-100">
                                    <button
                                        onClick={handleProfileSubmit}
                                        disabled={processing}
                                        className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
                                            processing
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 hover:shadow-xl hover:scale-[1.02] transform"
                                        }`}
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2
                                                    className="animate-spin"
                                                    size={20}
                                                />
                                                Saving Changes...
                                            </span>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Business Info */}
                            {user.role === "merchant" && user.merchant && (
                                <div className="bg-white rounded-2xl shadow-xl p-8">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-linear-to-br from-green-100 to-emerald-100 p-3 rounded-xl">
                                                <Building2
                                                    className="text-green-600"
                                                    size={24}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    Business Information
                                                </h3>
                                                {user.merchant
                                                    .business_status && (
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 mt-1 ${
                                                            user.merchant
                                                                .business_status ===
                                                            "verified"
                                                                ? "bg-green-100 text-green-800 border-green-200"
                                                                : user.merchant
                                                                      .business_status ===
                                                                  "rejected"
                                                                ? "bg-red-100 text-red-800 border-red-200"
                                                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                        }`}
                                                    >
                                                        {user.merchant.business_status
                                                            ?.replace("_", " ")
                                                            .toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!isEditingMerchant &&
                                            user.merchant.business_status !==
                                                "pending_verification" && (
                                                <button
                                                    onClick={() =>
                                                        setIsEditingMerchant(
                                                            true
                                                        )
                                                    }
                                                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold px-4 py-2 rounded-xl hover:bg-orange-50 transition-all"
                                                >
                                                    <Pencil size={18} />
                                                    Edit
                                                </button>
                                            )}
                                    </div>

                                    <div className="space-y-6">
                                        <InputField
                                            label="Company Name"
                                            value={data.company_name}
                                            onChange={(val) =>
                                                setData("company_name", val)
                                            }
                                            disabled={!isEditingMerchant}
                                            error={errors.company_name}
                                        />
                                        <InputField
                                            label="Business Registration Number"
                                            value={
                                                data.business_registration_number
                                            }
                                            onChange={(val) =>
                                                setData(
                                                    "business_registration_number",
                                                    val
                                                )
                                            }
                                            disabled={!isEditingMerchant}
                                            placeholder="Enter business registration number"
                                            error={
                                                errors.business_registration_number
                                            }
                                        />
                                        <TextAreaField
                                            label="Company Details"
                                            value={data.company_details}
                                            onChange={(val) =>
                                                setData("company_details", val)
                                            }
                                            disabled={!isEditingMerchant}
                                            placeholder="Enter your company information"
                                            error={errors.company_details}
                                        />

                                        {isEditingMerchant && (
                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    onClick={
                                                        handleProfileSubmit
                                                    }
                                                    className="flex-1 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsEditingMerchant(
                                                            false
                                                        );
                                                        setData(
                                                            "company_name",
                                                            user.merchant
                                                                ?.company_name ||
                                                                ""
                                                        );
                                                        setData(
                                                            "business_registration_number",
                                                            user.merchant
                                                                ?.business_registration_number ||
                                                                ""
                                                        );
                                                        setData(
                                                            "company_details",
                                                            user.merchant
                                                                ?.company_details ||
                                                                ""
                                                        );
                                                    }}
                                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto space-y-6">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-orange-100">
                                <div className="bg-linear-to-br from-orange-100 to-red-100 p-3 rounded-xl">
                                    <Lock
                                        className="text-orange-600"
                                        size={24}
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Update Your Password
                                </h3>
                            </div>

                            <InputField
                                label="Current Password"
                                value={pwData.current_password}
                                onChange={(val) =>
                                    setPwData("current_password", val)
                                }
                                placeholder="Enter current password"
                                type="password"
                                error={pwErrors.current_password}
                            />
                            <InputField
                                label="New Password"
                                value={pwData.new_password}
                                onChange={(val) =>
                                    setPwData("new_password", val)
                                }
                                placeholder="Enter new password (minimum 8 characters)"
                                type="password"
                                error={pwErrors.new_password}
                            />
                            <InputField
                                label="Confirm New Password"
                                value={pwData.new_password_confirmation}
                                onChange={(val) =>
                                    setPwData("new_password_confirmation", val)
                                }
                                placeholder="Confirm new password"
                                type="password"
                            />

                            <button
                                onClick={handlePasswordChange}
                                disabled={pwProcessing}
                                className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
                                    pwProcessing
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 hover:shadow-xl hover:scale-[1.02] transform"
                                }`}
                            >
                                {pwProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2
                                            className="animate-spin"
                                            size={20}
                                        />
                                        Updating Password...
                                    </span>
                                ) : (
                                    "Update Password"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Profile;
