import { AlertCircle } from "lucide-react";

interface Props {
    label: string;
    value: string;
    onChange: (e: any) => void;
    error?: string;
    type?: string;
    rows?: number;
    disabled?: boolean;
}

export default function UserBaseForm({
    label,
    value,
    onChange,
    error,
    type = "text",
    rows,
    disabled,
}: Props) {
    const isTextarea = type === "textarea";
    const InputComponent = isTextarea ? "textarea" : "input";

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <InputComponent
                type={isTextarea ? undefined : type}
                rows={isTextarea ? rows : undefined}
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                }`}
                disabled={disabled}
            />
            {error && (
                <div className="flex items-center gap-1 mt-1.5 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

