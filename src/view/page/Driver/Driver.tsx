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
        <div className="min-h-screen bg-bg-dark pt-12 pb-24 px-6 lg:px-16">
            {/* Command Header */}
            <div className="max-w-[1600px] mx-auto mb-12 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                <div className="relative">
                    <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                        <span className="w-8 h-[2px] bg-primary/20"></span>
                        Fleet Operations / Personnel
                    </div>
                    <h1 className="text-4xl font-extrabold text-text-light tracking-tight">
                        Active Fleet <span className="text-primary font-black">Registry</span>
                    </h1>
                    <p className="mt-2 text-text-muted font-medium text-sm max-w-xl">
                        Monitor and manage professional transport specialists across the operational network.
                    </p>
                </div>

                {/* Search Cluster */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search operator ID or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-80 bg-card-dark border border-border-dark rounded-xl px-12 py-3.5 text-sm text-text-light placeholder:text-text-muted/60 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-primary transition-colors">
                            🔍
                        </span>
                    </div>
                </div>
            </div>

            {/* Tactical Filtering HUD */}
            <div className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row items-center justify-between border-b border-border-dark">
                <div className="flex gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`pb-4 px-4 text-sm font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${activeFilter === tab.id
                                ? 'text-text-light'
                                : 'text-text-muted hover:text-text-light/60'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {activeFilter === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.3)]"></div>
                            )}
                        </button>
                    ))}
                </div>
                <div className="hidden md:flex items-center gap-4 py-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-border-dark rounded-full shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                        <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{driverState.list.length} Records Active</span>
                    </div>
                </div>
            </div>

            {/* Deployment Grid */}
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {
                    driverState.list
                        .filter(driver => {
                            const role = localStorage.getItem('role');
                            if (role === 'admin') return true;
                            return driver.isApproved;
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
        </div>
    );
}