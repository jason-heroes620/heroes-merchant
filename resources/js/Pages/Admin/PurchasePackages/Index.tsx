import { router, usePage } from "@inertiajs/react";
import type { PageProps } from "../../../types/index";
import {
    Package,
    Plus,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    Gift,
    Clock,
    Star,
} from "lucide-react";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface Package {
    id: string;
    name: string;
    price_in_rm: number;
    paid_credits: number;
    free_credits: number;
    effective_from: string;
    valid_until?: string;
    validity_days: number;
    active: boolean;
    best_value: boolean;
    system_locked: boolean;
}

export default function Index() {
    const { packages } = usePage<PageProps<{ packages: Package[] }>>().props;

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route("admin.packages.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 px-8 py-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        Purchase Packages
                                    </h1>
                                    <p className="text-orange-100">
                                        Manage credit packages for event
                                        bookings
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        (window.location.href = route(
                                            "admin.packages.create"
                                        ))
                                    }
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Plus size={20} />
                                    Add New Package
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Package Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {packages
                            .filter((pkg) => pkg.active)
                            .map((pkg) => {
                                const totalCredits =
                                    pkg.paid_credits + pkg.free_credits;
                                const creditsPerRM =
                                    pkg.price_in_rm > 0
                                        ? (
                                              totalCredits / pkg.price_in_rm
                                          ).toFixed(2)
                                        : null;

                                return (
                                    <div
                                        key={pkg.id}
                                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group relative"
                                    >
                                        {/* Best Value Badge - Ribbon Style */}
                                        {pkg.best_value && (
                                            <div className="absolute top-4 right-4 z-20">
                                                <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                                    <Star
                                                        size={12}
                                                        fill="currentColor"
                                                    />
                                                    BEST VALUE
                                                </div>
                                            </div>
                                        )}

                                        {/* Card Header */}
                                        <div className="bg-linear-to-r from-orange-500 via-orange-600 to-red-500 p-6 text-white relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="flex items-start gap-4">
                                                    <Package
                                                        size={40}
                                                        className="shrink-0 mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-xl font-bold mb-1 wrap-break-word">
                                                            {pkg.name ||
                                                                "Package Name"}
                                                        </h3>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-bold">
                                                                {pkg.price_in_rm === 0
                                                                    ? "FREE"
                                                                    : `RM ${pkg.price_in_rm}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-6 space-y-3">
                                            {/* Paid Credits */}
                                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign
                                                        size={18}
                                                        className="text-blue-600"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Paid Credits
                                                    </span>
                                                </div>
                                                <span className="text-xl font-bold text-blue-600">
                                                    {pkg.paid_credits}
                                                </span>
                                            </div>

                                            {/* Free Credits */}
                                            {pkg.free_credits > 0 && (
                                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                                    <div className="flex items-center gap-2">
                                                        <Gift
                                                            size={18}
                                                            className="text-green-600"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Free Credits
                                                        </span>
                                                    </div>
                                                    <span className="text-xl font-bold text-green-600">
                                                        +{pkg.free_credits}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Total Credits */}
                                            <div className="flex items-center justify-between p-4 bg-linear-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                                                <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                                    Total Credits
                                                </span>
                                                <span className="text-2xl font-bold text-orange-700">
                                                    {totalCredits}
                                                </span>
                                            </div>

                                            {/* Credits per RM */}
                                            {creditsPerRM && (
                                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div className="text-center">
                                                        <span className="text-xs font-medium text-gray-500 uppercase block mb-1">
                                                            Value per Credit
                                                        </span>
                                                        <span className="text-lg font-bold text-gray-900">
                                                            RM{" "}
                                                            {(
                                                                pkg.price_in_rm /
                                                                totalCredits
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Validity Dates */}
                                            <div className="pt-3 space-y-2 text-sm border-t border-gray-100">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar
                                                        size={14}
                                                        className="text-gray-400"
                                                    />
                                                    <span className="text-xs">
                                                        Effective from{" "}
                                                        {new Date(
                                                            pkg.effective_from
                                                        ).toLocaleDateString()}
                                                        {pkg.valid_until && (
                                                            <>
                                                                {" "}
                                                                until{" "}
                                                                {new Date(
                                                                    pkg.valid_until
                                                                ).toLocaleDateString()}
                                                            </>
                                                        )}
                                                    </span>
                                                </div>

                                                {
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock
                                                            size={14}
                                                            className="text-gray-400"
                                                        />
                                                        <span className="text-xs">
                                                            {pkg.validity_days %
                                                                30 ===
                                                            0 ? (
                                                                <>
                                                                    Valid for{" "}
                                                                    {pkg.validity_days /
                                                                        30}{" "}
                                                                    {pkg.validity_days /
                                                                        30 ===
                                                                    1
                                                                        ? "month"
                                                                        : "months"}{" "}
                                                                    from
                                                                    purchase
                                                                    date
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Valid for{" "}
                                                                    {
                                                                        pkg.validity_days
                                                                    }{" "}
                                                                    days from
                                                                    purchase
                                                                    date
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                }
                                            </div>

                                            {/* Actions */}
                                            {!pkg.system_locked && (
                                                <div className="flex gap-2 pt-3">
                                                    <button
                                                        onClick={() =>
                                                            (window.location.href =
                                                                route(
                                                                    "admin.packages.edit",
                                                                    {
                                                                        package:
                                                                            pkg.id,
                                                                    }
                                                                ))
                                                        }
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors font-medium"
                                                    >
                                                        <Edit size={16} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                pkg.id,
                                                                pkg.name
                                                            )
                                                        }
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors font-medium"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Empty State */}
                    {packages.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Package
                                    className="text-orange-600"
                                    size={48}
                                />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No packages yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Create your first purchase package to get
                                started
                            </p>
                            <button
                                onClick={() => console.log("Create package")}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-lg"
                            >
                                <Plus size={20} />
                                Create Package
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
