import { useEffect, useState } from "react";
import { backendApi } from "../../../api";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard";
import { FaRoute, FaCheckCircle, FaDollarSign, FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt, FaChartLine, FaCar, FaTrophy } from 'react-icons/fa';
import { Link } from "react-router-dom";

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
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-danger text-lg">Failed to load dashboard</p>
                </div>
            </div>
        );
    }

    const completionRate = stats.totalTrips > 0 ? (stats.completedTrips / stats.totalTrips) * 100 : 0;

    return (
        <div className="min-h-screen bg-bg-dark relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 py-8 px-4 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Modern Header */}
                    <div className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-black text-text-light mb-3 leading-tight">
                                Driver Dashboard 🚗
                            </h1>
                            <p className="text-lg text-text-muted">Track your performance and earnings</p>
                        </div>
                        <Link
                            to="/trips"
                            className="bg-accent hover:bg-accent/90 text-bg-dark font-bold px-8 py-4 rounded-2xl shadow-lg shadow-accent/30 transition-all flex items-center gap-3 group self-start lg:self-auto"
                        >
                            <FaCar />
                            <span>View All Trips</span>
                            <FaRoute className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Featured Stats - Asymmetric Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                        {/* Large Featured Card - Earnings */}
                        <div className="lg:col-span-5">
                            <DashboardCard
                                label="Total Earnings"
                                value={`Rs. ${(stats.totalEarnings / 1000).toFixed(1)}K`}
                                icon={<FaDollarSign />}
                                color="accent"
                                size="large"
                            />
                        </div>
                        {/* Smaller Cards Grid */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <DashboardCard
                                label="Total Trips"
                                value={stats.totalTrips}
                                icon={<FaRoute />}
                                color="primary"
                            />
                            <DashboardCard
                                label="Completed"
                                value={stats.completedTrips}
                                icon={<FaCheckCircle />}
                                color="accent"
                                progress={completionRate}
                            />
                            <DashboardCard
                                label="Rating"
                                value={`${stats.avgRating.toFixed(1)}`}
                                icon={<FaStar />}
                                color="warning"
                            />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Recent Trips - Takes 2 columns */}
                        <div className="lg:col-span-2 bg-card-dark/60 backdrop-blur-2xl rounded-3xl border border-border-dark p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-text-light mb-1 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                            <FaRoute className="text-accent" />
                                        </div>
                                        Recent Trips
                                    </h2>
                                    <p className="text-text-muted text-sm">Your latest completed trips</p>
                                </div>
                                <Link
                                    to="/trips"
                                    className="text-accent text-sm font-bold hover:underline flex items-center gap-2"
                                >
                                    View All
                                    <FaRoute className="text-xs" />
                                </Link>
                            </div>
                            {stats.recentTrips.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
                                        <FaCar className="text-5xl text-accent opacity-50" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-light mb-2">No trips completed yet</h3>
                                    <p className="text-text-muted mb-6">Start accepting rides to see them here!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {stats.recentTrips.map((trip, idx) => (
                                        <div
                                            key={idx}
                                            className="group bg-bg-dark/40 rounded-2xl p-5 border border-border-dark/50 hover:border-accent/50 hover:bg-bg-dark/60 transition-all cursor-pointer transform hover:scale-[1.02]"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-2 h-2 rounded-full bg-accent"></div>
                                                        <p className="font-bold text-text-light text-lg">{trip.startLocation}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 pl-5">
                                                        <div className="w-0.5 h-8 bg-accent/30"></div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <FaMapMarkerAlt className="text-accent text-sm" />
                                                                <p className="text-text-muted">{trip.endLocation}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-3">
                                                                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${trip.status === 'Completed' ? 'bg-accent/20 text-accent border border-accent/40' :
                                                                    trip.status === 'Cancelled' ? 'bg-danger/20 text-danger border border-danger/40' :
                                                                        'bg-warning/20 text-warning border border-warning/40'
                                                                    }`}>
                                                                    {trip.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-accent mb-1">+Rs. {trip.price}</p>
                                                    <p className="text-xs text-text-muted">Earnings</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Performance Stats - Sidebar */}
                        <div className="bg-card-dark/60 backdrop-blur-2xl rounded-3xl border border-border-dark p-8 shadow-2xl">
                            <h2 className="text-2xl font-black text-text-light mb-8 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                                    <FaTrophy className="text-warning" />
                                </div>
                                Performance
                            </h2>
                            <div className="space-y-5">
                                {/* Completion Rate - Circular Progress Style */}
                                <div className="bg-bg-dark/40 rounded-2xl p-6 border border-border-dark/50 hover:border-accent/50 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Completion Rate</p>
                                        <FaCheckCircle className="text-accent text-xl" />
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <p className="text-4xl font-black text-accent leading-none">{stats.completionRate.toFixed(1)}%</p>
                                        <div className="flex-1 h-3 bg-bg-dark rounded-full overflow-hidden mb-1">
                                            <div
                                                className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-1000"
                                                style={{ width: `${stats.completionRate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rating - Star Display */}
                                <div className="bg-bg-dark/40 rounded-2xl p-6 border border-border-dark/50 hover:border-warning/50 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Average Rating</p>
                                        <FaStar className="text-warning text-xl" />
                                    </div>
                                    <div className="flex items-end gap-4">
                                        <div>
                                            <p className="text-4xl font-black text-warning leading-none mb-2">{stats.avgRating.toFixed(1)}</p>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    console.log(stats.avgRating)
                                                    const rating = stats.avgRating;
                                                    const isFull = star <= Math.floor(rating);
                                                    const isHalf = !isFull && star === Math.ceil(rating) && rating % 1 >= 0.3; // Show half if decimal >= 0.3

                                                    return (
                                                        <span key={star} className="text-sm text-yellow-400">
                                                            {isFull ? <FaStar /> : isHalf ? <FaStarHalfAlt /> : <FaRegStar className="text-gray-600" />}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-text-muted text-sm mb-1">/ 5.0</p>
                                    </div>
                                </div>

                                {/* Total Earnings */}
                                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border-2 border-accent/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Total Earnings</p>
                                        <FaDollarSign className="text-accent text-xl" />
                                    </div>
                                    <p className="text-3xl font-black text-accent">Rs. {stats.totalEarnings.toFixed(2)}</p>
                                    <p className="text-xs text-text-muted mt-2">All time earnings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Frequent Routes & Earnings Chart Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Frequent Routes */}
                        {stats.frequentRoutes.length > 0 && (
                            <div className="lg:col-span-1 bg-card-dark/60 backdrop-blur-2xl rounded-3xl border border-border-dark p-8 shadow-2xl">
                                <h2 className="text-2xl font-black text-text-light mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                        <FaMapMarkerAlt className="text-primary" />
                                    </div>
                                    Top Routes
                                </h2>
                                <div className="space-y-4">
                                    {stats.frequentRoutes.slice(0, 5).map((route, idx) => (
                                        <div
                                            key={idx}
                                            className="group bg-bg-dark/40 rounded-2xl p-5 border border-border-dark/50 hover:border-primary/50 hover:bg-bg-dark/60 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-warning to-warning/70 text-bg-dark' :
                                                        idx === 1 ? 'bg-gradient-to-br from-text-muted to-text-muted/70 text-bg-dark' :
                                                            'bg-gradient-to-br from-primary to-primary/70 text-white'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-light">{route.route}</p>
                                                        <p className="text-xs text-text-muted mt-1">{route.count} {route.count === 1 ? 'trip' : 'trips'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monthly Earnings Chart - Takes 2 columns */}
                        {stats.monthlyEarnings.length > 0 && (
                            <div className={`bg-card-dark/60 backdrop-blur-2xl rounded-3xl border border-border-dark p-8 shadow-2xl ${stats.frequentRoutes.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-text-light mb-2 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                            <FaChartLine className="text-accent" />
                                        </div>
                                        Earnings Trend
                                    </h2>
                                    <p className="text-text-muted text-sm">Your monthly earnings over the last 6 months</p>
                                </div>
                                <div className="relative">
                                    <div className="flex items-end justify-between h-72 gap-4">
                                        {stats.monthlyEarnings.reverse().map((month, idx) => {
                                            const maxEarnings = Math.max(...stats.monthlyEarnings.map(m => m.earnings));
                                            const heightPercent = (month.earnings / maxEarnings) * 100;
                                            const isHighest = month.earnings === maxEarnings;

                                            return (
                                                <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-card-dark border border-border-dark text-text-light px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                                        Rs. {month.earnings.toFixed(2)}
                                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border-dark"></div>
                                                    </div>

                                                    {/* Bar */}
                                                    <div className="w-full relative flex flex-col items-center">
                                                        <div
                                                            className={`w-full rounded-t-2xl transition-all duration-500 relative overflow-hidden group/bar ${isHighest
                                                                ? 'bg-gradient-to-t from-accent via-accent/90 to-accent/70 shadow-lg shadow-accent/50'
                                                                : 'bg-gradient-to-t from-accent/70 via-accent/60 to-accent/50'
                                                                }`}
                                                            style={{ height: `${heightPercent}%`, minHeight: '40px' }}
                                                        >
                                                            {/* Animated shine effect */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover/bar:translate-x-full transition-transform duration-1000"></div>
                                                        </div>
                                                    </div>

                                                    {/* Month Label */}
                                                    <div className="mt-4 text-center">
                                                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{month._id}</p>
                                                        {isHighest && (
                                                            <div className="mt-1 w-2 h-2 rounded-full bg-accent mx-auto"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Chart Grid Lines */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {[0, 25, 50, 75, 100].map((percent) => (
                                            <div
                                                key={percent}
                                                className="absolute left-0 right-0 border-t border-border-dark/30"
                                                style={{ bottom: `${percent}%` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
