import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import toast from "react-hot-toast";
import { User, Lock, Building2, FileText, Gift, Loader2 } from "lucide-react";

type EntityType = "merchant" | "customer";

interface BaseUser {
    full_name: string;
    email: string;
    contact_number: string;
    address: string;
}

interface BaseEntity {
    id: string;
    user: BaseUser;
    status?: "verified" | "pending_verification" | "rejected";
}

interface Merchant extends BaseEntity {
    company_name: string;
    business_registration_number: string;
    company_details: string;
    business_status: "verified" | "pending_verification" | "rejected";
    rejection_reason?: string;
}

interface Customer extends BaseEntity {
    date_of_birth?: string;
    age?: number;
    referral_code?: string;
}

interface Props {
    type: EntityType;
    entity: Merchant | Customer;
    updateRoute: string;
}

export default function EntityProfileForm({
    type,
    entity,
    updateRoute,
}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        full_name: entity.user.full_name || "",
        email: entity.user.email || "",
        contact_number: entity.user.contact_number || "",
        address: entity.user.address || "",
        password: "",
        password_confirmation: "",

        ...(type === "merchant"
            ? {
                  company_name: (entity as Merchant).company_name || "",
                  business_registration_number:
                      (entity as Merchant).business_registration_number || "",
                  company_details: (entity as Merchant).company_details || "",
                  business_status:
                      (entity as Merchant).business_status ||
                      "pending_verification",
                  rejection_reason: (entity as Merchant).rejection_reason || "",
              }
            : {
                  date_of_birth: (entity as Customer).date_of_birth || "",
                  referral_code: (entity as Customer).referral_code || "",
              }),
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        Inertia.post(route(updateRoute, entity.id), form, {
            onSuccess: () => {
                toast.success(
                    `${
                        type === "merchant" ? "Merchant" : "Customer"
                    } updated successfully!`
                );
                setTimeout(() => {
                    Inertia.visit(
                        route(
                            type === "merchant"
                                ? "admin.merchants.index"
                                : "admin.customers.index"
                        )
                    );
                }, 800);
            },
            onError: () => {
                toast.error("Update failed. Please try again.");
                setIsSubmitting(false);
            },
        });
    };

    const STATUS_STYLES: Record<string, string> = {
        verified: "bg-green-100 text-green-800 border-green-200",
        pending_verification: "bg-yellow-100 text-yellow-800 border-yellow-200",
        rejected: "bg-red-100 text-red-800 border-red-200",
    };

    const getStatusBadgeClass = (status?: string) => {
        return (
            STATUS_STYLES[status as keyof typeof STATUS_STYLES] ??
            STATUS_STYLES.pending_verification
        );
    };

    const getStatusLabel = (status?: string) => {
        const labels: Record<string, string> = {
            verified: "Verified",
            pending_verification: "Pending Verification",
            rejected: "Rejected",
        };
        return labels[status as keyof typeof labels] ?? "Pending Verification";
    };

    const title = type === "merchant" ? "Merchant Profile" : "Customer Profile";
    const subtitle =
        type === "merchant"
            ? "View and edit merchant information"
            : "View and edit customer information";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                {title}
                            </h1>
                            <p className="text-orange-100 mt-1">{subtitle}</p>
                        </div>
                        {type === "merchant" && "business_status" in form && (
                            <div
                                className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusBadgeClass(
                                    form.business_status
                                )}`}
                            >
                                {getStatusLabel(form.business_status)}
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Personal Information */}
                        <Section title="Personal Information" icon={User}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <TextInput
                                    name="full_name"
                                    label="Full Name"
                                    value={form.full_name}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <TextInput
                                    name="email"
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <TextInput
                                    name="contact_number"
                                    label="Contact Number"
                                    value={form.contact_number}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <TextInput
                                    name="address"
                                    label="Address"
                                    value={form.address}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </Section>

                        {/* Security */}
                        <Section title="Security" icon={Lock}>
                            <p className="text-sm text-gray-600 mb-4">
                                Leave password fields empty if you don't want to
                                change the password
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <TextInput
                                    name="password"
                                    label="New Password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                                <TextInput
                                    name="password_confirmation"
                                    label="Confirm New Password"
                                    type="password"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </Section>

                        {/* Conditional Sections */}
                        {type === "merchant" ? (
                            <MerchantFields
                                form={form}
                                handleChange={handleChange}
                                isSubmitting={isSubmitting}
                            />
                        ) : (
                            <CustomerFields
                                form={form}
                                handleChange={handleChange}
                                isSubmitting={isSubmitting}
                            />
                        )}

                        {/* Actions */}
                        <div className="pt-6 border-t flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                disabled={isSubmitting}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                                    isSubmitting
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg"
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2
                                            className="animate-spin"
                                            size={20}
                                        />
                                        Saving...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

const Section = ({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) => (
    <div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <Icon className="text-orange-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {children}
    </div>
);

const TextInput = ({
    name,
    label,
    value,
    onChange,
    disabled,
    type = "text",
}: {
    name: string;
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >;
    disabled?: boolean;
    type?: string;
}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full mb-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
    </div>
);

const MerchantFields = ({ form, handleChange, isSubmitting }: any) => (
    <>
        <Section title="Company Information" icon={Building2}>
            <TextInput
                name="company_name"
                label="Company Name"
                value={form.company_name}
                onChange={handleChange}
                disabled={isSubmitting}
            />
            <TextInput
                name="business_registration_number"
                label="Business Registration Number"
                value={form.business_registration_number}
                onChange={handleChange}
                disabled={isSubmitting}
            />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Details
                </label>
                <textarea
                    name="company_details"
                    value={form.company_details}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
            </div>
        </Section>

        <Section title="Verification Status" icon={FileText}>
            <select
                name="business_status"
                value={form.business_status}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
                <option value="pending_verification">
                    Pending Verification
                </option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
            </select>

            {form.business_status === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <label className="block text-sm font-medium text-red-900 mb-2">
                        Rejection Reason
                    </label>
                    <textarea
                        name="rejection_reason"
                        value={form.rejection_reason}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        rows={3}
                        placeholder="Reason for rejection..."
                        className="w-full px-4 py-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
                    />
                </div>
            )}
        </Section>
    </>
);

const CustomerFields = ({ form, handleChange, isSubmitting }: any) => (
    <Section title="Customer Details" icon={Gift}>
        <TextInput
            name="date_of_birth"
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange}
            disabled={isSubmitting}
        />
        <TextInput
            name="referral_code"
            label="Referral Code"
            value={form.referral_code}
            onChange={handleChange}
            disabled={isSubmitting}
        />
    </Section>
);
