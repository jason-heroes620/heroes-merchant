import { Upload, Plus, Trash2, Image, Video } from "lucide-react";

interface MediaUploaderProps {
    mediaPreviews: string[];
    handleMediaInput: (files?: FileList | null) => void;
    removeMedia: (index: number) => void;
}

export default function MediaUploader({
    mediaPreviews,
    handleMediaInput,
    removeMedia,
}: MediaUploaderProps) {
    const isImage = (file: string): boolean =>
        file.startsWith("data:image") ||
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                    Event Media
                    <span className="text-gray-500 font-normal ml-2">
                        (Up to 10 files, max 50MB each)
                    </span>
                </label>
                <span className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                    {mediaPreviews.length}/10 uploaded
                </span>
            </div>

            <div className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center hover:border-orange-400 transition-all bg-linear-to-br from-orange-50 to-transparent">
                {mediaPreviews.length === 0 ? (
                    <div className="space-y-4">
                        <div className="mx-auto w-20 h-20 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                            <Upload className="h-10 w-10 text-orange-600" />
                        </div>
                        <div>
                            <label className="cursor-pointer">
                                <span className="text-orange-600 hover:text-orange-700 font-semibold text-lg">
                                    Click to upload
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) =>
                                        handleMediaInput(e.target.files)
                                    }
                                    className="hidden"
                                />
                            </label>
                            <p className="text-sm text-gray-600 mt-2">
                                or drag and drop
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Image size={14} />
                                <span>Images</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Video size={14} />
                                <span>Videos</span>
                            </div>
                            <span>• Max 50MB each</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {mediaPreviews.map((preview, index) => (
                            <div
                                key={index}
                                className="relative group aspect-square"
                            >
                                {isImage(preview) ? (
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200 group-hover:border-orange-400 transition-all"
                                    />
                                ) : (
                                    <video
                                        src={preview}
                                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200 group-hover:border-orange-400 transition-all"
                                        muted
                                        controls
                                    />
                                )}

                                <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-4">
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 font-medium"
                                    >
                                        <Trash2 size={16} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}

                        {mediaPreviews.length < 10 && (
                            <label className="aspect-square border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group">
                                <Plus
                                    className="text-orange-400 group-hover:text-orange-600 mb-2"
                                    size={28}
                                />
                                <span className="text-xs text-gray-600 group-hover:text-orange-600 font-medium">
                                    Add more
                                </span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={(e) =>
                                        handleMediaInput(e.target.files)
                                    }
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
