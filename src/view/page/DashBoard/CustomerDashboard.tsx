import { useEffect, useState } from "react";
import { backendApi } from "../../../api";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard";
import { FaRoute, FaDollarSign, FaCar } from 'react-icons/fa';
import { Link } from "react-router-dom";

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
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
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
            {/* Dynamic background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ backgroundColor: '#4F9CF9' }}></div>
                <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ backgroundColor: '#22C55E', animationDelay: '2s' }}></div>
                <div className="absolute top-1/3 -right-1/3 w-96 h-96 rounded-full opacity-10 blur-[100px] animate-pulse" style={{ backgroundColor: '#4F9CF9', animationDuration: '8s' }}></div>
            </div>

            <div className="relative z-10 py-8 px-4 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Sophisticated Light Header */}
                    <div className={`mb-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 transition-all duration-1000 delay-300 ${stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600/70">Dashboard</span>
                                <span className="text-gray-200 text-xs">/</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Overview</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
                                Overview.
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-white border border-gray-100 text-gray-500 px-6 py-3 rounded-xl font-bold text-xs transition-all hover:bg-gray-50 shadow-sm">
                                Export
                            </button>
                            <Link
                                to="/trips"
                                className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-100 transition-all hover:translate-y-[-2px] active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaCar className="text-xs" />
                                <span className="text-xs">Manage Trips</span>
                            </Link>
                        </div>
                    </div>

                    {/* Bento Grid Layout - Light Edition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-8">
                        {/* Highlights Row */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <DashboardCard
                                label="Total Trips"
                                value={stats.totalTrips}
                                icon={<FaRoute />}
                                color="primary"
                                trend="+12.5% vs last month"
                                progress={completionRate}
                            />
                            <DashboardCard
                                label="Total Spent"
                                value={`LKR ${(stats.totalSpent / 1000).toFixed(1)}K`}
                                icon={<FaDollarSign />}
                                color="warning"
                                trend="Avg LKR 1.2K per trip"
                            />
                        </div>

                        <div className="lg:col-span-4 bg-blue-600 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-blue-50 transition-all hover:translate-y-[-4px]">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 text-white">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-8 opacity-70">Insights</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-[10px] font-medium opacity-70">Success Rate</span>
                                        <span className="text-xl font-bold">{completionRate.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-[10px] font-medium opacity-70">Current Status</span>
                                        <span className="text-xl font-bold">{stats.activeBookingsCount > 0 ? 'Active' : 'Idle'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-medium opacity-70">Total Savings</span>
                                        <span className="text-xl font-bold">LKR {(stats.totalSavings / 1000).toFixed(1)}K</span>
                                    </div>
                                </div>
                            </div>
                            <Link to="/profile" className="relative z-10 w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-center transition-all hover:bg-gray-50 mt-6 shadow-sm">
                                View Profile
                            </Link>
                        </div>
                    </div>

                    {/* Active Status Banner - Refined */}
                    {stats.activeBookingsCount > 0 && (
                        <div className="relative mb-8 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/50 p-8 shadow-sm">
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-xl bg-white border border-amber-100 flex items-center justify-center shadow-sm">
                                        <FaCar className="text-amber-600 text-2xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">Active Trip Detected</h2>
                                        <p className="text-gray-500 text-sm">You have <span className="font-bold text-amber-600">{stats.activeBookingsCount}</span> active booking</p>
                                    </div>
                                </div>
                                <Link
                                    to="/trips"
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-amber-100 text-sm whitespace-nowrap"
                                >
                                    <span>View Details</span>
                                    <FaRoute className="text-xs" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Main Bento Content Row - Light Edition */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-8 flex flex-col shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
                                <Link to="/trips" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:opacity-70 transition-opacity">View All</Link>
                            </div>

                            <div className="space-y-3">
                                {stats.recentTrips.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest opacity-60 text-center">No journeys logged yet</p>
                                    </div>
                                ) : (
                                    stats.recentTrips.map((trip, idx) => (
                                        <div key={idx} className="group bg-gray-50/50 hover:bg-white hover:shadow-md rounded-xl p-4 border border-transparent hover:border-blue-50 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 transition-transform">
                                                    <FaRoute size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm tracking-tight">{trip.startLocation}</p>
                                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest opacity-60">To {trip.endLocation}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900 mb-1 tracking-tight">Rs. {trip.price.toLocaleString()}</p>
                                                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                                        trip.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
                                                            'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {trip.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Top Destinations */}
                        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-8 flex flex-col shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-8">Popular Destinations</h2>
                            <div className="space-y-3">
                                {stats.favoriteDestinations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest opacity-60 text-center">No data</p>
                                    </div>
                                ) : (
                                    stats.favoriteDestinations.map((dest, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-transparent group hover:bg-white hover:shadow-sm transition-all text-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="text-[10px] font-bold text-gray-300 w-4">0{idx + 1}</div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{dest.location}</p>
                                                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest opacity-60 mt-0.5">{dest.count} visits</p>
                                                </div>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Trends Section - Refined */}
                    {stats.monthlySpending.length > 0 && (
                        <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-sm transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Spending Trends</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Finances.</h2>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50/50 border border-gray-100 flex-1 max-w-[200px] text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Period</p>
                                    <p className="text-xl font-bold text-gray-900 tracking-tight">LKR {(stats.totalSpent / 1000).toFixed(1)}K</p>
                                </div>
                            </div>

                            <div className="relative pt-6">
                                <div className="flex items-end justify-between h-48 gap-4 px-2">
                                    {stats.monthlySpending.reverse().map((month, idx) => {
                                        const maxSpending = Math.max(...stats.monthlySpending.map(m => m.spending));
                                        const heightPercent = (month.spending / maxSpending) * 100;
                                        const isHighest = month.spending === maxSpending;

                                        return (
                                            <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                                <div className="w-full relative flex flex-col items-center">
                                                    <div
                                                        className={`w-full max-w-[24px] rounded-md transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden ${isHighest ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
                                                            }`}
                                                        style={{ height: `${Math.max(heightPercent, 12)}%` }}
                                                    >
                                                        <div className="absolute inset-x-0 top-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                                                            <span className="text-[7px] font-bold text-gray-900 whitespace-nowrap">{month.spending.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 text-center">
                                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${isHighest ? 'text-blue-600' : 'text-gray-300'} transition-colors duration-500`}>
                                                        {month._id || '•'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
