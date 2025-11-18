import { AlertCircle, Infinity } from "lucide-react";

export default function CapacitySection({ data, setData, errors }: any) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                Default Capacity
            </label>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={data.is_unlimited_capacity || false}
                    onChange={(e) => {
                        setData("is_unlimited_capacity", e.target.checked);
                        if (e.target.checked) {
                            setData("default_capacity", null);
                        }
                    }}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Infinity size={18} className="text-orange-500" />
                    Unlimited Capacity
                </span>
            </label>

            <input
                type="number"
                value={data.default_capacity ?? ""}
                onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || Number(value) >= 0) {
                        setData(
                            "default_capacity",
                            value === "" ? null : Number(value)
                        );
                    }
                }}
                disabled={data.is_unlimited_capacity}
                className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={
                    data.is_unlimited_capacity ? "Unlimited" : "e.g., 30"
                }
                min="0"
            />
            {errors?.default_capacity && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.default_capacity}
                </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
                Maximum number of participants per session
            </p>
        </div>
    );
}
