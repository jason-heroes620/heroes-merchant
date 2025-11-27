import React from "react";
import { Wallet, History } from "lucide-react";
import { usePage } from "@inertiajs/react";
import type { PageProps as BasePageProps } from "../../types";

interface User {
    id: string;
    full_name: string;
    email: string;
}

interface Customer {
    id: string;
    user: User;
    date_of_birth?: string | null;
    age?: number;
    referral_code?: string;
}

interface Wallet {
    free_credits: number;
    paid_credits: number;
}

interface Transaction {
    id: string;
    description: string;
    delta_free: number;
    delta_paid: number;
    created_at: string;
}

interface PageProps extends BasePageProps {
    customer: Customer;
    wallet: Wallet;
    transactions: Transaction[];
}

export default function ViewCustomerTransaction() {
    const { customer, wallet, transactions } = usePage<PageProps>().props;

    if (!customer) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {customer.user.full_name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Wallet & Transactions
                        </p>
                    </div>
                </div>

                {/* Wallet Summary */}
                <Section title="Wallet & Credits" icon={Wallet}>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <CreditCard
                            label="Free Credits"
                            amount={wallet.free_credits}
                        />
                        <CreditCard
                            label="Paid Credits"
                            amount={wallet.paid_credits}
                        />
                    </div>
                </Section>

                {/* Transactions */}
                <Section title="Transactions (Last 6 Months)" icon={History}>
                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <p className="text-gray-500">
                                No transactions found.
                            </p>
                        ) : (
                            transactions.map((t: Transaction) => (
                                <div
                                    key={t.id}
                                    className="p-3 border rounded-lg flex justify-between"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {t.description}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(
                                                t.created_at
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p
                                        className={`font-semibold ${
                                            t.delta_free + t.delta_paid > 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {t.delta_free + t.delta_paid > 0
                                            ? "+"
                                            : ""}
                                        {t.delta_free + t.delta_paid}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Section>
            </div>
        </div>
    );
}

// Section component
const Section = ({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: React.ReactNode;
}) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <Icon className="text-orange-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>
        {children}
    </div>
);

// CreditCard component
const CreditCard = ({ label, amount }: { label: string; amount: number }) => (
    <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-orange-600">{amount}</p>
    </div>
);
