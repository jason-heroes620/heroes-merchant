declare const google: any;

import { useEffect, useRef, useState } from "react";
import { MapPin, Map } from "lucide-react";

export default function LocationSection({ setData, data }: any) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    const location = data.location || {};
    const [mapsReady, setMapsReady] = useState(false);

    function loadGoogleMaps(src: string) {
        if (window.google && window.google.maps) {
            return Promise.resolve();
        }

        if ((window as any)._googleMapsLoadingPromise) {
            return (window as any)._googleMapsLoadingPromise;
        }

        const promise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener("load", resolve);
                existing.addEventListener("error", reject);
                return;
            }

            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });

        (window as any)._googleMapsLoadingPromise = promise;

        return promise;
    }

    useEffect(() => {
        loadGoogleMaps(
            `https://maps.googleapis.com/maps/api/js?key=${
                import.meta.env.GOOGLE_MAPS_API_KEY
            }&libraries=places`
        ).then(() => setMapsReady(true));
    }, []);


    useEffect(() => {
        if (!mapsReady || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(
            inputRef.current,
            {
                fields: [
                    "formatted_address",
                    "geometry",
                    "name",
                    "place_id",
                    "address_components",
                ],
            }
        );

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            const viewport = place.geometry.viewport
                ? {
                      north: place.geometry.viewport.getNorthEast().lat(),
                      east: place.geometry.viewport.getNorthEast().lng(),
                      south: place.geometry.viewport.getSouthWest().lat(),
                      west: place.geometry.viewport.getSouthWest().lng(),
                  }
                : null;

            setData("location", {
                ...(data.location || {}),
                place_id: place.place_id || "",
                location_name: place.name || place.formatted_address || "",
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                viewport,
                raw_place: place,
            });
        });
    }, [mapsReady, setData, data.location]);

    useEffect(() => {
        if (
            !mapsReady ||
            !mapRef.current ||
            !location.latitude ||
            !location.longitude
        )
            return;

        if (!mapInstance.current) {
            mapInstance.current = new google.maps.Map(mapRef.current, {
                center: { lat: location.latitude, lng: location.longitude },
                zoom: 15,
            });
        }

        if (!markerInstance.current) {
            markerInstance.current = new google.maps.Marker({
                map: mapInstance.current,
                draggable: true,
            });

            markerInstance.current.addListener("dragend", async () => {
                const pos = markerInstance.current.getPosition();
                if (!pos) return;

                const lat = pos.lat();
                const lng = pos.lng();

                const geocoder = new google.maps.Geocoder();

                geocoder.geocode(
                    { location: { lat, lng } },
                    (results: any[], status: string) => {
                        if (status === "OK" && results.length > 0) {
                            const place = results[0];

                            setData("location", {
                                ...location,
                                latitude: lat,
                                longitude: lng,
                                location_name: place.formatted_address,
                                place_id: place.place_id,
                                raw_place: place,
                            });
                        } else {
                            setData("location", {
                                ...location,
                                latitude: lat,
                                longitude: lng,
                            });
                        }
                    }
                );
            });
        }

        markerInstance.current.setPosition({
            lat: location.latitude,
            lng: location.longitude,
        });

        mapInstance.current.setCenter({
            lat: location.latitude,
            lng: location.longitude,
        });
    }, [mapsReady, location.latitude, location.longitude]);

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

            {/* Input */}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                    Search Location
                </label>
                <input
                    ref={inputRef}
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

            {/* Map */}

            {location.location_name && (
                <div className="mt-6">
                    <label className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <Map size={18} className="text-orange-600" />
                        Event Location on Map
                    </label>

                    <div className="relative w-full h-80 rounded-xl overflow-hidden border-4 border-orange-200 shadow-xl">
                        <div
                            ref={mapRef}
                            id="draggable-map"
                            className="absolute inset-0"
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                        <span className="flex items-center gap-2">
                            <MapPin size={16} className="text-orange-600" />
                            {location.location_name}
                        </span>
                        <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(
                                location.location_name
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 font-semibold hover:underline"
                        >
                            Open in Google Maps →
                        </a>
                    </div>
                </div>
            )}

            {/* How to get there */}

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
