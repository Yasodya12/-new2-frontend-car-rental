import { useEffect, useState } from "react";
import { backendApi } from "../../../api";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard";

interface CustomerStats {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    pendingTrips: number;
    totalSpent: number;
    totalSavings: number;
    avgTripCost: number;
    activeBookingsCount: number;
    recentTrips: any[];
    monthlySpending: { _id: string; spending: number }[];
    favoriteDestinations: { location: string; count: number }[];
}

export function CustomerDashboard() {
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await backendApi.get("/api/v1/dashboard/customer");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch customer dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return <div className="p-6 text-center">Loading your dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-red-600">Failed to load dashboard</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 text-blue-700">My Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <DashboardCard label="Total Trips" value={stats.totalTrips} />
                <DashboardCard label="Completed" value={stats.completedTrips} />
                <DashboardCard label="Total Spent" value={`Rs. ${stats.totalSpent.toFixed(2)}`} />
                <DashboardCard label="Total Savings" value={`Rs. ${stats.totalSavings.toFixed(2)}`} />
            </div>

            {/* Active Status Banner */}
            {stats.activeBookingsCount > 0 && (
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-6 mb-10 text-white shadow-lg flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Ongoing Activity detected! 🚖</h2>
                        <p className="text-orange-50 underline font-medium">You have {stats.activeBookingsCount} trip(s) currently being processed or pending.</p>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-5xl animate-pulse">⚡</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Trips */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Trips</h2>
                    {stats.recentTrips.length === 0 ? (
                        <p className="text-gray-500">No trips yet. Book your first ride!</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentTrips.map((trip, idx) => (
                                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-800">{trip.startLocation}</p>
                                            <p className="text-sm text-gray-600">→ {trip.endLocation}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${trip.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                trip.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {trip.status}
                                            </span>
                                            <p className="text-sm font-bold mt-1">Rs. {trip.price}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Favorite Destinations */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Favorite Destinations</h2>
                    {stats.favoriteDestinations.length === 0 ? (
                        <p className="text-gray-500">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.favoriteDestinations.map((dest, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                        <p className="font-medium">{dest.location}</p>
                                    </div>
                                    <span className="text-gray-600 font-semibold">{dest.count} trips</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Spending Chart */}
            {stats.monthlySpending.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Spending (Last 6 Months)</h2>
                    <div className="flex items-end justify-around h-64 gap-2">
                        {stats.monthlySpending.reverse().map((month, idx) => {
                            const maxSpending = Math.max(...stats.monthlySpending.map(m => m.spending));
                            const heightPercent = (month.spending / maxSpending) * 100;
                            return (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all relative group"
                                        style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                                    >
                                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Rs. {month.spending.toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs mt-2 text-gray-600">{month._id}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}
