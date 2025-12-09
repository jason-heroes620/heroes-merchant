import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { User, Lock, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import ProfileImageUploader from "../components/ui/ProfileImageUploader";
import SectionTitle from "../components/ui/SectionTitle";
import InputField from "../components/ui/InputField";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import MerchantSection from "../components/profile/MerchantSection";
import type { User as UserType } from "../types/index";
import AuthenticatedLayout from "../AuthenticatedLayout";

export default function Profile({ user }: { user: UserType }) {
    const [preview, setPreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"profile" | "password">(
        "profile"
    );
    const [isEditingMerchant, setIsEditingMerchant] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        full_name: user.full_name,
        email: user.email,
        contact_number: user.contact_number || "",
        address: user.address || "",
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
            onError: () => {
                toast.error(
                    "Failed to update profile. Please check your input."
                );
            },
        });
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        postPassword("/profile/change-password", {
            onSuccess: () => {
                resetPassword();
                toast.success("Password updated successfully!");
            },
            onError: () => {
                toast.error("Failed to update password. Please try again.");
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            My Profile
                        </h1>
                        <p className="text-gray-600">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                {[
                                    {
                                        key: "profile",
                                        label: "Profile Information",
                                        icon: User,
                                    },
                                    {
                                        key: "password",
                                        label: "Change Password",
                                        icon: Lock,
                                    },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() =>
                                            setActiveTab(
                                                tab.key as
                                                    | "profile"
                                                    | "password"
                                            )
                                        }
                                        className={`flex-1 py-4 px-6 text-center font-medium transition-all flex items-center justify-center gap-2 ${
                                            activeTab === tab.key
                                                ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8">
                            {activeTab === "profile" ? (
                                <form onSubmit={handleProfileSubmit}>
                                    <ProfileImageUploader
                                        preview={preview}
                                        setPreview={setPreview}
                                        setData={setData}
                                        currentImage={user.profile_picture}
                                        error={errors.profile_picture}
                                    />

                                    <PersonalInfoSection
                                        data={{
                                            full_name: data.full_name,
                                            email: data.email,
                                            contact_number: data.contact_number,
                                            address: data.address,
                                        }}
                                        setData={setData}
                                        errors={errors}
                                        processing={processing}
                                    />

                                    {user.role === "merchant" &&
                                        user.merchant && (
                                            <MerchantSection
                                                user={user}
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                isEditing={isEditingMerchant}
                                                setIsEditing={
                                                    setIsEditingMerchant
                                                }
                                            />
                                        )}
                                </form>
                            ) : (
                                <form
                                    onSubmit={handlePasswordChange}
                                    className="space-y-6 max-w-2xl mx-auto"
                                >
                                    <SectionTitle
                                        title="Update Your Password"
                                        icon={
                                            <Lock
                                                className="text-orange-600"
                                                size={20}
                                            />
                                        }
                                    />

                                    <InputField
                                        label="Current Password"
                                        type="password"
                                        value={pwData.current_password}
                                        onChange={(e) =>
                                            setPwData(
                                                "current_password",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter current password"
                                        error={pwErrors.current_password}
                                    />
                                    <InputField
                                        label="New Password"
                                        type="password"
                                        value={pwData.new_password}
                                        onChange={(e) =>
                                            setPwData(
                                                "new_password",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter new password (minimum 8 characters)"
                                        error={pwErrors.new_password}
                                    />
                                    <InputField
                                        label="Confirm New Password"
                                        type="password"
                                        value={pwData.new_password_confirmation}
                                        onChange={(e) =>
                                            setPwData(
                                                "new_password_confirmation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                    />

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={pwProcessing}
                                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                                                pwProcessing
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                                            }`}
                                        >
                                            {pwProcessing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2
                                                        className="animate-spin"
                                                        size={18}
                                                    />
                                                    Updating Password...
                                                </span>
                                            ) : (
                                                "Update Password"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
