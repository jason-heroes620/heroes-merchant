import React from "react";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  rows?: number;
}

export default function TextAreaField({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  error,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-2.5 rounded-lg border resize-none transition-all ${
          disabled
            ? "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
            : "border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        } ${error ? "border-red-300 bg-red-50" : ""}`}
      />
      {error && <p className="text-red-600 text-sm mt-1.5">{error}</p>}
    </div>
  );
}
