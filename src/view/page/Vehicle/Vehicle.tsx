import { type ChangeEvent, useEffect, useState } from "react";
import type { VehicleData } from "../../../Model/vehicleData.ts";
import { backendApi } from "../../../api.ts";
import { VehicleCard } from "../../common/VehicleCard/VehicleCard.tsx";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllVehicles } from "../../../slices/vehicleSlices.ts";
import { VehicleModal } from "../../common/VehicleModel/VehicleModel.tsx";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";

import { ImageUpload } from "../../components/ImageUpload/ImageUpload.tsx";

export function Vehicle() {
    const [formData, setFormData] = useState<VehicleData>({
        brand: "",
        name: "",
        model: "",
        year: "",
        color: "",
        seats: 0,
        description: "",
        image: "",
        category: "Standard",
        pricePerKm: 0
    });

    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Location state for garage location
    const [garageLocation, setGarageLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const role = localStorage.getItem('role');

    const dispatch = useDispatch<AppDispatch>();
    const vehicleState = useSelector((state: RootState) => state.vehicle);

    useEffect(() => {
        dispatch(getAllVehicles());
    }, []);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "seats" || name === "pricePerKm" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Add location data for vehicles
            if (!garageLocation) {
                alert("Please select the garage location on the map.");
                return;
            }
            (formData as any).location = {
                lat: garageLocation.lat,
                lng: garageLocation.lng,
                address: garageLocation.address
            };

            let response;

            if (isUpdateMode) {
                response = await backendApi.put(`/api/v1/vehicles/update/${formData._id}`, formData);
            } else {
                response = await backendApi.post("/api/v1/vehicles/add", formData);
            }

            if (response.status === 200 || response.status === 201) {
                alert(isUpdateMode ? "Vehicle updated successfully." : "Vehicle added successfully.");
                dispatch(getAllVehicles());
                // Reset form
                setFormData({
                    brand: "",
                    name: "",
                    model: "",
                    year: "",
                    color: "",
                    seats: 0,
                    description: "",
                    image: "",
                    category: "Standard",
                    pricePerKm: 0
                });
                setGarageLocation(null);
                setIsUpdateMode(false);
                setIsEditing(false);
            } else {
                alert("Operation failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        }
    }

    const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

    const handleDeleteVehicle = async (id: string) => {
        try {
            await backendApi.delete(`/api/v1/vehicles/delete/${id}`);
            dispatch(getAllVehicles());
            setSelectedVehicle(null);
            alert("Vehicle deleted.");
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    const handleUpdateVehicle = (vehicle: VehicleData) => {
        setFormData(vehicle);
        if (vehicle.location) {
            setGarageLocation({
                lat: vehicle.location.lat || 6.9271,
                lng: vehicle.location.lng || 79.8612,
                address: vehicle.location.address || ""
            });
        } else {
            setGarageLocation(null);
        }
        setIsUpdateMode(true);
        setIsEditing(true);
        setSelectedVehicle(null);
    };

    // Maintenance State
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [selectedMaintenanceVehicle, setSelectedMaintenanceVehicle] = useState<VehicleData | null>(null);
    const [maintenanceForm, setMaintenanceForm] = useState<{ startDate: string; endDate: string; reason: string }>({
        startDate: "",
        endDate: "",
        reason: ""
    });

    const handleMaintenanceOpen = (vehicle: VehicleData) => {
        setSelectedMaintenanceVehicle(vehicle);
        setShowMaintenanceModal(true);
        setMaintenanceForm({ startDate: "", endDate: "", reason: "" });
    };

    const handleAddMaintenance = async () => {
        if (!selectedMaintenanceVehicle || !selectedMaintenanceVehicle._id) return;
        if (!maintenanceForm.startDate || !maintenanceForm.endDate) {
            alert("Please select start and end dates.");
            return;
        }

        const newMaintenance = {
            startDate: new Date(maintenanceForm.startDate),
            endDate: new Date(maintenanceForm.endDate),
            reason: maintenanceForm.reason
        };

        const updatedMaintenanceList = [
            ...(selectedMaintenanceVehicle.maintenance || []),
            newMaintenance
        ];

        try {
            // Update vehicle with new maintenance list
            const updatedVehicle = { ...selectedMaintenanceVehicle, maintenance: updatedMaintenanceList };
            const response = await backendApi.put(`/api/v1/vehicles/update/${selectedMaintenanceVehicle._id}`, updatedVehicle);

            if (response.status === 200 || response.status === 201) {
                alert("Maintenance period added.");
                // Update local state to reflect change immediately
                setSelectedMaintenanceVehicle({ ...selectedMaintenanceVehicle, maintenance: updatedMaintenanceList });
                dispatch(getAllVehicles()); // Refresh list
                setMaintenanceForm({ startDate: "", endDate: "", reason: "" });
            }
        } catch (error) {
            console.error(error);
            alert("Failed to add maintenance period");
        }
    };

    const handleRemoveMaintenance = async (index: number) => {
        if (!selectedMaintenanceVehicle || !selectedMaintenanceVehicle._id) return;

        const updatedMaintenanceList = [...(selectedMaintenanceVehicle.maintenance || [])];
        updatedMaintenanceList.splice(index, 1);

        try {
            const updatedVehicle = { ...selectedMaintenanceVehicle, maintenance: updatedMaintenanceList };
            const response = await backendApi.put(`/api/v1/vehicles/update/${selectedMaintenanceVehicle._id}`, updatedVehicle);

            if (response.status === 200 || response.status === 201) {
                alert("Maintenance period removed.");
                setSelectedMaintenanceVehicle({ ...selectedMaintenanceVehicle, maintenance: updatedMaintenanceList });
                dispatch(getAllVehicles());
            }
        } catch (error) {
            console.error(error);
            alert("Failed to remove maintenance period");
        }
    };


    return (
        <>
            {role === "admin" && (
                <>
                    {isUpdateMode ? (
                        <h1 className="text-3xl text-center font-bold mb-8 text-blue-700">Update Vehicle</h1>
                    ) :
                        <h1 className="text-3xl text-center font-bold mb-8 text-blue-700">Add Vehicle</h1>

                    }
                    <div className="flex flex-col gap-8 bg-white rounded-xl shadow-lg p-6 md:p-10">
                        <form
                            onSubmit={handleSubmit}
                            className="w-full grid grid-cols-1 gap-4"
                        >
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.model}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Year</label>
                                <input
                                    type="text"
                                    name="year"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Color</label>
                                <input
                                    type="text"
                                    name="color"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.color}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.category || "Standard"}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Economy">Economy (Rs. 50/km)</option>
                                    <option value="Standard">Standard (Rs. 80/km)</option>
                                    <option value="Luxury">Luxury (Rs. 150/km)</option>
                                    <option value="Premium">Premium (Rs. 250/km)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Price Per Km (LKR)</label>
                                <input
                                    type="number"
                                    name="pricePerKm"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.pricePerKm || ""}
                                    onChange={handleChange}
                                    placeholder="Leave empty for auto-pricing"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave 0 or empty to use default category price</p>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Seats</label>
                                <input
                                    type="number"
                                    name="seats"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.seats}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Image</label>
                                <ImageUpload
                                    onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                    initialImage={formData.image ? (formData.image.startsWith('http') ? formData.image : `http://localhost:3000/uploads/vehicle/${formData.image}`) : null}
                                    label="Vehicle Image"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <LocationPicker
                                    label="Garage Location (Required)"
                                    onLocationSelect={(lat, lng, address) => {
                                        setGarageLocation({ lat, lng, address });
                                    }}
                                    initialLocation={formData.location && formData.location.lat && formData.location.lng ? { lat: formData.location.lat, lng: formData.location.lng } : undefined}

                                />
                            </div>

                            <div className="text-right mt-2 md:col-span-2">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-md transition"
                                >
                                    {isUpdateMode ? "Update Vehicle" : "Add Vehicle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {!isEditing && (
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Vehicle List</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {vehicleState.list.map((vehicle) => (
                            <div key={vehicle._id} className="relative group">
                                <VehicleCard
                                    data={vehicle}
                                    onViewDetails={(v) => setSelectedVehicle(v)}
                                />
                                {role === "admin" && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMaintenanceOpen(vehicle);
                                        }}
                                        className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Maintenance
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Maintenance Modal */}
            {showMaintenanceModal && selectedMaintenanceVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold">Maintenance Schedule</h2>
                            <button onClick={() => setShowMaintenanceModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="mb-4">
                            <h3 className="font-semibold text-gray-700 mb-2">{selectedMaintenanceVehicle.brand} {selectedMaintenanceVehicle.model}</h3>
                            <p className="text-sm text-gray-500 mb-4">Add maintenance periods to mark this vehicle as unavailable for trips.</p>

                            {/* Existing Maintenance List */}
                            {selectedMaintenanceVehicle.maintenance && selectedMaintenanceVehicle.maintenance.length > 0 ? (
                                <ul className="space-y-2 mb-4 bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                                    {selectedMaintenanceVehicle.maintenance.map((m, index) => (
                                        <li key={index} className="flex justify-between items-start text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-red-600">
                                                    {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-gray-600 italic">{m.reason || "Scheduled Maintenance"}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMaintenance(index)}
                                                className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-green-600 italic mb-4">No maintenance scheduled. Vehicle is fully available.</p>
                            )}
                        </div>

                        {/* Add New Maintenance Form */}
                        <div className="bg-gray-100 p-4 rounded-md">
                            <h4 className="font-semibold text-sm mb-3">Add Maintenance Period</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={maintenanceForm.startDate}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full text-sm border-gray-300 rounded-md p-1.5"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={maintenanceForm.endDate}
                                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full text-sm border-gray-300 rounded-md p-1.5"
                                        min={maintenanceForm.startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Oil Change, Engine Repair"
                                    value={maintenanceForm.reason}
                                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full text-sm border-gray-300 rounded-md p-1.5"
                                />
                            </div>
                            <button
                                onClick={handleAddMaintenance}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition"
                                disabled={!maintenanceForm.startDate || !maintenanceForm.endDate}
                            >
                                Add Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedVehicle && (
                <VehicleModal
                    vehicle={selectedVehicle}
                    onClose={() => setSelectedVehicle(null)}
                    onUpdate={handleUpdateVehicle}
                    onDelete={handleDeleteVehicle}
                />
            )}

        </>
    );
}
