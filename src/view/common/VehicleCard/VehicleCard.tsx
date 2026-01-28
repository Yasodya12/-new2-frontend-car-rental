import type { VehicleData } from "../../../Model/vehicleData.ts";
import { useEffect, useState } from "react";

type VehicleCardProps = {
    data: VehicleData;
    onViewDetails: (vehicle: VehicleData) => void;
};

export function VehicleCard({ data, onViewDetails }: VehicleCardProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (data.image) {
            setImageUrl(`http://localhost:3000/uploads/vehicle/${data.image}`);
        }
    }, [data]);

    return (
        <div
            onClick={() => onViewDetails(data)}
            className="group relative bg-white border border-gray-100 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.05)] hover:-translate-y-1 cursor-pointer"
        >
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-gray-50">
                <img
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={imageUrl || undefined}
                    alt={data.name}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{data.category}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{data.name}</h3>
                        <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">{data.brand} • {data.model}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Year</span>
                        <span className="text-sm font-bold text-gray-700">{data.year}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Seats</span>
                        <span className="text-sm font-bold text-gray-700">{data.seats} Passengers</span>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between group/btn">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Explore Details</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover/btn:translate-x-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
