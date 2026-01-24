import type { UserData } from "../../../Model/userData.ts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";




type driverCardProps = {
    data: UserData;
    onViewDetails?: () => void;
}


export function DriverCard({ data, onViewDetails }: driverCardProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const navigate = useNavigate();


    useEffect(() => {
        if (data.profileImage) {
            setImageUrl(`http://localhost:3000/uploads/profile/${data.profileImage}`);
        }
    }, [data]);

    function handleBookNow() {
        navigate('/trips');
    }




    return (
        <div
            className="w-[220px] h-auto rounded-2xl shadow-md border border-gray-200 bg-white p-4 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col items-center">
                <div className="relative">
                    <img
                        className="h-[100px] w-[100px] object-cover rounded-full shadow-sm"
                        src={imageUrl || undefined}
                        alt={data.name}
                    />
                    {/* Approval Status Badge - Top Right */}
                    {data.isApproved ? (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                            Approved
                        </span>
                    ) : (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                            Pending
                        </span>
                    )}

                    {/* Availability Status Badge - Top Left */}
                    <span className={`absolute -top-1 -left-1 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 ${data.isAvailable ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                        {data.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>

                <h3 className="mt-3 text-sm font-bold text-gray-800">{data.name}</h3>

                {/* Rating Section */}
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs font-semibold text-gray-700">{data.averageRating?.toFixed(1) || "New"}</span>
                    <span className="text-[10px] text-gray-400">({data.totalRatings || 0})</span>
                </div>

                {/* Location Section */}
                <div className="flex items-center gap-1 mt-1 w-full justify-center">
                    <span className="text-[10px]">📍</span>
                    <p className="text-[10px] text-gray-500 truncate max-w-[150px]" title={data.location?.address}>
                        {data.location?.address || "No location set"}
                    </p>
                </div>



                <button
                    onClick={handleBookNow}
                    className="mt-4 w-full py-[6px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors duration-200"
                >
                    Book Now
                </button>

                {onViewDetails && (
                    <button
                        onClick={onViewDetails}
                        className="mt-2 w-full py-[6px] border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-md transition-colors duration-200"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>

    )
}