import {
    MapPin,
    Video,
    ChevronLeft,
    ChevronRight,
    X,
    Image,
    Tag,
    Users as UsersIcon,
    Layers,
    Info,
} from "lucide-react";
import { useState } from "react";
import type {
    Event,
    EventMedia,
    AgeGroup,
    EventLocation,
} from "../../../types/events";

const BasicInfoSection: React.FC<{
    event: Event;
    media: EventMedia[];
    ageGroups: AgeGroup[];
    location: EventLocation;
}> = ({ event, media, ageGroups, location }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const visibleMedia = media.slice(carouselIndex, carouselIndex + 3);

    const openLightbox = (index: number) => {
        setLightboxIndex(carouselIndex + index);
        setLightboxOpen(true);
    };

    const nextCarousel = () => {
        if (carouselIndex + 3 < media.length) {
            setCarouselIndex(carouselIndex + 3);
        } else {
            setCarouselIndex(0);
        }
    };

    const prevCarousel = () => {
        if (carouselIndex - 3 >= 0) {
            setCarouselIndex(carouselIndex - 3);
        } else {
            setCarouselIndex(Math.max(0, media.length - 3));
        }
    };

    const nextLightbox = () => {
        setLightboxIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    };

    const prevLightbox = () => {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    };

    return (
        <>
            <div className="bg-white rounded-xl border-2 border-gray-200 mb-6 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Info className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Event Details
                            </h2>
                            <p className="text-sm text-gray-600">
                                Complete information about this event
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 font-medium mb-0.5">
                                    Event Type
                                </p>
                                <p className="font-bold text-sm text-gray-900 uppercase truncate">
                                    {event.type.replace("_", " ")}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                <Tag className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 font-medium mb-0.5">
                                    Category
                                </p>
                                <p className="font-bold text-sm text-gray-900 uppercase truncate">
                                    {event.category || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                <UsersIcon className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 font-medium mb-0.5">
                                    Age Groups
                                </p>
                                <p className="font-bold text-sm text-gray-900 uppercase truncate">
                                    {event.is_suitable_for_all_ages
                                        ? "All Ages"
                                        : ageGroups
                                              .map(
                                                  (ag) =>
                                                      `${ag.label} (${ag.min_age} - ${ag.max_age})`
                                              )
                                              .join(", ")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Media Gallery */}
                    {media.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Image className="w-5 h-5 text-orange-600" />
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                    Media Gallery ({media.length})
                                </h3>
                            </div>
                            <div className="relative">
                                <div className="grid grid-cols-3 gap-3">
                                    {visibleMedia.map((m, idx) => (
                                        <div
                                            key={m.id}
                                            onClick={() => openLightbox(idx)}
                                            className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-orange-500 hover:shadow-lg transition-all group"
                                        >
                                            {m.file_type &&
                                            m.file_type.startsWith("image/") ? (
                                                <>
                                                    <img
                                                        src={m.file_path}
                                                        alt="Event media"
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 group-hover:bg-orange-50 transition-colors">
                                                    <Video className="w-8 h-8 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Carousel Navigation */}
                                {media.length > 3 && (
                                    <>
                                        <button
                                            onClick={prevCarousel}
                                            disabled={carouselIndex === 0}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                                        </button>
                                        <button
                                            onClick={nextCarousel}
                                            disabled={
                                                carouselIndex + 3 >=
                                                media.length
                                            }
                                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5 text-gray-700" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Indicators */}
                            {media.length > 3 && (
                                <div className="flex justify-center gap-1.5 mt-3">
                                    {Array.from({
                                        length: Math.ceil(media.length / 3),
                                    }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() =>
                                                setCarouselIndex(idx * 3)
                                            }
                                            className={`h-1.5 rounded-full transition-all ${
                                                Math.floor(
                                                    carouselIndex / 3
                                                ) === idx
                                                    ? "w-6 bg-orange-500"
                                                    : "w-1.5 bg-gray-300 hover:bg-orange-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Description
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {event.description || "No description provided"}
                        </p>
                    </div>

                    {/* Location */}
                    {location && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-5 h-5 text-orange-600" />
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    Location
                                </h3>
                            </div>
                            <p className="text-gray-700 font-medium mb-3">
                                {location.location_name}
                            </p>
                            <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 mb-3">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&hl=en;z=14&output=embed`}
                                    title="Event Location Map"
                                />
                            </div>
                            {location.how_to_get_there && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm font-semibold text-gray-900 mb-2">
                                        How to Get There
                                    </p>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {location.how_to_get_there}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                    >
                        <X className="w-6 h-6 text-gray-700" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevLightbox();
                        }}
                        className="absolute left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>

                    <div
                        className="max-w-6xl max-h-[90vh] relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {media[lightboxIndex]?.file_type?.startsWith(
                            "image/"
                        ) ? (
                            <img
                                src={media[lightboxIndex]?.file_path}
                                alt="Event media"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            />
                        ) : (
                            <div className="w-96 h-96 flex items-center justify-center bg-gray-800 rounded-lg">
                                <Video className="w-20 h-20 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextLightbox();
                        }}
                        className="absolute right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        {lightboxIndex + 1} / {media.length}
                    </div>
                </div>
            )}
        </>
    );
};

export default BasicInfoSection;
