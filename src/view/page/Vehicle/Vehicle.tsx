import React, { type ChangeEvent, useEffect, useState } from "react";
import type { VehicleData } from "../../../Model/vehicleData.ts";
import { backendApi } from "../../../api.ts";
import { VehicleCard } from "../../common/VehicleCard/VehicleCard.tsx";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllVehicles } from "../../../slices/vehicleSlices.ts";
import { VehicleModal } from "../../common/VehicleModel/VehicleModel.tsx";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";

import { ImageUpload } from "../../components/ImageUpload/ImageUpload.tsx";
import { FaCar } from 'react-icons/fa';

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
        <div className="min-h-screen bg-[#FDFDFF] px-6 lg:px-12 pb-12 pt-28 lg:pt-32 text-left font-sans">
            {/* 1. Header & Quick Metrics (Bento Style) */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-16">
                <div className="max-w-xl">
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">Fleet Explorer</h1>
                    <p className="text-lg text-gray-400 font-medium">Manage and optimize your global transportation assets with precision-engineered controls.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Fleet</span>
                        <span className="text-2xl font-bold text-gray-900">{(vehicleState.list || []).length} Units</span>
                    </div>
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Active Now</span>
                        <span className="text-2xl font-bold text-blue-700">98% Load</span>
                    </div>
                    <div className="hidden md:block p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Fleet Health</span>
                        <span className="text-2xl font-bold text-emerald-700">Optimal</span>
                    </div>
                </div>
            </div>

            {/* 2. Admin Command Center (Add/Update Form) */}
            {role === "admin" && (
                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold">
                            {isUpdateMode ? "↑" : "+"}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {isUpdateMode ? "Asset Configuration" : "Commission New Asset"}
                        </h2>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] p-10 lg:p-14 transition-all overflow-hidden relative">
                        {/* Decorative Background Accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

                        <form onSubmit={handleSubmit} className="relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                                {/* Technical Identity */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Technical Identity</span>
                                        <div className="space-y-6">
                                            {[
                                                { label: "Manufacturer Brand", name: "brand", placeholder: "e.g., Mercedes-Benz" },
                                                { label: "Model Designation", name: "model", placeholder: "e.g., Sprinter Elite" },
                                                { label: "Vehicle Display Name", name: "name", placeholder: "e.g., Alpha-One" }
                                            ].map((field) => (
                                                <div key={field.name} className="space-y-2">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                                                    <input
                                                        type="text"
                                                        name={field.name}
                                                        value={(formData as any)[field.name]}
                                                        onChange={handleChange}
                                                        placeholder={field.placeholder}
                                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-semibold placeholder:text-gray-300"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Specs */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Operational Specs</span>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Year</label>
                                                    <input type="text" name="year" value={formData.year} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-semibold" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Seats</label>
                                                    <input type="number" name="seats" value={formData.seats} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-semibold" required />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fleet Category</label>
                                                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-semibold appearance-none">
                                                    <option value="Economy">Economy</option>
                                                    <option value="Standard">Standard</option>
                                                    <option value="Luxury">Luxury</option>
                                                    <option value="Premium">Premium</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Price Per KM (LKR)</label>
                                                <input type="number" name="pricePerKm" value={formData.pricePerKm || ""} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-semibold" placeholder="Auto-calculated if empty" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Asset Presentation */}
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Asset Documentation</span>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vehicle Image Assets</label>
                                                <ImageUpload
                                                    onUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                                    initialImage={formData.image ? (formData.image.startsWith('http') ? formData.image : `http://localhost:3000/uploads/vehicle/${formData.image}`) : null}
                                                    label="Upload Technical Asset"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Technical Brief</label>
                                                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all font-semibold resize-none" required />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Management Section */}
                            <div className="mt-12 pt-12 border-t border-gray-50">
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-center">
                                    <div className="lg:col-span-3">
                                        <LocationPicker
                                            label="Primary Garage Terminal (Strategic Deployment)"
                                            onLocationSelect={(lat, lng, address) => {
                                                setGarageLocation({ lat, lng, address });
                                            }}
                                            initialLocation={formData.location && formData.location.lat && formData.location.lng ? { lat: formData.location.lat, lng: formData.location.lng } : undefined}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/10 active:scale-95 text-lg"
                                        >
                                            {isUpdateMode ? "Synchronize Asset" : "Deploy Fleet Unit"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsUpdateMode(false); setIsEditing(false); }}
                                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold transition-all active:scale-95"
                                        >
                                            Cancel Operation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Global Fleet Explorer (The List) */}
            <div className="mb-20">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Operational Fleet</h2>
                        <p className="text-gray-400 font-medium">Real-time status and availability across your transportation network.</p>
                    </div>
                    {role === "admin" && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center gap-3"
                        >
                            <span>+ Commission Unit</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {Array.isArray(vehicleState.list) && vehicleState.list.map((vehicle, i) => (
                        <div key={vehicle._id} className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="relative group">
                                <VehicleCard
                                    data={vehicle}
                                    onViewDetails={(v) => setSelectedVehicle(v)}
                                />
                                {role === "admin" && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleMaintenanceOpen(vehicle); }}
                                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-md hover:bg-red-50 hover:text-red-600 text-gray-500 text-[10px] font-bold px-4 py-2 rounded-full shadow-sm z-10 transition-all opacity-0 lg:group-hover:opacity-100 uppercase tracking-widest border border-gray-100"
                                    >
                                        Maintenance
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {(vehicleState.list || []).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-400 mb-6">
                            <FaCar size={24} />
                        </div>
                        <p className="text-xl font-bold text-gray-900">No Fleet Units Available</p>
                        <p className="text-gray-400 mt-2">Begin by commissioning your first transportation asset above.</p>
                    </div>
                )}
            </div>

            {/* 4. Modals */}
            {showMaintenanceModal && selectedMaintenanceVehicle && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] text-left">
                    <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 w-full max-w-xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto relative">
                        <button onClick={() => setShowMaintenanceModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Fleet Maintenance</h2>
                            <p className="text-gray-400 font-medium">Decommission unit from operational status for technical servicing.</p>
                        </div>

                        <div className="p-6 bg-yellow-50/50 border border-yellow-100 rounded-3xl mb-10 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600 border border-yellow-200">
                                <FaCar />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">{selectedMaintenanceVehicle.brand} {selectedMaintenanceVehicle.model}</p>
                                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mt-1">Status: Servicing Required</p>
                            </div>
                        </div>

                        {/* Existing Schedule */}
                        <div className="space-y-4 mb-10">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Current Maintenance Logs</span>
                            {selectedMaintenanceVehicle.maintenance && selectedMaintenanceVehicle.maintenance.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedMaintenanceVehicle.maintenance.map((m, index) => (
                                        <div key={index} className="flex justify-between items-center p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                            <div>
                                                <p className="text-sm font-bold text-red-600 mb-1">
                                                    {new Date(m.startDate).toLocaleDateString()} — {new Date(m.endDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs font-bold text-gray-500 italic">{m.reason || "Periodic Maintenance"}</p>
                                            </div>
                                            <button onClick={() => handleRemoveMaintenance(index)} className="text-[10px] font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors">Resolve</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                    <p className="text-sm font-bold text-gray-400">No pending maintenance sessions.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 pt-10 border-t border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-1">Schedule New Service Period</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                                    <input type="date" value={maintenanceForm.startDate} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, startDate: e.target.value }))} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 font-bold" min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">End Date</label>
                                    <input type="date" value={maintenanceForm.endDate} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, endDate: e.target.value }))} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 font-bold" min={maintenanceForm.startDate || new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Technical Reason</label>
                                <input type="text" placeholder="e.g. Engine Calibration" value={maintenanceForm.reason} onChange={(e) => setMaintenanceForm(prev => ({ ...prev, reason: e.target.value }))} className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 font-bold" />
                            </div>
                            <button onClick={handleAddMaintenance} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/10 active:scale-95 text-lg" disabled={!maintenanceForm.startDate || !maintenanceForm.endDate}>Execute Maintenance Log</button>
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
        </div>
    );
}
