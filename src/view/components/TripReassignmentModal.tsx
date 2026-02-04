import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/store";
import { reassignTrip } from "../../slices/TripSlice";
import { backendApi } from "../../api";

interface TripReassignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripDetails: {
        startLocation: string;
        endLocation: string;
        price: number;
        date: string;
        endDate?: string | null;
        startLat?: number;
        startLng?: number;
    };
    onRefresh?: () => void;
}

interface Driver {
    _id: string;
    name: string;
    email: string;
    averageRating?: number;
    experience?: number;
    location?: {
        lat: number;
        lng: number;
    };
}

export function TripReassignmentModal({ isOpen, onClose, tripId, tripDetails, onRefresh }: TripReassignmentModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            fetchAvailableDrivers();
        }
    }, [isOpen]);

    const fetchAvailableDrivers = async () => {
        setLoading(true);
        try {
            const { date, endDate, startLat, startLng } = tripDetails;
            const params: any = {};
            if (date) params.date = date;
            if (endDate) params.endDate = endDate;
            if (startLat) params.lat = startLat;
            if (startLng) params.lng = startLng;

            const response = await backendApi.get('/api/v1/users/drivers/nearby', { params });
            console.log("Fetched available drivers for reassign:", response.data.length);
            setAvailableDrivers(response.data);
        } catch (error) {
            console.error("Failed to fetch drivers", error);
            alert("Failed to load available drivers");
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async () => {
        if (!selectedDriverId) {
            alert("Please select a driver");
            return;
        }

        try {
            await dispatch(reassignTrip({ tripId, newDriverId: selectedDriverId })).unwrap();
            alert("Trip reassigned successfully!");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error: any) {
            alert(error || "Failed to reassign trip");
        }
    };

    const handleCancel = async () => {
        try {
            await backendApi.put(`/api/v1/trips/status/${tripId}`, { status: "Cancelled" });
            alert("Trip cancelled successfully!");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            alert("Failed to cancel trip");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-yellow-600 text-white p-6 rounded-t-xl">
                    <h2 className="text-2xl font-bold">⚠️ Trip Rejected by Driver</h2>
                    <p className="text-sm mt-2">Your driver has declined this trip. Please choose a new driver or cancel.</p>
                </div>

                <div className="p-6">
                    {/* Trip Details */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-gray-800 mb-2">Trip Details</h3>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">From:</span> {tripDetails.startLocation}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">To:</span> {tripDetails.endLocation}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">Price:</span> Rs. {tripDetails.price}
                        </p>
                    </div>

                    {/* Driver Selection */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">Select a New Driver</h3>

                        {loading ? (
                            <p className="text-center text-gray-500 py-4">Loading available drivers...</p>
                        ) : availableDrivers.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No drivers available at the moment</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availableDrivers.map((driver) => (
                                    <label
                                        key={driver._id}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition ${selectedDriverId === driver._id ? "bg-blue-100 border-blue-500" : "border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="driver"
                                            value={driver._id}
                                            checked={selectedDriverId === driver._id}
                                            onChange={(e) => setSelectedDriverId(e.target.value)}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-800">{driver.name}</div>
                                            <div className="text-xs text-gray-500">{driver.email}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {driver.averageRating && (
                                                    <span className="text-xs text-yellow-600">
                                                        ⭐ {driver.averageRating.toFixed(1)}
                                                    </span>
                                                )}
                                                {driver.experience && (
                                                    <span className="text-xs text-gray-500">
                                                        {driver.experience} years exp
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition"
                        >
                            Cancel Trip
                        </button>
                        <button
                            onClick={handleReassign}
                            disabled={!selectedDriverId || loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Reassign to Selected Driver
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
