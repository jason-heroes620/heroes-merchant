import EventTypeSection from "./EventTypeSection";
import LocationSection from "./LocationSection";
import MediaUploader from "./MediaUploader";
import type { AgeGroup } from "../../../types/events";
import { FileText, Tag, User, AlertCircle } from "lucide-react";
import EventDetailsSection from "./EventDetailsSection";
import CategorySection from "./CategorySection";

interface BasicDetailsTabProps {
    data: any;
    setData: (key: string, value: any) => void;
    errors: Record<string, any>;
    handleMediaInput: (files?: FileList | null) => void;
    mediaPreviews: string[];
    removeMedia: (index: number) => void;
    ageGroups: AgeGroup[];
    addAgeGroup: () => void;
    updateAgeGroup: (i: number, f: keyof AgeGroup, v: any) => void;
    canEditAgeGroups: boolean;
}

export default function BasicDetailsTab({
    data,
    setData,
    errors,
    handleMediaInput,
    mediaPreviews,
    removeMedia,
    ageGroups,
    addAgeGroup,
    updateAgeGroup,
    canEditAgeGroups,
}: BasicDetailsTabProps) {
    return (
        <div className="space-y-6">
            {/* Event Type Section */}
            <EventTypeSection data={data} setData={setData} />

            {/* Title & Description */}
            <EventDetailsSection
                data={data}
                setData={setData}
                errors={errors}
            />

            {/* Category */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                    <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                        <Tag className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            Category
                        </h3>
                        <p className="text-sm text-gray-600">
                            Classify your event to reach the right audience
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <CategorySection data={data} setData={setData} />
                </div>
            </div>

            {/* Age Group Range */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                            <User className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                Age Group Range
                            </h3>
                            <p className="text-sm text-gray-600">
                                Determine your target audience age group
                            </p>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_suitable_for_all_ages || false}
                            onChange={(e) =>
                                setData(
                                    "is_suitable_for_all_ages",
                                    e.target.checked
                                )
                            }
                            disabled={!canEditAgeGroups}
                            className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-sm font-bold text-gray-700">
                            Suitable for All Ages
                        </span>
                    </label>
                </div>

                {!canEditAgeGroups && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-3 mb-6">
                        <AlertCircle className="text-red-600" size={20} />
                        <p className="text-red-700 font-medium">
                            Age Group is not editable once the event is active
                        </p>
                    </div>
                )}

                {!data.is_suitable_for_all_ages && (
                    <>
                        {ageGroups.map((group, index) => (
                            <div
                                key={index}
                                className="grid md:grid-cols-3 gap-6 mb-4"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                        Group Name
                                    </label>
                                    <input
                                        type="text"
                                        value={group.label}
                                        onChange={(e) =>
                                            updateAgeGroup(
                                                index,
                                                "label",
                                                e.target.value
                                            )
                                        }
                                        disabled={!canEditAgeGroups}
                                        placeholder="e.g., Kids, Teens, Adults"
                                        className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                        Min Age
                                    </label>
                                    <input
                                        type="number"
                                        value={group.min_age ?? ""}
                                        onChange={(e) =>
                                            updateAgeGroup(
                                                index,
                                                "min_age",
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : null
                                            )
                                        }
                                        disabled={!canEditAgeGroups}
                                        placeholder="e.g., 3"
                                        className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                        Max Age
                                    </label>
                                    <input
                                        type="number"
                                        value={group.max_age ?? ""}
                                        onChange={(e) =>
                                            updateAgeGroup(
                                                index,
                                                "max_age",
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : null
                                            )
                                        }
                                        disabled={!canEditAgeGroups}
                                        placeholder="e.g., 10"
                                        className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                                        min="0"
                                    />
                                </div>
                            </div>
                        ))}

                        {canEditAgeGroups && (
                            <button
                                type="button"
                                onClick={addAgeGroup}
                                className="mt-4 px-5 py-3 bg-orange-500 text-white font-semibold rounded-xl shadow hover:bg-orange-600 transition"
                            >
                                + Add Age Group
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Location Section */}
            <LocationSection data={data} setData={setData} />

            {/* Media Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                    <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                        <FileText className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            Event Media
                        </h3>
                        <p className="text-sm text-gray-600">
                            Add photos and videos to showcase your event
                        </p>
                    </div>
                </div>
                <MediaUploader
                    mediaPreviews={mediaPreviews}
                    handleMediaInput={handleMediaInput}
                    removeMedia={removeMedia}
                />
            </div>
        </div>
    );
}
