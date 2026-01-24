import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllData } from "../../../slices/dashboardSlice.ts";
import { DashboardCard } from "../../common/DashboardCard/DashboardCard.tsx";
import { getAllUsers } from "../../../slices/UserSlices.ts";
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

    useEffect(() => {
        Promise.all([
            dispatch(getAllData()),
            dispatch(getAllUsers()),
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

    const UserDetailsModal = ({ user, trips, onClose }: { user: UserData, trips: PopulatedTripDTO[], onClose: () => void }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-2xl font-bold">User Details</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-3xl font-bold">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Profile Section */}
                    <div className="bg-gray-50 p-6 rounded-lg flex items-start gap-6">
                        <div className="flex-shrink-0">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage.startsWith("http")
                                        ? user.profileImage
                                        : `http://localhost:3000/uploads/profile/${user.profileImage}`}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-4xl border-4 border-white shadow-md">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'driver' ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {user.role}
                                </span>
                                {user.role === 'driver' && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isApproved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {user.isApproved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Email</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">User ID</p>
                                    <p className="font-mono text-xs">{user._id}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Joined Date</p>
                                    <p className="font-medium">-</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Total Trips</p>
                                    <p className="font-medium">{trips.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Associated Trips Section */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>🚖</span> Associated Trips
                        </h3>
                        {trips.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Route</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Price</th>
                                            <th className="px-4 py-3">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {trips.map(trip => (
                                            <tr key={trip._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">
                                                    {trip.date ? new Date(trip.date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-green-600 truncate max-w-[150px]" title={trip.startLocation}>📍 {trip.startLocation}</span>
                                                        <span className="text-gray-400 text-xs pl-1">↓</span>
                                                        <span className="text-red-600 truncate max-w-[150px]" title={trip.endLocation}>📍 {trip.endLocation}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trip.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        trip.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {trip.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    Rs. {trip.price?.toLocaleString() || '0'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${trip.tripType === 'Instant' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {trip.tripType === 'Instant' ? 'Quick' : 'Extended'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                                <p>No trips found for this user.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-100 p-4 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

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
            <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse shadow rounded bg-white">
                    <thead>
                        <tr className="bg-blue-600 text-white text-left">
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {user.list.map((user) => (
                            <tr key={user._id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{user.name}</td>
                                <td className="px-4 py-2">{user.email}</td>
                                <td className="px-4 py-2 capitalize">{user.role}</td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => handleViewDetails(user)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={handleDelete(user._id || "")}
                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
