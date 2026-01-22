import { useEffect, useState } from "react";
import { backendApi } from "../../../api";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard";

interface DriverStats {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalEarnings: number;
    avgRating: number;
    completionRate: number;
    recentTrips: any[];
    monthlyEarnings: { _id: string; earnings: number }[];
    frequentRoutes: { route: string; count: number }[];
}

export function DriverDashboard() {
    const [stats, setStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await backendApi.get("/api/v1/dashboard/driver");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch driver dashboard:", err);
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
            <h1 className="text-3xl font-bold mb-8 text-green-700">Driver Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <DashboardCard label="Total Trips" value={stats.totalTrips} />
                <DashboardCard label="Completed" value={stats.completedTrips} />
                <DashboardCard label="Total Earnings" value={`Rs. ${stats.totalEarnings.toFixed(2)}`} />
                <DashboardCard label="Average Rating" value={`⭐ ${stats.avgRating.toFixed(1)}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Trips */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Trips</h2>
                    {stats.recentTrips.length === 0 ? (
                        <p className="text-gray-500">No trips yet</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.recentTrips.map((trip, idx) => (
                                <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
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
                                            <p className="text-sm font-bold mt-1 text-green-600">+Rs. {trip.price}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Performance Stats */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Performance</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Completion Rate</p>
                                <p className="text-2xl font-bold text-green-700">{stats.completionRate.toFixed(1)}%</p>
                            </div>
                            <span className="text-4xl">✅</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Average Rating</p>
                                <p className="text-2xl font-bold text-yellow-700">{stats.avgRating.toFixed(1)} / 5.0</p>
                            </div>
                            <span className="text-4xl">⭐</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold text-blue-700">Rs. {stats.totalEarnings.toFixed(2)}</p>
                            </div>
                            <span className="text-4xl">💰</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Frequent Routes */}
            {stats.frequentRoutes.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Most Frequent Routes</h2>
                    <div className="space-y-3">
                        {stats.frequentRoutes.map((route, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 border-b">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                                    <p className="font-medium">{route.route}</p>
                                </div>
                                <span className="text-gray-600 font-semibold">{route.count} trips</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Monthly Earnings Chart */}
            {stats.monthlyEarnings.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Earnings (Last 6 Months)</h2>
                    <div className="flex items-end justify-around h-64 gap-2">
                        {stats.monthlyEarnings.reverse().map((month, idx) => {
                            const maxEarnings = Math.max(...stats.monthlyEarnings.map(m => m.earnings));
                            const heightPercent = (month.earnings / maxEarnings) * 100;
                            return (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    <div
                                        className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-all relative group"
                                        style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                                    >
                                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            Rs. {month.earnings.toFixed(2)}
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
