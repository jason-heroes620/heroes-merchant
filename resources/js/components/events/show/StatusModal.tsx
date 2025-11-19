import type { Dispatch, SetStateAction } from "react";
import { X, Save, Info } from "lucide-react";

interface StatusModalProps {
    setShowStatusModal: Dispatch<SetStateAction<boolean>>;
    handleToggleStatus: () => void;
    newStatus: string;
    setNewStatus: Dispatch<SetStateAction<string>>;
    rejectedReason: string;
    setRejectedReason: Dispatch<SetStateAction<string>>;
}

export default function StatusModal({
    setShowStatusModal,
    handleToggleStatus,
    newStatus,
    setNewStatus,
    rejectedReason,
    setRejectedReason,
}: StatusModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white">
                            Update Event Status
                        </h3>
                        <button
                            onClick={() => setShowStatusModal(false)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            New Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        >
                            <option value="">Select status...</option>
                            <option value="active">Active</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {newStatus === "rejected" && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Rejection Reason{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectedReason}
                                onChange={(e) =>
                                    setRejectedReason(e.target.value)
                                }
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all"
                                placeholder="Please provide a reason for rejection..."
                            />
                        </div>
                    )}

                    {newStatus === "active" && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Info
                                    size={20}
                                    className="text-blue-600 flex-shrink-0 mt-0.5"
                                />
                                <div className="text-sm text-blue-900">
                                    <p className="font-semibold mb-1">
                                        Converting to Credits
                                    </p>
                                    <p>
                                        When you activate this event, all slot
                                        prices will be automatically converted
                                        to credits based on the current
                                        conversion rate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={() => setShowStatusModal(false)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        disabled={
                            !newStatus ||
                            (newStatus === "rejected" && !rejectedReason)
                        }
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        Update Status
                    </button>
                </div>
            </div>
        </div>
    );
}
