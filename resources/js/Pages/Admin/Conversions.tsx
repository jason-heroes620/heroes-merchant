import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";

interface Conversion {
    id: string;
    conversion_rate: number;
    effective_from: string;
    valid_until?: string | null;
    status?: "active" | "inactive";
}

interface Props {
    conversions: Conversion[];
}

const ConversionsIndex: React.FC<Props> = ({ conversions }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedConversion, setSelectedConversion] =
        useState<Conversion | null>(null);
    const [actionType, setActionType] = useState<
        "activate" | "deactivate" | null
    >(null);

    const today = new Date();

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isActive = (conv: Conversion) => {
        if (conv.status === "inactive") return false;
        const from = new Date(conv.effective_from);
        const until = conv.valid_until ? new Date(conv.valid_until) : null;
        return from <= today && (!until || today <= until);
    };

    const openModal = (conv: Conversion, type: "activate" | "deactivate") => {
        setSelectedConversion(conv);
        setActionType(type);
        setModalOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedConversion || !actionType) return;

        if (actionType === "deactivate") {
            router.post(
                `/admin/conversions/${selectedConversion.id}/deactivate`,
                {},
                {
                    onSuccess: () => router.reload({ only: ["conversions"] }),
                }
            );
        } else if (actionType === "activate") {
            router.post(
                `/admin/conversions/${selectedConversion.id}/activate`,
                {
                    effective_from: new Date().toISOString().split("T")[0],
                },
                {
                    onSuccess: () => router.reload({ only: ["conversions"] }),
                }
            );
        }

        setModalOpen(false);
        setSelectedConversion(null);
        setActionType(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Conversion Rates
                </h1>
                <Link
                    href="/admin/conversions/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                    + Add New Conversion
                </Link>
            </div>

            {conversions.length === 0 ? (
                <p className="text-gray-600">No conversion rates found.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {conversions.map((conv) => {
                        const active = isActive(conv);
                        return (
                            <div
                                key={conv.id}
                                className={`p-5 rounded-xl border shadow-sm ${
                                    active
                                        ? "bg-green-50 border-green-400"
                                        : "bg-gray-50 border-gray-300"
                                }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                    1 Credit = RM{" "}
                                    {conv.conversion_rate.toFixed(2)}
                                </h2>

                                <p className="text-sm text-gray-600">
                                    <strong>Effective From:</strong>{" "}
                                    {formatDate(conv.effective_from)}
                                </p>
                                <p className="text-sm text-gray-600 mb-3">
                                    <strong>Valid Until:</strong>{" "}
                                    {formatDate(conv.valid_until)}
                                </p>

                                {active ? (
                                    <button
                                        onClick={() =>
                                            openModal(conv, "deactivate")
                                        }
                                        className="border border-red-500 text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition"
                                    >
                                        Deactivate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            openModal(conv, "activate")
                                        }
                                        className="border border-green-500 text-green-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50 transition"
                                    >
                                        Activate
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {modalOpen && selectedConversion && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">
                            {actionType === "deactivate"
                                ? "Deactivate Conversion Rate"
                                : "Activate Conversion Rate"}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to{" "}
                            <strong>{actionType}</strong> this conversion rate?{" "}
                            {actionType === "activate" &&
                                "This will set the effective date to today."}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                                    actionType === "deactivate"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConversionsIndex;
