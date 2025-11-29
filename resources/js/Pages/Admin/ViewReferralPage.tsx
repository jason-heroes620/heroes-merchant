import { Users, UserPlus, Gift, Award, ArrowLeft } from "lucide-react";

interface Props {
    customer: any;
    referrer: {
        id: string;
        name: string;
        email: string;
        profile_picture?: string;
    } | null;
    referees: Array<{
        id: string;
        name: string;
        email: string;
        profile_picture?: string;
        referral_code?: string;
        created_at?: string;
    }>;
    referral_bonus: { free: number; paid: number };
}

export default function ViewReferralPage({
    customer,
    referrer,
    referees,
    referral_bonus,
}: Props) {
    const successfulReferrals = referees.length;
    const creditsEarned = Math.floor(successfulReferrals / 3);
    const progressToNext = ((successfulReferrals % 3) / 3) * 100;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="flex px-6 py-3 bg-orange-500 text-white rounded-lg hover:orange-600transition-all shadow-md font-semibold mb-8 gap-2"
                >
                    <ArrowLeft size={22} />
                    Back to Customer List
                </button>

                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                                <Gift size={40} />
                                Referral Program
                            </h1>
                            <p className="text-orange-50 text-lg leading-relaxed">
                                Customers get 50 free credit for every 3
                                successful referrals.
                            </p>
                        </div>
                        <div
                            className="bg-white rounded-xl px-8 py-4 text-center"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <p className="text-orange-100 text-sm font-medium mb-2">
                                Referral Code
                            </p>
                            <p className="text-3xl font-bold font-mono tracking-wider">
                                {customer.referral_code}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Total Referrals Card */}
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="flex items-center justify-center mb-4 gap-3">
                            <Users size={28} className="text-orange-500" />
                            <h3 className="text-2xl font-semibold text-gray-700">
                                Total Referrals
                            </h3>
                        </div>

                        <p className="text-5xl font-bold text-gray-900 mb-2">
                            {referees.length}
                        </p>

                        <p className="text-sm text-gray-600">
                            {creditsEarned} milestone
                            {creditsEarned !== 1 ? "s" : ""} completed
                        </p>
                    </div>

                    {/* Credits Awarded Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-8 border-2 border-green-200 text-center">
                        <div className="flex items-center justify-center mb-4 gap-3">
                            <Gift size={28} className="text-green-600" />
                            <h3 className="text-2xl font-semibold text-gray-700">
                                Total Free Credits Awarded
                            </h3>
                        </div>
                        <p className="text-6xl font-extrabold text-green-700 mb-2">
                            {referral_bonus.free}
                        </p>
                        <p className="text-sm text-gray-600">
                            From referral bonuses
                        </p>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white rounded-xl shadow-md p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                        Progress to Next Reward
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-medium text-gray-700">
                            Current Progress
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                            {successfulReferrals % 3} / 3 Referrals
                        </span>
                    </div>

                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mb-4">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 flex items-center justify-end pr-3"
                            style={{ width: `${progressToNext}%` }}
                        >
                            {progressToNext > 15 && (
                                <span className="text-white text-sm font-bold">
                                    {Math.round(progressToNext)}%
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-gray-600">
                        {3 - (successfulReferrals % 3) === 3 ? (
                            <span className="text-green-600 font-medium">
                                Ready to claim next credit!
                            </span>
                        ) : (
                            <>
                                <span className="font-medium text-gray-900">
                                    {3 - (successfulReferrals % 3)}
                                </span>{" "}
                                more referral
                                {3 - (successfulReferrals % 3) !== 1
                                    ? "s"
                                    : ""}{" "}
                                needed until next credit milestone
                            </>
                        )}
                    </p>
                </div>

                {/* Referred By Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <UserPlus size={28} />
                            Referred By
                        </h2>
                    </div>
                    <div className="p-8">
                        {referrer ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                                <div className="flex items-center gap-5">
                                    {referrer?.profile_picture ? (
                                        <img
                                            src={`/storage/${referrer.profile_picture}`}
                                            alt={referrer.name}
                                            className="w-14 h-14 rounded-full object-cover border shadow-sm"
                                        />
                                    ) : (
                                        <div
                                            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-400 
                    flex items-center justify-center text-white 
                    font-bold text-xl shadow-sm"
                                        >
                                            {referrer.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-gray-900 text-xl mb-1">
                                            {referrer.name}
                                        </p>
                                        <p className="text-gray-600">
                                            {referrer.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <UserPlus
                                    size={48}
                                    className="mx-auto mb-4 text-gray-300"
                                />
                                <p className="text-lg font-medium">
                                    No referrer - Direct signup
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Referees List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-5">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users size={28} />
                            Referees ({referees.length})
                        </h2>
                    </div>
                    <div className="p-8">
                        {referees.length > 0 ? (
                            <div className="space-y-4">
                                {referees.map((referee, index) => (
                                    <div
                                        key={referee.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {referee?.profile_picture ? (
                                                <img
                                                    src={`/storage/${referee.profile_picture}`}
                                                    alt={referee.name}
                                                    className="w-14 h-14 rounded-full object-cover border shadow-sm"
                                                />
                                            ) : (
                                                <div
                                                    className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-400 
                    flex items-center justify-center text-white 
                    font-bold text-xl shadow-sm"
                                                >
                                                    {referee.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-lg mb-1">
                                                    {referee.name}
                                                </p>
                                                <p className="text-gray-600 truncate mb-1">
                                                    {referee.email}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Joined:{" "}
                                                    {referee.created_at
                                                        ? new Date(
                                                              referee.created_at
                                                          ).toLocaleDateString()
                                                        : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {Math.floor(index / 3) <
                                                creditsEarned && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold border border-green-300 shadow-sm">
                                                    <Award size={18} />
                                                    <span>Credited</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Users
                                    size={64}
                                    className="mx-auto text-gray-300 mb-4"
                                />
                                <p className="text-gray-500 font-semibold text-xl mb-2">
                                    No referees yet
                                </p>
                                <p className="text-gray-400">
                                    Customer hasn't referred anyone
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
