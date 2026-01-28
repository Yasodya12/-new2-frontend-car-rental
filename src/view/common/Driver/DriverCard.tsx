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
        <div className="relative group overflow-hidden bg-card-dark border border-border-dark rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1">
            <div className="relative flex flex-col h-full">
                {/* Header: Photo and Badges */}
                <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                        <img
                            className="h-20 w-20 object-cover rounded-2xl border border-border-dark shadow-sm"
                            src={imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=f8fafc&textColor=0f172a`}
                            alt={data.name}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card-dark shadow-md ${data.isAvailable ? 'bg-accent' : 'bg-danger'
                            }`}>
                            {data.isAvailable && <div className="w-full h-full rounded-full animate-ping bg-accent opacity-30"></div>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${data.isApproved ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-warning/10 text-warning border border-warning/20'
                            }`}>
                            {data.isApproved ? 'Operational' : 'Enrolling'}
                        </div>
                        <div className="flex items-center gap-1.5 bg-bg-dark px-2.5 py-1 rounded-lg border border-border-dark shadow-sm">
                            <span className="text-warning text-xs">★</span>
                            <span className="text-xs font-bold text-text-light">{data.averageRating?.toFixed(1) || "5.0"}</span>
                        </div>
                    </div>
                </div>

                {/* Operator Profile */}
                <div className="mb-6 flex-grow">
                    <h3 className="text-xl font-bold text-text-light group-hover:text-primary transition-colors">
                        {data.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-text-muted mt-1">
                        <span className="text-xs">📍</span>
                        <p className="text-[11px] font-semibold truncate" title={data.location?.address}>
                            {data.location?.address || "Region Not Identified"}
                        </p>
                    </div>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 gap-px bg-border-dark rounded-xl overflow-hidden mb-6 border border-border-dark shadow-sm">
                    <div className="bg-card-dark p-3 text-center">
                        <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">XP INDEX</p>
                        <p className="text-sm font-black text-text-light">{data.experience || 0} <span className="text-[10px] font-bold text-text-muted">Yrs</span></p>
                    </div>
                    <div className="bg-card-dark p-3 text-center">
                        <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">TOTAL OPS</p>
                        <p className="text-sm font-black text-text-light">{data.totalRatings || 0}</p>
                    </div>
                </div>

                {/* Tactics Cluster */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleBookNow}
                        className="w-full py-3.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                    >
                        Initiate Booking
                    </button>
                    {onViewDetails && (
                        <button
                            onClick={onViewDetails}
                            className="w-full py-3 bg-bg-dark hover:bg-border-dark text-text-muted hover:text-text-light text-xs font-bold uppercase tracking-widest rounded-xl border border-border-dark transition-all"
                        >
                            Review Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}