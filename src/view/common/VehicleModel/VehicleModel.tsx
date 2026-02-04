// components/VehicleModal.tsx
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";
import type { VehicleData } from "../../../Model/vehicleData";

type Props = {
    vehicle: VehicleData;
    onClose: () => void;
    onUpdate: (vehicle: VehicleData) => void;
    onDelete: (id: string) => void;
};

export function VehicleModal({ vehicle, onClose, onUpdate, onDelete }: Props) {
    const imageUrl = vehicle.image ? `http://localhost:3000/uploads/vehicle/${vehicle.image}` : "";
    const { role } = useSelector((state: RootState) => state.auth);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 text-left">
            <div className={`bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] w-full max-w-4xl overflow-hidden relative transition-all duration-500`}>
                {/* Close Button */}
                <button
                    className="absolute top-6 right-8 z-50 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    onClick={onClose}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="flex flex-col lg:flex-row h-full">
                    {/* Visual Section */}
                    <div className="lg:w-[45%] bg-gray-50 relative group">
                        <img
                            src={imageUrl}
                            alt={vehicle.name}
                            className="w-full h-full min-h-[300px] lg:min-h-[500px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent"></div>
                        <div className="absolute bottom-8 left-8">
                            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                                {vehicle.category} Fleet
                            </span>
                        </div>
                    </div>

                    {/* Technical Details Section */}
                    <div className="lg:w-[55%] p-10 lg:p-14 overflow-y-auto max-h-[80vh] lg:max-h-none">
                        <div className="mb-10">
                            <h2 className="text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-2">{vehicle.name}</h2>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{vehicle.brand} • {vehicle.model}</p>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            {[
                                { label: "Year", value: vehicle.year },
                                { label: "Color", value: vehicle.color },
                                { label: "Capacity", value: `${vehicle.seats} Passengers` },
                                { label: "Pricing", value: `LKR ${vehicle.pricePerKm}/km` }
                            ].map((spec, i) => (
                                <div key={i} className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">{spec.label}</span>
                                    <span className="text-base font-bold text-gray-800">{spec.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="mb-12">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 block">Fleet Intelligence Description</span>
                            <p className="text-gray-500 leading-relaxed font-medium">
                                {vehicle.description || "No technical description available for this unit."}
                            </p>
                        </div>

                        {/* Garage Location (Crucial Update) */}
                        <div className="mb-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Primary Garage Terminal</span>
                                <p className="text-sm font-bold text-gray-900 leading-snug">
                                    {(vehicle as any).location?.address || "Terminal Address Not Synchronized"}
                                </p>
                            </div>
                        </div>

                        {/* Admin Action Control */}
                        {role === "admin" && (
                            <div className="flex gap-4 pt-8 border-t border-gray-100">
                                <button
                                    className="flex-1 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-gray-200 active:scale-95"
                                    onClick={() => onUpdate(vehicle)}
                                >
                                    Modify Assets
                                </button>
                                <button
                                    className="px-8 py-4 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                                    onClick={() => vehicle._id && onDelete(vehicle._id)}
                                >
                                    Decommission
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
