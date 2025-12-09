interface InputProps {
    label: string;
    value: string | number;
    onChange?: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
    type?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    error?: string;
    autoComplete?: string;
}
const FormField: React.FC<InputProps & { rows?: number }> = ({
    label,
    value,
    onChange,
    disabled,
    placeholder,
    error,
    rows = 4,
}) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
        </label>
        <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                disabled
                    ? "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    : "border-gray-300 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            }`}
        />
        {error && <p className="text-red-600 text-sm mt-1.5">{error}</p>}
    </div>
);

export default FormField;
