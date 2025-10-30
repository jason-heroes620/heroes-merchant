import React from "react";
import { Upload } from "lucide-react";

interface Props {
  preview: string | null;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  setData: (key: string, value: any) => void;
  currentImage?: string;
  error?: string;
}

export default function ProfileImageUploader({
  preview,
  setPreview,
  setData,
  currentImage,
  error,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-6 pb-8 mb-8 border-b border-gray-200">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
        <img
          src={
            preview ||
            (currentImage
              ? `/storage/${currentImage}`
              : "/default-avatar.png")
          }
          alt="Profile"
          className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
        />
      </div>
      <div className="text-center">
        <label className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
          <Upload className="w-4 h-4" />
          Upload New Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setData("profile_picture", file);
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF</p>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
