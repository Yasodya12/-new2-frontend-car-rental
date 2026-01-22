import { useEffect, useState, type ChangeEvent, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { backendApi } from "../../../api";
import type { BookingData, PopulatedBookingDTO } from "../../../Model/bookingData";
import { getAllTrips } from "../../../slices/TripSlice";
import type { AppDispatch, RootState } from "../../../store/store";
import { getAllUsers, getUserByEmail } from "../../../slices/UserSlices.ts";
import type { UserData } from "../../../Model/userData.ts";
import { getUserFromToken } from "../../../auth/auth.ts";
import { RatingModal } from "../../components/RatingModal/RatingModal.tsx";

export function Booking() {
    const dispatch = useDispatch<AppDispatch>();
    const [bookings, setBookings] = useState<PopulatedBookingDTO[]>([]);
    const [bookingData, setBookingData] = useState<BookingData>({
        customerId: "",
        tripId: "",
        bookingDate: new Date(),
        status: "Pending",
        notes: "",
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const accessToken = localStorage.getItem("accessToken");
    const {
        loadingAll,
        loadingByEmail,
        errorAll,
        errorByEmail,
        list
    } = useSelector((state: RootState) => state.user);
    const trips = useSelector((state: RootState) => state.trip.list);
    // const [formLoading, setFormLoading] = useState(false);
    const [ratingModal, setRatingModal] = useState<{
        show: boolean;
        tripId: string;
        driverId: string;
        driverName: string;
    } | null>(null);
    const [ratedTrips, setRatedTrips] = useState<Set<string>>(new Set());

    useEffect(() => {
        dispatch(getAllUsers());
        dispatch(getAllTrips());

        if (accessToken) {
            const email = getUserFromToken(accessToken)?.email;
            console.log("Email:", email);

            dispatch(getUserByEmail(email))
                .unwrap()
                .then((userData) => {
                    console.log("Fetched user:", userData);
                    setUser(userData);

                    if (userData.role === "customer") {
                        setBookingData((prev) => ({
                            ...prev,
                            customerId: userData._id,
                        }));
                    }

                    fetchBookings(userData);

                    // Check which trips have been rated
                    checkRatedTrips();
                })
                .catch((err) => {
                    console.error("Failed to fetch user by email:", err);
                });

        }
    }, [dispatch]);

    const checkRatedTrips = async () => {
        try {
            if (user?.role === "customer") {
                const bookingsResponse = await backendApi.get(`/api/v1/booking/all-by-customer/${user._id}`);
                const allBookings = bookingsResponse.data;

                const ratedSet = new Set<string>();
                for (const booking of allBookings) {
                    if (booking.tripId?._id && (booking.status === "Confirmed" || booking.tripId?.status === "Completed")) {
                        try {
                            const ratingResponse = await backendApi.get(`/api/v1/ratings/trip/${booking.tripId._id}`);
                            if (ratingResponse.data) {
                                ratedSet.add(booking.tripId._id);
                            }
                        } catch (error) {
                            // No rating exists, which is fine
                            console.log(error)
                        }
                    }
                }
                setRatedTrips(ratedSet);
            }
        } catch (error) {
            console.error("Error checking rated trips:", error);
        }
    };


    const fetchBookings = (user: UserData) => {
        if (accessToken) {
            if (user?.role === "admin") {
                backendApi
                    .get("/api/v1/booking/all")
                    .then((res) => setBookings(res.data))
                    .catch((err) => console.error("Error fetching bookings:", err));
            }
            if (user?.role === "customer") {
                backendApi
                    .get(`/api/v1/booking/all-by-customer/${user._id}`)
                    .then((res) => setBookings(res.data))
                    .catch((err) => console.error("Error fetching bookings:", err));
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setBookingData((prev) => ({
            ...prev,
            [name]: name === "bookingDate" ? new Date(value) : value,
        }));
    };

    const handleEdit = (booking: PopulatedBookingDTO) => {
        setBookingData({
            customerId: booking.customerId?._id || "",
            tripId: booking.tripId?._id || "",
            bookingDate: new Date(booking.bookingDate),
            status: booking.status,
            notes: booking.notes || "",
        });
        setIsUpdating(true);
        setSelectedBookingId(booking._id || null);
        formRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await backendApi.put(`/api/v1/booking/update/${bookingId}`, { status: "Cancelled" });
            if (user) {
                fetchBookings(user)
            }
            alert("Booking cancelled.");
        } catch {
            alert("Failed to cancel booking.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // setFormLoading(true);
            if (isUpdating && selectedBookingId) {
                await backendApi.put(`/api/v1/booking/update/${selectedBookingId}`, bookingData);
                alert("Booking updated successfully");
            } else {
                await backendApi.post("/api/v1/booking/save", bookingData);
                alert("Booking added successfully");
            }

            setBookingData({
                customerId: "",
                tripId: "",
                bookingDate: new Date(),
                status: "Pending",
                notes: "",
            });
            setIsUpdating(false);
            setSelectedBookingId(null);
            if (user) {
                fetchBookings(user);
            }
        } catch {
            alert("Error saving booking");
        } finally {
            setIsUpdating(false);
        }
    };
    if (loadingAll || loadingByEmail) {
        return <p className="text-center text-blue-600 font-semibold text-lg">Loading...</p>;
    }

    if (errorAll || errorByEmail) {
        return (
            <p className="text-center text-red-600 font-semibold text-lg">
                Error: {errorAll || errorByEmail}
            </p>
        );
    }
    return (

        <div className="p-6">
            <div
                ref={formRef}
                className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg mb-10"
            >
                <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
                    {isUpdating ? "Update Booking" : "Add Booking"}
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {user?.role === "admin" && (
                        <div>
                            <label className="block text-sm font-medium">Customer</label>
                            <select
                                name="customerId"
                                value={bookingData.customerId}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 px-3 py-2 rounded-md"
                            >
                                <option value="">Select Customer</option>
                                {list.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium">Trip</label>
                        <select
                            name="tripId"
                            value={bookingData.tripId}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                        >
                            <option value="">Select Trip</option>
                            {trips.map((trip) => (
                                <option key={trip._id} value={trip._id}>
                                    {trip.startLocation} → {trip.endLocation} | {new Date(trip.date).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Booking Date</label>
                        <input
                            type="date"
                            name="bookingDate"
                            value={bookingData.bookingDate.toISOString().slice(0, 10)}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select
                            name="status"
                            value={bookingData.status}
                            onChange={handleChange}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium">Notes</label>
                        <textarea
                            name="notes"
                            value={bookingData.notes || ""}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                            placeholder="Optional notes"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-center">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                        >
                            {isUpdating ? "Update Booking" : "Add Booking"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Booking Table */}
            <h2 className="text-2xl font-bold mb-4">Bookings</h2>
            <table className="w-full border-collapse bg-white shadow rounded">
                <thead>
                    <tr className="bg-blue-600 text-white">
                        <th className="p-3 text-left">Customer</th>
                        <th className="p-3 text-left">Email</th>
                        <th className="p-3 text-left">Driver</th>
                        <th className="p-3 text-left">Vehicle</th>
                        <th className="p-3 text-left">Route</th>
                        <th className="p-3 text-left">Trip Date</th>
                        <th className="p-3 text-left">Booking Date</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">{booking.customerId?.name || "N/A"}</td>
                            <td className="p-3">{booking.customerId?.email || "N/A"}</td>
                            <td className="p-3">{booking.tripId?.driverId?.name || "N/A"}</td>
                            <td className="p-3">
                                {booking.tripId?.vehicleId
                                    ? `${booking.tripId.vehicleId.brand} ${booking.tripId.vehicleId.model} (${booking.tripId.vehicleId.name})`
                                    : "N/A"}
                            </td>
                            <td className="p-3">
                                {booking.tripId
                                    ? `${booking.tripId.startLocation} → ${booking.tripId.endLocation}`
                                    : "N/A"}
                            </td>
                            <td className="p-3">
                                {booking.tripId?.date
                                    ? new Date(booking.tripId.date).toLocaleDateString()
                                    : "N/A"}
                            </td>
                            <td className="p-3">
                                {booking.bookingDate
                                    ? new Date(booking.bookingDate).toLocaleDateString()
                                    : "N/A"}
                            </td>
                            <td className="p-3">{booking.status}</td>
                            <td className="p-3 flex gap-2">
                                {booking.status === "Pending" && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(booking)}
                                            className="bg-yellow-500 text-white px-3 py-1 rounded"
                                        >
                                            Update
                                        </button>
                                        <button
                                            onClick={() => handleCancelBooking(booking._id!)}
                                            className="bg-red-600 text-white px-3 py-1 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                {booking.status === "Confirmed" &&
                                    booking.tripId?._id &&
                                    booking.tripId?.driverId?._id &&
                                    user?.role === "customer" &&
                                    !ratedTrips.has(booking.tripId._id) && (
                                        <button
                                            onClick={() => {
                                                setRatingModal({
                                                    show: true,
                                                    tripId: booking.tripId!._id!,
                                                    driverId: booking.tripId!.driverId!._id!,
                                                    driverName: booking.tripId!.driverId!.name || "Driver"
                                                });
                                            }}
                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                        >
                                            Rate Driver
                                        </button>
                                    )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {ratingModal?.show && (
                <RatingModal
                    tripId={ratingModal.tripId}
                    driverId={ratingModal.driverId}
                    driverName={ratingModal.driverName}
                    onClose={() => setRatingModal(null)}
                    onRatingSubmitted={() => {
                        checkRatedTrips();
                        if (user) {
                            fetchBookings(user);
                        }
                    }}
                />
            )}
        </div>
    );
}
