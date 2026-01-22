import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store";
import { getAllTrips } from "../../../slices/TripSlice";
import { LocationPicker } from "../../common/Map/LocationPicker";
import type { PopulatedTripDTO } from "../../../Model/trip.data";

export function LiveFleetMap() {
    const dispatch = useDispatch<AppDispatch>();
    const tripState = useSelector((state: RootState) => state.trip);
    const trips = tripState.list || [];
    const loading = tripState.loading;
    const error = tripState.error;

    const [activeTrips, setActiveTrips] = useState<PopulatedTripDTO[]>([]);

    useEffect(() => {
        // Initial fetch
        dispatch(getAllTrips());

        // Poll for updates every 10 seconds (increased from 5 to reduce load)
        const interval = setInterval(() => {
            dispatch(getAllTrips());
        }, 10000);

        return () => clearInterval(interval);
    }, [dispatch]);

    useEffect(() => {
        if (trips && Array.isArray(trips)) {
            // Filter for trips that are actually in progress or confirmed
            const active = trips.filter(t => t.status === 'Processing' || t.status === 'Accepted');
            setActiveTrips(active);
        }
    }, [trips]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Live Fleet Map 🌍</h1>
                    <p className="text-gray-600">Real-time tracking of all active trips across the region.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center">
                        <span className="block text-2xl font-bold text-blue-600">{activeTrips.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold">Active Trips</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-center">
                        <span className="block text-2xl font-bold text-gray-400">{trips.length}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold">Total Trips</span>
                    </div>
                </div>
            </div>

            {loading && activeTrips.length === 0 && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
                    <span className="animate-spin">🔄</span> Refreshing live data...
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                    <strong>Error:</strong> {error}. Please check your connection.
                </div>
            )}

            {/* MASTER MAP - UNIFIED VIEW */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mb-8">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-lg text-blue-800">Global Fleet Overview</h2>
                        <p className="text-sm text-gray-500">
                            {activeTrips.length > 0
                                ? `Showing ${activeTrips.length} vehicles currently on the road.`
                                : "No vehicles are currently in active trips."}
                        </p>
                    </div>
                    {activeTrips.length > 0 && (
                        <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                                <span>Processing</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
                                <span>Accepted</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-[500px] w-full relative">
                    <LocationPicker
                        isReadOnly={true}
                        onLocationSelect={() => { }}
                        initialLocation={{ lat: 7.8731, lng: 80.7718 }} // Sri Lanka Center
                        fleetMarkers={activeTrips.map((t, index, array) => {
                            // PRIORITY: Use current position if available, else fallback to start point
                            // Note: Some legacy trips might not have coords at all
                            let lat = t.currentLat || t.startLat || 6.9271;
                            let lng = t.currentLng || t.startLng || 79.8612;

                            // Check for overlaps to add visual jitter
                            const isOverlapping = array.some((other, otherIdx) => {
                                if (index === otherIdx) return false;
                                const otherLat = other.currentLat || other.startLat || 6.9271;
                                const otherLng = other.currentLng || other.startLng || 79.8612;
                                return Math.abs(lat - otherLat) < 0.0001 && Math.abs(lng - otherLng) < 0.0001;
                            });

                            if (isOverlapping) {
                                const angle = (index * (360 / array.length)) * (Math.PI / 180);
                                const radius = 0.0005; // Slightly larger jitter
                                lat += Math.cos(angle) * radius;
                                lng += Math.sin(angle) * radius;
                            }

                            return {
                                lat,
                                lng,
                                label: `${t.vehicleId?.brand || 'Vehicle'} - ${t.driverId?.name || 'Driver'}`,
                                details: `${t.status === 'Processing' ? '🚀 In Progress' : '✅ Confirmed'} | From: ${t.startLocation.split(',')[0]} ➔ To: ${t.endLocation.split(',')[0]}`
                            };
                        })}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 font-bold">Active Trip Details</h3>
                <button
                    onClick={() => dispatch(getAllTrips())}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    Refresh List <span>⟳</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTrips.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-xl text-gray-500">No active trips at the moment.</p>
                        <p className="text-sm text-gray-400 mt-2">Vehicles will appear here when trips are 'Accepted' or 'Processing'.</p>
                    </div>
                ) : (
                    activeTrips.map(trip => (
                        <div key={trip._id as any} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{trip.driverId?.name || "Unknown Driver"}</h3>
                                        <p className="text-sm text-gray-500">{trip.vehicleId?.brand} {trip.vehicleId?.model}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${trip.status === 'Processing' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {trip.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-grow">
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wide">Route</span>
                                        <p className="font-medium text-gray-800 line-clamp-1" title={trip.startLocation}>
                                            <span className="text-green-600 mr-1">●</span> {trip.startLocation.split(',')[0]}
                                        </p>
                                        <div className="h-4 border-l border-gray-300 ml-[3px] my-1"></div>
                                        <p className="font-medium text-gray-800 line-clamp-1" title={trip.endLocation}>
                                            <span className="text-red-500 mr-1">●</span> {trip.endLocation.split(',')[0]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center mt-auto">
                                <span className="text-xs text-gray-400 font-mono">ID: {(trip._id as any)?.toString().substring(0, 8)}</span>
                                {trip.currentProgress !== undefined && (
                                    <div className="flex flex-col items-end flex-grow ml-4">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1 max-w-[100px]">
                                            <div
                                                className="bg-blue-600 h-1.5 rounded-full"
                                                style={{ width: `${Math.min(100, Math.max(0, trip.currentProgress))}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-600">
                                            {Math.round(trip.currentProgress)}% Trace
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

