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

    useEffect(() => {
        dispatch(getAllDrivers());
        dispatch(getAllTrips());
    }, [dispatch]);


    return (
        <>
            <h1 className=" text-center text-3xl font-bold mb-8 text-blue-700">Drivers</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12">
                {
                    driverState.list
                        .filter(driver => {
                            const role = localStorage.getItem('role');
                            if (role === 'admin') return true; // Admins see everything
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