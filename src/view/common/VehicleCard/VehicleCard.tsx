import type {VehicleData} from "../../../Model/vehicleData.ts";
import {useEffect, useState} from "react";

type VehicleCardProps = {
    data: VehicleData;
    onViewDetails: (vehicle: VehicleData) => void;
};

export function VehicleCard({data, onViewDetails}: VehicleCardProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (data.image) {
            setImageUrl(`http://localhost:3000/uploads/vehicle/${data.image}`);
        }
    }, [data]);

    return (
        <div className="max-w-xs w-full bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
            <img
                className="w-full h-40 object-cover rounded-t-2xl"
                src={imageUrl || undefined}
                alt={data.name}
            />

            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{data.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{data.brand} - {data.model}</p>

                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                    <span>Year: {data.year}</span>
                    <span>Seats: {data.seats}</span>
                </div>
                
                <div className="flex gap-2 mt-5">
                    <button
                        onClick={() => {}}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition"
                    >
                        Book Now
                    </button>
                    <button
                        onClick={() => onViewDetails(data)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md transition"
                    >
                        Details
                    </button>
                </div>
            </div>
        </div>
    );
}
