import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllDrivers } from "../../../slices/driverSlices.ts";
import { useEffect } from "react";
import { DriverCard } from "../../common/Driver/DriverCard.tsx";
import { useState } from "react";
import { UserDetailsModal } from "../DashBoard/components/UserDetailsModal.tsx";
import { getAllTrips } from "../../../slices/TripSlice.ts";
import type { UserData } from "../../../Model/userData.ts";

export function Driver() {
    const dispatch = useDispatch<AppDispatch>();
    const driverState = useSelector((state: RootState) => state.driver);
    const trips = useSelector((state: RootState) => state.trip.list);
    const [selectedDriver, setSelectedDriver] = useState<UserData | null>(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const isAdmin = localStorage.getItem('role') === 'admin';

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            dispatch(getAllDrivers({ filter: activeFilter, search: searchQuery }));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [dispatch, activeFilter, searchQuery]);

    useEffect(() => {
        dispatch(getAllTrips());
    }, [dispatch]);

    const adminTabs = [
        { id: 'all', label: 'All Drivers', icon: '👥' },
        { id: 'approved', label: 'Approved', icon: '✅' },
        { id: 'pending', label: 'Pending', icon: '⏳' },
        { id: 'rejected_docs', label: 'Rejected Docs', icon: '❌' },
        { id: 'unavailable', label: 'Unavailable', icon: '🌙' },
    ];

    const userTabs = [
        { id: 'all', label: 'All Drivers', icon: '👥' },
        { id: 'available', label: 'Available', icon: '⚡' },
        { id: 'unavailable', label: 'Unavailable', icon: '🌙' },
    ];

    const filterTabs = isAdmin ? adminTabs : userTabs;

    return (
        <>
            <h1 className="text-center text-4xl font-black mb-2 text-blue-700 font-display">Drivers</h1>
            <p className="text-center text-gray-500 mb-8 font-medium italic">Manage and view our elite transport professionals</p>

            <div className="max-w-xl mx-auto mb-8 relative">
                <input
                    type="text"
                    placeholder="Search by Name, NIC, Phone, Address or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-white shadow-xl border border-blue-100/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-300"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl grayscale opacity-30 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">🔍</span>
            </div>

            <div className="flex justify-center mb-12">
                <div className="bg-white p-1.5 rounded-2xl shadow-xl border border-blue-50/50 flex flex-wrap gap-1 justify-center">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${activeFilter === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 -translate-y-0.5'
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
                {
                    driverState.list
                        .filter(driver => {
                            const role = localStorage.getItem('role');
                            if (role === 'admin') return true; // Admins see everything coming from backend
                            return driver.isApproved; // Others only see approved drivers
                        })
                        .map((driver) => (
                            <DriverCard
                                key={driver._id}
                                data={driver}
                                onViewDetails={() => setSelectedDriver(driver)}
                            />
                        ))
                }
            </div>

            {selectedDriver && (
                <UserDetailsModal
                    user={selectedDriver}
                    trips={trips.filter(t => t.driverId?._id === selectedDriver._id)}
                    onClose={() => setSelectedDriver(null)}
                />
            )}
        </>
    );
}