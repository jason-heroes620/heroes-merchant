import React from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}

export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  placeholder,
  error,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-lg border transition-all ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            : "border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        } ${error ? "border-red-300 bg-red-50" : ""}`}
      />
      {error && <p className="text-red-600 text-sm mt-1.5">{error}</p>}
    </div>
  );
}
