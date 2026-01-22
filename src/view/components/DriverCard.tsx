import type { UserData } from "../../Model/userData";

interface DriverCardProps {
    driver: UserData;
    currentProvince?: string;
    onSelect?: (driverId: string) => void;
    isSelected?: boolean;
    isRecommendation?: boolean;
}

export function DriverCard({ driver, currentProvince, onSelect, isSelected, isRecommendation }: DriverCardProps) {
    const rating = driver.averageRating || 0;
    const experience = driver.experience || 0;
    const provincesVisited = driver.provincesVisited || [];

    // Find expertise in current province
    const visitData = currentProvince ? provincesVisited.find(p => p.province === currentProvince) : undefined;
    const visitCount = visitData ? visitData.count : 0;
    const isLocalExpert = visitCount > 0;
    const isTopRated = rating >= 4.5 && experience >= 10;
    const isRoadPro = experience >= 20;

    return (
        <div
            onClick={() => onSelect && onSelect(driver._id || "")}
            className={`cursor-pointer transition-all duration-300 p-4 rounded-xl border-2 ${isSelected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-md"
                } ${isRecommendation ? "relative overflow-hidden" : ""}`}
        >
            {isRecommendation && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Smart Match
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Profile Image / Initials */}
                <div className="relative">
                    {driver.profileImage ? (
                        <img
                            src={driver.profileImage}
                            alt={driver.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {driver.name.charAt(0)}
                        </div>
                    )}
                    {isTopRated && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 leading-tight">{driver.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-yellow-500">
                            <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                            <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <span className="text-gray-300 text-xs text-bold">|</span>
                        <span className="text-gray-600 text-xs font-medium">{experience} trips finished</span>
                    </div>
                </div>
            </div>

            {/* Expertise Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
                {isLocalExpert && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                        🏆 {currentProvince} Expert
                    </span>
                )}
                {isTopRated && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                        ⭐ Top Rated
                    </span>
                )}
                {isRoadPro && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">
                        🚗 Road Pro
                    </span>
                )}
            </div>

            {/* Mini Experience Map */}
            {isRecommendation && provincesVisited.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">Top Experience Areas</p>
                    <div className="flex flex-wrap gap-1">
                        {provincesVisited.slice(0, 3).map((p, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {p.province} ({p.count})
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
