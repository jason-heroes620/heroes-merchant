import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  error,
  disabled = false,
  rows,
}: FormFieldProps) {
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
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
          error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
        }`}
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
