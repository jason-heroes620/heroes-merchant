interface InputProps {
    label: string;
    value: string;
    onChange?: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
    type?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    error?: string;
    autoComplete?: string;
}

const InputField: React.FC<InputProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    placeholder,
    type = "text",
    icon: Icon,
    error,
    autoComplete,
}) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
        </label>
        <div className="relative">
            {Icon && (
                <Icon
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                />
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`w-full pl-${
                    Icon ? "11" : "4"
                } pr-4 py-3 rounded-xl border-2 transition-all ${
                    disabled
                        ? "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                        : "border-gray-300 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                }`}
            />
        </div>
        {error && <p className="text-red-600 text-sm mt-1.5">{error}</p>}
    </div>
);

export default InputField;
