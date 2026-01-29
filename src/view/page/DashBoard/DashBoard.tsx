import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllData } from "../../../slices/dashboardSlice.ts";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard.tsx";
import { getAllUsers, getCategorizedUsers } from "../../../slices/UserSlices.ts";
import { backendApi } from "../../../api.ts";
import { io } from "socket.io-client";
import { getAllTrips } from "../../../slices/TripSlice.ts";
import type { PopulatedTripDTO } from "../../../Model/trip.data.ts";
import type { UserData } from "../../../Model/userData.ts";
import { CustomerDashboard } from "./CustomerDashboard.tsx";
import { DriverDashboard } from "./DriverDashboard.tsx";

export function Dashboard() {
    const auth = useSelector((state: RootState) => state.auth);
    const dashboard = useSelector((state: RootState) => state.dashboard);
    const user = useSelector((state: RootState) => state.user);
    const trips = useSelector((state: RootState) => state.trip.list);
    const dispatch = useDispatch<AppDispatch>();
    const [initialLoading, setInitialLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userTrips, setUserTrips] = useState<PopulatedTripDTO[]>([]);
    const [activeUserTab, setActiveUserTab] = useState<'admins' | 'customers' | 'drivers'>('customers');

    // Helper function to get users for current tab
    const getCurrentTabUsers = (): UserData[] => {
        if (!user.categorized) return [];
        switch (activeUserTab) {
            case 'admins': return user.categorized.admins.users;
            case 'customers': return user.categorized.customers.users;
            case 'drivers': return user.categorized.drivers.users;
            default: return [];
        }
    };

    useEffect(() => {
        Promise.all([
            dispatch(getAllData()),
            dispatch(getAllUsers()),
            dispatch(getCategorizedUsers()),
            dispatch(getAllTrips())
        ]).finally(() => {
            setInitialLoading(false);
        });
    }, [dispatch]);

    useEffect(() => {
        const socket = io("http://localhost:3000", {
            transports: ["websocket"],
        });

        console.log("trying to connect socket...");

        socket.on("connect", () => console.log("Socket connected"));

        socket.on("mongo-change:users", () => {
            dispatch(getAllUsers());
            dispatch(getAllData());
        });

        socket.on("mongo-change:bookings", () => {
            dispatch(getAllData());
        });

        socket.on("mongo-change:trips", () => {
            dispatch(getAllData());
            dispatch(getAllTrips());
        });

        socket.on("mongo-change:vehicles", () => {
            dispatch(getAllData());
        });

        return () => {
            socket.off("mongo-change:users");
            socket.off("mongo-change:bookings");
            socket.off("mongo-change:trips");
            socket.off("mongo-change:vehicles");
            socket.disconnect();
        };
    }, [dispatch]);


    const handleDelete = (user_id: string) => async () => {
        const confirmed = window.confirm("Are you sure you want to delete this user?");
        if (confirmed) {
            try {
                await backendApi.delete(`/api/v1/users/delete/${user_id}`);
                dispatch(getAllUsers());
            } catch (err) {
                alert("Failed to delete user");
                console.error(err);
            }
        }
    };

    const handleViewDetails = (user: UserData) => {
        const userRelatedTrips = trips.filter(trip =>
            (user.role === 'customer' && trip.customerId?._id === user._id) ||
            (user.role === 'driver' && trip.driverId?._id === user._id)
        );
        setSelectedUser(user);
        setUserTrips(userRelatedTrips);
        setShowUserModal(true);
    };

    const UserDetailsModal = ({ user, trips, onClose }: { user: UserData, trips: PopulatedTripDTO[], onClose: () => void }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const tripsPerPage = 10;
        const totalPages = Math.ceil(trips.length / tripsPerPage);
        const startIndex = (currentPage - 1) * tripsPerPage;
        const paginatedTrips = trips.slice(startIndex, startIndex + tripsPerPage);

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
                <div className="bg-card-dark border border-border-dark rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-primary/90 to-primary p-6 rounded-t-2xl flex justify-between items-center z-10">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span>{user.role === 'admin' ? '🛡️' : user.role === 'driver' ? '🚗' : '👤'}</span>
                            User Profile
                        </h2>
                        <button onClick={onClose} className="text-white/80 hover:text-white text-3xl font-bold transition-colors">&times;</button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* User Profile Section */}
                        <div className="bg-bg-dark/50 p-6 rounded-xl border border-border-dark flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0">
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage.startsWith("http")
                                            ? user.profileImage
                                            : `http://localhost:3000/uploads/profile/${user.profileImage}`}
                                        alt={user.name}
                                        className="w-24 h-24 rounded-2xl object-cover border-2 border-primary shadow-lg"
                                    />
                                ) : (
                                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg ${user.role === 'admin' ? 'bg-purple-600' :
                                        user.role === 'driver' ? 'bg-green-600' : 'bg-primary'
                                        }`}>
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <h3 className="text-2xl font-bold text-text-light">{user.name}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                        user.role === 'driver' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            'bg-primary/20 text-primary border border-primary/30'
                                        }`}>
                                        {user.role}
                                    </span>
                                    {user.role === 'driver' && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isApproved
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                            }`}>
                                            {user.isApproved ? '✓ Approved' : '⏳ Pending'}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Email</p>
                                        <p className="text-text-light font-medium">{user.email}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">User ID</p>
                                        <p className="text-text-light font-mono text-xs truncate" title={user._id}>{user._id}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Contact</p>
                                        <p className="text-text-light font-medium">{user.contactNumber || '-'}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">NIC</p>
                                        <p className="text-text-light font-medium">{user.nic || '-'}</p>
                                    </div>
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Date of Birth</p>
                                        <p className="text-text-light font-medium">
                                            {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                    <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Gender</p>
                                        <p className="text-text-light font-medium capitalize">{user.gender || '-'}</p>
                                    </div>

                                    {/* Driver-specific fields */}
                                    {user.role === 'driver' && (
                                        <>
                                            <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Rating</p>
                                                <p className="text-text-light font-medium flex items-center gap-1">
                                                    <span className="text-yellow-400">⭐</span>
                                                    {user.averageRating?.toFixed(1) || '0.0'}
                                                    <span className="text-text-muted text-xs">({user.totalRatings || 0} reviews)</span>
                                                </p>
                                            </div>
                                            <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Experience</p>
                                                <p className="text-text-light font-medium">{user.experience || 0} trips</p>
                                            </div>
                                            <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Availability</p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isAvailable
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {user.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                                                </span>
                                            </div>
                                            <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Location</p>
                                                <p className="text-text-light font-medium text-xs truncate" title={user.location?.address}>
                                                    {user.location?.address || '-'}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Customer/Driver Trips count */}
                                    {user.role !== 'admin' && (
                                        <div className="bg-bg-dark/50 p-3 rounded-lg border border-border-dark">
                                            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Trips</p>
                                            <p className="text-primary font-bold text-lg">{trips.length}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Associated Trips Section */}
                        {user.role !== 'admin' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-text-light flex items-center gap-2">
                                        <span>🚖</span> Trip History
                                    </h3>
                                    {trips.length > 0 && (
                                        <span className="text-text-muted text-sm">
                                            Showing {startIndex + 1}-{Math.min(startIndex + tripsPerPage, trips.length)} of {trips.length}
                                        </span>
                                    )}
                                </div>
                                {trips.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto rounded-xl border border-border-dark">
                                            <table className="w-full text-sm">
                                                <thead className="bg-bg-dark text-text-muted uppercase text-xs">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left">Date</th>
                                                        <th className="px-4 py-3 text-left">Route</th>
                                                        <th className="px-4 py-3 text-left">Status</th>
                                                        <th className="px-4 py-3 text-left">Price</th>
                                                        <th className="px-4 py-3 text-left">Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-dark">
                                                    {paginatedTrips.map(trip => (
                                                        <tr key={trip._id} className="hover:bg-bg-dark/50 transition-colors">
                                                            <td className="px-4 py-3 text-text-light font-medium">
                                                                {trip.date ? new Date(trip.date).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-green-400 truncate max-w-[150px] text-xs" title={trip.startLocation}>📍 {trip.startLocation}</span>
                                                                    <span className="text-text-muted text-xs pl-1">↓</span>
                                                                    <span className="text-red-400 truncate max-w-[150px] text-xs" title={trip.endLocation}>📍 {trip.endLocation}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trip.status === 'Completed' || trip.status === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                                                    trip.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        trip.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                                                                            'bg-gray-500/20 text-gray-400'
                                                                    }`}>
                                                                    {trip.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-primary">
                                                                Rs. {trip.price?.toLocaleString() || '0'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${trip.tripType === 'Instant'
                                                                    ? 'bg-orange-500/20 text-orange-400'
                                                                    : 'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {trip.tripType === 'Instant' ? '⚡ Quick' : '📅 Scheduled'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-4">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1 rounded-lg bg-bg-dark border border-border-dark text-text-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
                                                >
                                                    ← Prev
                                                </button>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                        let page;
                                                        if (totalPages <= 5) page = i + 1;
                                                        else if (currentPage <= 3) page = i + 1;
                                                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                                        else page = currentPage - 2 + i;
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-bg-dark border border-border-dark text-text-light hover:bg-primary/20'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1 rounded-lg bg-bg-dark border border-border-dark text-text-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 bg-bg-dark/50 rounded-xl border border-border-dark">
                                        <p className="text-text-muted">No trips found for this user.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-card-dark border-t border-border-dark p-4 rounded-b-2xl flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const AddAdminModal = ({ onClose }: { onClose: () => void }) => {
        const [formData, setFormData] = useState({ name: "", email: "" });
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setLoading(true);
            try {
                const res = await backendApi.post("/api/v1/users/admin-create", formData);
                if (res.status === 201) {
                    alert("Admin created successfully! Credentials have been sent to their email.");
                    dispatch(getAllUsers());
                    onClose();
                }
            } catch (err: any) {
                alert(err.response?.data?.error || "Failed to create admin");
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
                <div className="bg-white rounded-lg shadow-2xl max-w-md w-full m-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Add New Administrator</h2>
                        <button onClick={onClose} className="text-2xl">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <p className="text-sm text-gray-500 italic mb-4">
                            Note: Password will be auto-generated and emailed to the new administrator.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. admin@example.com"
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md disabled:bg-blue-300"
                            >
                                {loading ? "Creating..." : "Create Admin"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (auth.role === 'customer') {
        return <CustomerDashboard />;
    }

    if (auth.role === 'driver') {
        return <DriverDashboard />;
    }

    if (initialLoading && dashboard.loading) {
        return <div className="text-center p-8 text-lg">Loading dashboard...</div>;
    }

    if (dashboard.error) {
        console.log("error", dashboard.error);
        return <div className="text-center p-8 text-red-600">Failed to load data</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 text-blue-700 text-center">Admin Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <DashboardCard label="Total Trips" value={dashboard.data?.totalTrips || 0} />
                <DashboardCard label="Completed Trips" value={dashboard.data?.completedTrips || 0} />
                <DashboardCard label="Bookings" value={dashboard.data?.totalBookings || 0} />
                <DashboardCard label="Users" value={dashboard.data?.totalUsers || 0} />
                <DashboardCard label="Drivers" value={dashboard.data?.totalDrivers || 0} />
                <DashboardCard label="Customers" value={dashboard.data?.totalCustomers || 0} />
                <DashboardCard label="Vehicles" value={dashboard.data?.totalVehicles || 0} />
                <DashboardCard label="Revenue" value={`Rs. ${dashboard.data?.totalRevenue || 0}`} />
                <DashboardCard label="Promo Savings" value={`Rs. ${dashboard.data?.totalPromoDiscount || 0}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Top Drivers Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🏆</span> Top Performing Drivers
                        </h2>
                    </div>
                    <div className="p-6">
                        {dashboard.data?.topDrivers?.length > 0 ? (
                            <div className="space-y-4">
                                {dashboard.data.topDrivers.map((driver: any, idx: number) => (
                                    <div key={driver._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-400 w-4">{idx + 1}.</span>
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                {driver.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{driver.name}</p>
                                                <p className="text-xs text-gray-500">{driver.totalRatings} ratings</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-yellow-500">⭐ {driver.averageRating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No rated drivers yet</p>
                        )}
                    </div>
                </div>

                {/* Trip Distribution Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📊</span> Trip Type Distribution
                        </h2>
                    </div>
                    <div className="p-6">
                        {dashboard.data?.tripDistribution?.map((item: any) => {
                            if (!item.type) return null;
                            const total = dashboard.data.totalTrips || 1;
                            const percentage = (item.count / total) * 100;
                            return (
                                <div key={item.type}>
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-gray-700">{item.type} Rides</span>
                                        <span className="text-gray-500">{item.count} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.type === 'Instant' ? 'bg-orange-500' :
                                                item.type === 'Scheduled' ? 'bg-blue-500' : 'bg-gray-400'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
                <button
                    onClick={() => setShowAddAdminModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md font-bold transition flex items-center gap-2"
                >
                    <span>➕</span> Add New Admin
                </button>
            </div>

            {/* User Category Tabs */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveUserTab('admins')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeUserTab === 'admins'
                            ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        <span>🛡️</span> Admins
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeUserTab === 'admins' ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {user.categorized?.admins.count || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveUserTab('customers')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeUserTab === 'customers'
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        <span>👤</span> Customers
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeUserTab === 'customers' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {user.categorized?.customers.count || 0}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveUserTab('drivers')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeUserTab === 'drivers'
                            ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        <span>🚗</span> Drivers
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeUserTab === 'drivers' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {user.categorized?.drivers.count || 0}
                        </span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className={`text-left text-sm ${activeUserTab === 'admins' ? 'bg-purple-100 text-purple-800' :
                                    activeUserTab === 'customers' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    {activeUserTab === 'drivers' && <th className="px-4 py-3">Status</th>}
                                    <th className="px-4 py-3 rounded-r-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {getCurrentTabUsers().map((tabUser) => (
                                    <tr key={tabUser._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {tabUser.profileImage ? (
                                                    <img
                                                        src={tabUser.profileImage.startsWith("http")
                                                            ? tabUser.profileImage
                                                            : `http://localhost:3000/uploads/profile/${tabUser.profileImage}`}
                                                        alt={tabUser.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${activeUserTab === 'admins' ? 'bg-purple-500' :
                                                        activeUserTab === 'customers' ? 'bg-blue-500' :
                                                            'bg-green-500'
                                                        }`}>
                                                        {tabUser.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-800">{tabUser.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{tabUser.email}</td>
                                        {activeUserTab === 'drivers' && (
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tabUser.isApproved
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {tabUser.isApproved ? 'Approved' : 'Pending'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(tabUser)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={handleDelete(tabUser._id || "")}
                                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {getCurrentTabUsers().length === 0 && (
                                    <tr>
                                        <td colSpan={activeUserTab === 'drivers' ? 4 : 3} className="px-4 py-8 text-center text-gray-500">
                                            No {activeUserTab} found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {showUserModal && selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    trips={userTrips}
                    onClose={() => {
                        setShowUserModal(false);
                        setSelectedUser(null);
                    }}
                />
            )}
            {showAddAdminModal && (
                <AddAdminModal onClose={() => setShowAddAdminModal(false)} />
            )}
        </div>
    );
}
