import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { searchAddress, getAddressFromCoordinates } from '../../../utils/mapUtils';

// Fix for default Leaflet icon not appearing correctly in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// A different color for fleet markers if needed, or just use default
const FleetIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LocationMarkerProps {
    setPosition: (pos: { lat: number; lng: number }) => void;
    setAddress: (address: string) => void;
    onSelect: (lat: number, lng: number, address: string) => void;
}

L.Marker.prototype.options.icon = DefaultIcon;

interface FleetMarker {
    lat: number;
    lng: number;
    label: string;
    details?: string;
}

interface LocationPickerProps {
    label?: string;
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    initialLocation?: { lat: number, lng: number };
    isReadOnly?: boolean;
    fleetMarkers?: FleetMarker[];
}

// Component to handle map clicks
const LocationMarker = ({ setPosition, setAddress, onSelect }: LocationMarkerProps) => {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition(e.latlng);
            const addr = await getAddressFromCoordinates(lat, lng);
            setAddress(addr);
            onSelect(lat, lng, addr);
        },
    });

    return null;
};

// Component to fit bounds if fleet markers are present
const FitBounds = ({ markers }: { markers: FleetMarker[] }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [markers, map]);
    return null;
};

// Component to fly to new location
const FlyToLocation = ({ coords }: { coords: { lat: number, lng: number } | null }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 13);
        }
    }, [coords, map]);
    return null;
};


const LocationPicker = ({ label, onLocationSelect, initialLocation, isReadOnly = false, fleetMarkers = [] }: LocationPickerProps) => {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
    const [searchQuery, setSearchQuery] = useState("");
    const [address, setAddress] = useState("No location selected");

    useEffect(() => {
        if (initialLocation) {
            setPosition(initialLocation);
            getAddressFromCoordinates(initialLocation.lat, initialLocation.lng).then(setAddress);
        }
    }, [initialLocation]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        const results = await searchAddress(searchQuery);
        if (results && results.length > 0) {
            const first = results[0];
            const lat = parseFloat(first.lat);
            const lng = parseFloat(first.lon);
            const newPos = { lat, lng };

            setPosition(newPos);
            setAddress(first.display_name);
            onLocationSelect(lat, lng, first.display_name);
        }
    };

    return (
        <div className="mb-4 w-full h-full">
            {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}

            {!isReadOnly && (
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Search for a place (e.g. Colombo)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Search
                    </button>
                </div>
            )}

            {!isReadOnly && <p className="text-sm text-gray-600 mb-2">Selected: <strong>{address}</strong></p>}

            <div className={`w-full border rounded overflow-hidden relative z-0 ${isReadOnly ? 'h-full min-h-[400px]' : 'h-[300px]'}`}>
                <MapContainer center={initialLocation || { lat: 7.8731, lng: 80.7718 }} zoom={isReadOnly ? 7 : 13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Main Single Marker */}
                    {position && !isReadOnly && <Marker position={position}></Marker>}

                    {/* Fleet Markers (Start Points or Current Points) */}
                    {fleetMarkers.map((m, idx) => (
                        <Marker key={`${idx}-${m.lat}-${m.lng}`} position={{ lat: m.lat, lng: m.lng }} icon={FleetIcon}>
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <p className="font-bold text-blue-700 border-b border-blue-100 pb-1 mb-1">{m.label}</p>
                                    {m.details && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{m.details}</p>}
                                    <div className="mt-2 text-[10px] text-gray-400">
                                        Coords: {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {!isReadOnly && <LocationMarker setPosition={setPosition} setAddress={setAddress} onSelect={onLocationSelect} />}

                    {/* Only fly if not in read-only mode (prevent jumping while observing fleet) */}
                    {!isReadOnly && <FlyToLocation coords={position} />}

                    {/* Auto-fit bounds for fleet overview */}
                    {isReadOnly && fleetMarkers.length > 0 && <FitBounds markers={fleetMarkers} />}
                </MapContainer>
            </div>
        </div>
    );
};


export { LocationPicker };
export type { FleetMarker };

