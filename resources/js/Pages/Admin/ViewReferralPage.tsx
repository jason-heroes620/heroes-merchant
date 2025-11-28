import { Users, UserPlus, Gift } from "lucide-react";

interface Props {
    customer: any;
    referrer: { id: string; name: string; email: string } | null;
    referees: Array<{
        id: string;
        name: string;
        email: string;
        referral_code?: string;
    }>;
    referral_bonus: { free: number; paid: number };
}

export default function ViewReferralPage({
    customer,
    referrer,
    referees,
    referral_bonus,
}: Props) {
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Users size={32} /> {customer.user.full_name}'s
                        Referrals
                    </h1>

                    {/* Referrer */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <UserPlus size={20} /> Referrer
                        </h2>
                        {referrer ? (
                            <div className="mt-2 text-gray-700">
                                {referrer.name} ({referrer.email})
                            </div>
                        ) : (
                            <div className="mt-2 text-gray-500">
                                No referrer
                            </div>
                        )}
                    </div>

                    {/* Referees */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Users size={20} /> Referees ({referees.length})
                        </h2>
                        {referees.length > 0 ? (
                            <ul className="mt-2 list-disc list-inside text-gray-700">
                                {referees.map((r) => (
                                    <li key={r.id}>
                                        {r.name} ({r.email}){" "}
                                        {r.referral_code &&
                                            `| Code: ${r.referral_code}`}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-2 text-gray-500">
                                No referees yet
                            </div>
                        )}
                    </div>

                    {/* Referral Bonus */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Gift size={20} /> Referral Bonus Earned
                        </h2>
                        <div className="mt-2 text-gray-700">
                            Free Credits: {referral_bonus.free} <br />
                            Paid Credits: {referral_bonus.paid}
                        </div>
                    </div>

                    {/* Back Button */}
                    <div className="mt-8">
                        <button
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
