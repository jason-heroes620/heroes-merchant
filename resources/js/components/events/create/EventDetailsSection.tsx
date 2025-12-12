import { AlertCircle, FileText } from "lucide-react";

export default function EventDetailsSection({ setData, data, errors }: any) {
    const placeholders = {
        event: {
            title: "e.g., Painting class for Kids",
            description:
                "Describe what the event is about, who can join, and what participants will do or learn.",
        },
        trial_class: {
            title: "e.g., Little Explorers Trial Class",
            description:
                "Explain what parents and children can expect during the trial class — activities, duration, and key takeaways.",
        },
        location_based: {
            title: "e.g., Educational Visit to Zoo Negara",
            description:
                "Provide details about the trip: destination, objectives, what students will explore, and any preparation needed.",
        },
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-100">
                <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <FileText className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Event Details
                    </h3>
                    <p className="text-sm text-gray-600">
                        Provide a compelling title and description
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Event Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => setData("title", e.target.value)}
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                    placeholder={
                        placeholders[data.type as keyof typeof placeholders]
                            ?.title || "e.g., Summer Basketball Camp 2025"
                    }
                />
                {errors?.title && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                        <AlertCircle size={14} /> {errors.title}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Description
                </label>
                <textarea
                    value={data.description || ""}
                    onChange={(e) => setData("description", e.target.value)}
                    rows={6}
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none shadow-sm transition-all"
                    placeholder={
                        placeholders[data.type as keyof typeof placeholders]
                            ?.description || "Describe your event in detail..."
                    }
                />
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                        {(data.description || "").length} characters
                    </p>
                    <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            (data.description || "").length > 500
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {(data.description || "").length > 500
                            ? "Great detail! 👍"
                            : "Add more details"}
                    </span>
                </div>
            </div>
        </div>
    );
}
