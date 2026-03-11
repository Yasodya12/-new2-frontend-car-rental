import { useEffect, useState } from "react";
import { backendApi } from "../../../api";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard";
import { FaRoute, FaCheckCircle, FaDollarSign, FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt, FaChartLine, FaCar, FaTrophy, FaMoneyBillWave, FaHistory, FaClock, FaTimesCircle } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { WithdrawalModal } from "./components/WithdrawalModal";

interface DriverStats {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    totalEarnings: number;
    totalRevenue: number;
    totalFees: number;
    avgRating: number;
    completionRate: number;
    walletBalance: number;
    recentTrips: any[];
    monthlyEarnings: { _id: string; earnings: number; revenue: number }[];
    frequentRoutes: { route: string; count: number }[];
}

interface Withdrawal {
    _id: string;
    amount: number;
    method: 'Cash' | 'Bank Transfer';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    requestedAt: string;
    processedAt?: string;
    rejectionReason?: string;
}

export function DriverDashboard() {
    const [stats, setStats] = useState<DriverStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

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
    }, [refreshKey]);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            try {
                const res = await backendApi.get("/api/v1/withdrawals/my");
                setWithdrawals(res.data);
            } catch (err) {
                console.error("Failed to fetch withdrawals:", err);
            }
        };
        fetchWithdrawals();
    }, [refreshKey]);

    const handleWithdrawalSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

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
                        {/* Large Featured Card - Earnings Breakdown */}
                        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                            {/*<DashboardCard*/}
                            {/*    label="Gross Fleet Revenue"*/}
                            {/*    value={`Rs. ${(stats.totalEarnings || 0).toLocaleString()}`}*/}
                            {/*    icon={<FaChartLine />}*/}
                            {/*    color="primary"*/}
                            {/*    size="large"*/}
                            {/*/>*/}
                            <div className="relative">
                                <DashboardCard
                                    label="Available Balance"
                                    value={`Rs. ${(stats.walletBalance || 0).toLocaleString()}`}
                                    icon={<FaDollarSign />}
                                    color="accent"
                                    size="large"
                                />
                                <button
                                    onClick={() => setShowWithdrawalModal(true)}
                                    disabled={!stats.walletBalance || stats.walletBalance <= 0}
                                    className="absolute bottom-4 right-4 bg-accent hover:bg-accent/90 text-bg-dark font-bold px-4 py-2 rounded-xl shadow-lg shadow-accent/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <FaMoneyBillWave />
                                    Withdraw
                                </button>
                            </div>
                        </div>
                        {/* Smaller Cards Grid */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-4 gap-6">
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
                                label="Total Earn"
                                value={`Rs. ${(stats.totalFees || 0).toLocaleString()}`}
                                icon={<FaDollarSign />}
                                color="danger"
                            />
                            <DashboardCard
                                label="Rating"
                                value={`${(stats.avgRating || 0).toFixed(1)}`}
                                icon={<FaStar />}
                                color="warning"
                            />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Recent Trips - Takes 2 columns */}
                        <div className="lg:col-span-2 bg-card-dark rounded-3xl border border-border-dark p-8 shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative z-10">
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
                                                className="group bg-card-dark rounded-2xl p-5 border border-border-dark hover:border-accent shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.01]"
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
                                                                            trip.status === 'Rejected' ? 'bg-danger/10 text-danger border border-danger/20' :
                                                                                'bg-warning/20 text-warning border border-warning/40'
                                                                        }`}>
                                                                        {trip.status}
                                                                    </span>
                                                                    {trip.rating && (
                                                                        <div className="flex items-center gap-1 text-warning font-bold text-sm">
                                                                            <FaStar className="text-xs" /> {(trip.rating || 0).toFixed(1)}
                                                                        </div>
                                                                    )}
                                                                    {trip.status === 'Rejected' && trip.rejectionReason && (
                                                                        <div className="flex items-center gap-1.5 text-danger/70 text-[10px] font-bold italic" title={trip.rejectionReason}>
                                                                            <FaRoute className="text-[8px]" /> {trip.rejectionReason.slice(0, 20)}...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-accent mb-1">+Rs. {trip.driverFee !== undefined && trip.driverFee > 0 ? trip.driverFee : ((trip.price || 0) * 0.20).toFixed(2)}</p>
                                                        <p className="text-xs text-text-muted">{trip.driverFee ? "Your Cut" : "Estimated Cut"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Stats - Sidebar */}
                        <div className="bg-card-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-text-light mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                                        <FaTrophy className="text-warning" />
                                    </div>
                                    Performance
                                </h2>
                                <div className="space-y-5">
                                    {/* Completion Rate - Circular Progress Style */}
                                    <div className="bg-card-dark rounded-2xl p-6 border border-border-dark hover:border-accent transition-all shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Completion Rate</p>
                                            <FaCheckCircle className="text-accent text-xl" />
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <p className="text-4xl font-black text-accent leading-none">{(stats.completionRate || 0).toFixed(1)}%</p>
                                            <div className="flex-1 h-3 bg-bg-dark rounded-full overflow-hidden mb-1">
                                                <div
                                                    className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-1000"
                                                    style={{ width: `${stats.completionRate || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating - Star Display */}
                                    <div className="bg-card-dark rounded-2xl p-6 border border-border-dark hover:border-warning transition-all shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Average Rating</p>
                                            <FaStar className="text-warning text-xl" />
                                        </div>
                                        <div className="flex items-end gap-4">
                                            <div>
                                                <p className="text-4xl font-black text-warning leading-none mb-2">{(stats.avgRating || 0).toFixed(1)}</p>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => {
                                                        console.log(stats.avgRating)
                                                        const rating = stats.avgRating || 0;
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

                                    {/* Net Earnings / Payout Card */}
                                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700/90 rounded-3xl p-8 border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/20 group relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <p className="text-xs font-bold text-white/90 uppercase tracking-[0.2em] mb-1">Your Net Payout</p>
                                                    <h3 className="text-3xl font-black text-white transition-colors">Rs. {(stats.walletBalance || 0).toLocaleString()}</h3>
                                                </div>
                                                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                                                    <FaDollarSign />
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-6 border-t border-white/10">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-white/80 font-medium">Service Fee Deducted</span>
                                                    <span className="text-white font-bold opacity-90">- Rs. {((stats.totalRevenue || 0) - (stats.totalEarnings || 0)).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Net Profit Margin</span>
                                                    <span className="text-xs font-black px-3 py-1 bg-white/20 text-white rounded-full">
                                                        {(stats.totalRevenue || 0) > 0 ? (((stats.totalEarnings || 0) / (stats.totalRevenue || 0)) * 100).toFixed(1) : "0.0"}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Frequent Routes & Earnings Chart Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Frequent Routes */}
                        {stats.frequentRoutes.length > 0 && (
                            <div className="lg:col-span-1 bg-card-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10">
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
                                                className="group bg-card-dark rounded-2xl p-5 border border-border-dark hover:border-primary shadow-sm hover:shadow-md transition-all"
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
                            </div>
                        )}

                        {/* Monthly Earnings Chart - Takes 2 columns */}
                        {stats.monthlyEarnings.length > 0 && (
                            <div className={`bg-card-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden group ${stats.frequentRoutes.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10">
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
                                            {[...stats.monthlyEarnings].reverse().map((month, idx) => {
                                                const earningsList = stats.monthlyEarnings.map(m => m.earnings);
                                                const maxEarnings = earningsList.length > 0 ? Math.max(...earningsList) : 1;
                                                const heightPercent = earningsList.length > 0 ? (month.earnings / maxEarnings) * 100 : 0;
                                                const isHighest = month.earnings === maxEarnings && maxEarnings > 0;

                                                return (
                                                    <div key={idx} className="flex flex-col items-center flex-1 group relative">
                                                        {/* Tooltip */}
                                                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-card-dark border border-border-dark text-text-light px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                                            Rs. {(month.earnings || 0).toFixed(2)}
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
                            </div>
                        )}
                        {/* Withdrawal History Section */}
                        {withdrawals.length > 0 && (
                            <div className="mb-8 bg-card-dark rounded-3xl border border-border-dark p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-black text-text-light mb-6 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                                            <FaHistory className="text-accent" />
                                        </div>
                                        Withdrawal History
                                    </h2>
                                    <div className="space-y-4">
                                        {withdrawals.slice(0, 5).map((withdrawal) => (
                                            <div
                                                key={withdrawal._id}
                                                className="bg-bg-dark rounded-2xl p-5 border border-border-dark flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${withdrawal.status === 'Completed' ? 'bg-accent/20 text-accent' :
                                                        withdrawal.status === 'Pending' ? 'bg-warning/20 text-warning' :
                                                            withdrawal.status === 'Rejected' ? 'bg-danger/20 text-danger' :
                                                                'bg-primary/20 text-primary'
                                                        }`}>
                                                        {withdrawal.status === 'Pending' ? <FaClock /> :
                                                            withdrawal.status === 'Rejected' ? <FaTimesCircle /> :
                                                                <FaCheckCircle />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-light">Rs. {withdrawal.amount.toLocaleString()}</p>
                                                        <p className="text-sm text-text-muted">{withdrawal.method} • {new Date(withdrawal.requestedAt).toLocaleDateString()}</p>
                                                        {withdrawal.status === 'Rejected' && withdrawal.rejectionReason && (
                                                            <p className="text-xs text-danger mt-1">{withdrawal.rejectionReason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-4 py-2 rounded-xl text-xs font-bold ${withdrawal.status === 'Completed' ? 'bg-accent/20 text-accent border border-accent/40' :
                                                    withdrawal.status === 'Pending' ? 'bg-warning/20 text-warning border border-warning/40' :
                                                        withdrawal.status === 'Rejected' ? 'bg-danger/20 text-danger border border-danger/40' :
                                                            'bg-primary/20 text-primary border border-primary/40'
                                                    }`}>
                                                    {withdrawal.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Withdrawal Modal */}
                <WithdrawalModal
                    isOpen={showWithdrawalModal}
                    onClose={() => setShowWithdrawalModal(false)}
                    walletBalance={stats.walletBalance || 0}
                    onSuccess={handleWithdrawalSuccess}
                />
            </div>
        </div>
    );
}
