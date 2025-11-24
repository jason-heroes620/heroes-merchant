import { useRef, useState } from "react";
import type { Media } from "../../../types/events";

interface MediaCarouselProps {
    media?: Media[];
}

const MediaCarousel = ({ media = [] }: MediaCarouselProps) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

    if (!media || media.length === 0) return null;

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto">
            {/* Carousel */}
            <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide py-4"
            >
                {media.map((item, index: number) => (
                    <div
                        key={item.id || index}
                        className="flex-none w-1/4 aspect-[3/2] rounded-xl overflow-hidden shadow-md border-2 border-gray-100 relative cursor-pointer"
                        onClick={() => setSelectedMedia(item)}
                    >
                        {item.file_type?.startsWith("image") ? (
                            <img
                                src={item.file_path}
                                alt={`Event media ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                        ) : (
                            <video
                                src={item.file_path}
                                className="w-full h-full object-cover"
                                controls
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                    </div>
                ))}
            </div>

            {/* Navigation buttons */}
            <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
            >
                ◀
            </button>
            <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
            >
                ▶
            </button>

            {/* Lightbox / Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    {selectedMedia.file_type?.startsWith("image") ? (
                        <img
                            src={selectedMedia.file_path}
                            alt="Selected media"
                            className="max-h-[90vh] max-w-full rounded-lg"
                        />
                    ) : (
                        <video
                            src={selectedMedia.file_path}
                            className="max-h-[90vh] max-w-full rounded-lg"
                            controls
                            autoPlay
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default MediaCarousel;
