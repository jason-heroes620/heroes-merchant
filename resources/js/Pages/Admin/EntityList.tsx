import { useState } from "react";
import { Search, Eye, Users, Wallet, TrendingUp } from "lucide-react";
import type { User } from "../../types/index";
import { router } from "@inertiajs/react";

interface BaseEntity {
    id: string;
    user: User;
}

interface Merchant extends BaseEntity {
    company_name: string;
    business_status: "verified" | "pending_verification" | "rejected";
}

interface Customer extends BaseEntity {
    date_of_birth?: string | null;
    age?: number;
    referral_code?: string;
    referred_by?: string | null;
}

interface Props {
    type: "merchant" | "customer";
    data: Merchant[] | Customer[];
    createRoute: string;
    showRoute: string;
}

export default function EntityList({
    type,
    data,
    createRoute,
    showRoute,
}: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Generic filtering
    const filteredData = data.filter((item: any) => {
        const name = item.user?.full_name?.toLowerCase() ?? "";
        const email = item.user?.email?.toLowerCase() ?? "";
        const search = searchTerm.toLowerCase();

        const nameMatch = name.includes(search);
        const emailMatch = email.includes(search);

        const companyMatch =
            type === "merchant" &&
            item.company_name?.toLowerCase()?.includes(search);

        const referralMatch =
            type === "customer" &&
            item.referral_code?.toLowerCase()?.includes(search);

        const matchesSearch =
            nameMatch || emailMatch || companyMatch || referralMatch;

        const matchesStatus =
            type === "merchant"
                ? filterStatus === "all" ||
                  item.business_status === filterStatus
                : true;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            verified: "bg-green-100 text-green-800 border-green-200",
            pending_verification:
                "bg-yellow-100 text-yellow-800 border-yellow-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
        };
        return (
            styles[status as keyof typeof styles] ||
            "bg-gray-100 text-gray-800 border-gray-200"
        );
    };

    const getStatusCount = (status: string) => {
        if (type !== "merchant") return 0;
        if (status === "all") return data.length;
        return (data as Merchant[]).filter(
            (item) => item.business_status === status
        ).length;
    };

    const title = type === "merchant" ? "Merchants" : "Customers";
    const subtitle =
        type === "merchant"
            ? "Manage and view all merchants"
            : "Manage and view all customers";
    const placeholder =
        type === "merchant"
            ? "Search by name, email, or company..."
            : "Search by name, email, or referral code...";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="text-white" size={32} />
                                <div>
                                    <h1 className="text-3xl font-bold text-white">
                                        {title}
                                    </h1>
                                    <p className="text-orange-100 mt-1">
                                        {subtitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.get(route(createRoute))}
                                className="bg-white text-orange-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-50 transition-all"
                            >
                                + Add {title.slice(0, -1)}
                            </button>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-grow relative">
                                <Search
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={20}
                                />
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            {type === "merchant" && (
                                <select
                                    value={filterStatus}
                                    onChange={(e) =>
                                        setFilterStatus(e.target.value)
                                    }
                                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="all">
                                        All Status ({getStatusCount("all")})
                                    </option>
                                    <option value="verified">
                                        Verified ({getStatusCount("verified")})
                                    </option>
                                    <option value="pending_verification">
                                        Pending (
                                        {getStatusCount("pending_verification")}
                                        )
                                    </option>
                                    <option value="rejected">
                                        Rejected ({getStatusCount("rejected")})
                                    </option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {filteredData.length === 0 ? (
                            <div className="text-center py-12">
                                <Users
                                    className="mx-auto text-gray-400 mb-4"
                                    size={48}
                                />
                                <p className="text-gray-500 text-lg">
                                    No {title.toLowerCase()} found
                                </p>
                                <p className="text-gray-400 text-sm mt-1">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Full Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Email
                                        </th>
                                        {type === "merchant" ? (
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Company
                                            </th>
                                        ) : (
                                            <>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Age
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Referral Code
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Wallet & Transaction
                                                </th>
                                            </>
                                        )}
                                        {type === "merchant" && (
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredData.map((item: any) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {item.user
                                                        ?.profile_picture ? (
                                                        <img
                                                            src={`/storage/${item.user?.profile_picture}`}
                                                            alt={
                                                                item.user
                                                                    .full_name
                                                            }
                                                            className="w-10 h-10 rounded-full object-cover border"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                                            {item.user?.full_name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ??
                                                                "?"}
                                                        </div>
                                                    )}
                                                    <div className="font-medium text-gray-900">
                                                        {item.user?.full_name ??
                                                            "User"}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {item.user.email}
                                            </td>

                                            {type === "merchant" ? (
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.company_name}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                                        {item.age ?? "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                                        <button
                                                            onClick={() =>
                                                                router.get(
                                                                    route(
                                                                        "admin.customers.referrals",
                                                                        item.id
                                                                    )
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                                                        >
                                                            <TrendingUp
                                                                size={16}
                                                            />
                                                            View Referrals
                                                        </button>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                router.get(
                                                                    route(
                                                                        "admin.customers.wallet",
                                                                        item.id
                                                                    )
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-all font-medium"
                                                        >
                                                            <Wallet size={16} />
                                                            View
                                                        </button>
                                                    </td>
                                                </>
                                            )}

                                            {type === "merchant" && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                                            item.business_status
                                                        )}`}
                                                    >
                                                        {(
                                                            item.business_status ||
                                                            "N/A"
                                                        )
                                                            .replace("_", " ")
                                                            .toUpperCase()}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                showRoute,
                                                                item.id
                                                            )
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all font-medium"
                                                >
                                                    <Eye size={16} />
                                                    View/Edit Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {filteredData.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Showing {filteredData.length} of {data.length}{" "}
                                {title.toLowerCase()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
