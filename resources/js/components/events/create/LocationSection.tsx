import { useEffect, useRef } from "react";
import { MapPin, Map } from "lucide-react";

export default function LocationSection({ setData, data }: any) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!inputRef.current || typeof window.google === "undefined") return;

        const autocomplete = new google.maps.places.Autocomplete(
            inputRef.current,
            {
                fields: [
                    "formatted_address",
                    "geometry",
                    "name",
                    "place_id",
                    "address_components",
                    "viewport",
                ],
            }
        );

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const components: Record<string, string> = {};
            place.address_components?.forEach(
                (c: google.maps.GeocoderAddressComponent) => {
                    c.types.forEach((type: string) => {
                        components[type] = c.long_name;
                    });
                }
            );

            setData("location", {
                ...(data.location || {}),
                place_id: place.place_id || "",
                location_name: place.name || place.formatted_address || "",
                latitude: place.geometry?.location?.lat() ?? null,
                longitude: place.geometry?.location?.lng() ?? null,
                viewport: place.geometry?.viewport ?? null,
                raw_place: place || null,
            });
        });
    }, [setData, data.location]);

    const location = data.location || {};
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-100 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-orange-100">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                    <MapPin className="text-white" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Location <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-sm text-gray-600">
                        Where will the event take place?
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Search Location
                </label>
                <input
                    ref={inputRef}
                    id="location-input"
                    type="text"
                    value={location.location_name || ""}
                    onChange={(e) =>
                        setData("location", {
                            ...location,
                            location_name: e.target.value,
                        })
                    }
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all"
                    placeholder="Start typing to search for a place..."
                />
            </div>

            {location.location_name && (
                <div className="mt-6">
                    <label className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Map size={18} className="text-orange-600" />
                        Event Location on Map
                    </label>
                    <div className="relative w-full h-80 rounded-xl overflow-hidden border-4 border-orange-200 shadow-xl">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                location.location_name
                            )}&z=15&output=embed`}
                            title="Event Location"
                        />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                        <span className="flex items-center gap-2">
                            <MapPin size={16} className="text-orange-600" />
                            {location.location_name}
                        </span>
                        <a
                            href={`https://www.google.com/maps?q=${location.location_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 font-semibold hover:underline"
                        >
                            Open in Google Maps →
                        </a>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    How to Get There
                </label>
                <textarea
                    value={location.how_to_get_there ?? ""}
                    onChange={(e) =>
                        setData("location", {
                            ...location,
                            how_to_get_there: e.target.value,
                        })
                    }
                    rows={3}
                    placeholder="Provide directions or transportation tips..."
                    className="w-full px-5 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none shadow-sm transition-all"
                />
            </div>
        </div>
    );
}
