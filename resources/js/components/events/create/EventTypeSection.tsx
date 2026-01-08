import {
    Calendar,
    Map,
    Star,
} from "lucide-react";

export default function EventTypeSection({ data, setData }: any) {
    const eventTypes = [
        {
            value: "workshop",
            label: "Event / Workshop",
            desc: "Regular on-campus program or event",
            icon: Calendar,
        },
        {
            value: "trial",
            label: "Trial Class",
            desc: "One-time trial or discovery class for new students",
            icon: Star,
        },
        {
            value: "pass",
            label: "Ticket / Pass",
            desc: "Special experience requiring a ticket or pass",
            icon: Map,
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
                <div className="p-3 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <Calendar className="text-white" size={24} />
                </div>
                <div>
                    <label className="block text-xl font-bold text-gray-800">
                        Event Type <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600">
                        Choose the type of event you're creating
                    </p>
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {eventTypes.map((type) => {
                    const isSelected = data.type === type.value;
                    const Icon = type.icon;
                    return (
                        <label
                            key={type.value}
                            className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                                isSelected
                                    ? "border-orange-500 bg-linear-to-br from-orange-50 to-orange-100 shadow-xl"
                                    : "border-gray-200 hover:border-orange-300 hover:shadow-lg bg-white"
                            }`}
                        >
                            <input
                                type="radio"
                                name="event_type"
                                checked={isSelected}
                                onChange={() => setData("type", type.value)}
                                className="sr-only"
                            />
                            <div className="text-center">
                                <div
                                    className={`inline-flex p-4 rounded-xl mb-3 transition-colors ${
                                        isSelected
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600"
                                    }`}
                                >
                                    <Icon size={32} />
                                </div>
                                <div className="font-bold text-lg text-gray-900 mb-2">
                                    {type.label}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {type.desc}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">
                                        ✓
                                    </span>
                                </div>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
