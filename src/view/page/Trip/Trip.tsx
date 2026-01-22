import { useEffect, useState, type ChangeEvent, useRef } from "react";
import { backendApi } from "../../../api";
import type { PopulatedTripDTO, TripData } from "../../../Model/trip.data.ts";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllDrivers, getDriversNearby } from "../../../slices/driverSlices.ts";
import { getAllVehicles, getVehiclesNearby } from "../../../slices/vehicleSlices.ts";
import { getAllTrips, rejectTrip } from "../../../slices/TripSlice.ts";
import { getUserFromToken } from "../../../auth/auth.ts";
import { getUserByEmail } from "../../../slices/UserSlices.ts";
import { useLocation } from "react-router-dom";

import { SRI_LANKA_PROVINCES } from "../../../utils/sriLankaLocations.ts";
import { RatingModal } from "../../components/RatingModal/RatingModal.tsx";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";
import { getRouteDistance } from "../../../utils/mapUtils.ts";
import type { UserData } from "../../../Model/userData.ts";
import type { VehicleData } from "../../../Model/vehicleData.ts";
import { TripReassignmentModal } from "../../components/TripReassignmentModal.tsx";

import { Invoice } from "../../components/Invoice/Invoice.tsx";

// Helper functions for datetime-local (works in browser's local timezone)
const toLocalDateTimeString = (utcDateString: string): string => {
    // Convert UTC ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
    const date = new Date(utcDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromLocalDateTimeString = (localDateTimeString: string): string => {
    // Convert local datetime-local string to UTC ISO string
    // datetime-local format: "YYYY-MM-DDTHH:mm"
    // We need to parse this as local time, not UTC
    const [datePart, timePart] = localDateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create date in local timezone
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.toISOString();
};

export function Trip() {
    const [tripData, setTripData] = useState<TripData>({
        driverId: "",
        vehicleId: "",
        startLocation: "",
        endLocation: "",
        date: "",
        endDate: "",
        distance: "",
        price: 0,
        status: "Pending",
        notes: "",
        tripType: "Instant",
        startLat: 0,
        startLng: 0,
        endLat: 0,
        endLng: 0,
    });
    const [tripMode, setTripMode] = useState<"Quick Ride" | "Extended Trip">("Quick Ride");

    const dispatch = useDispatch<AppDispatch>();
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement | null>(null);

    const accessToken = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    const [user, setUser] = useState<UserData | null>(() => {
        if (accessToken) {
            try {
                return getUserFromToken(accessToken);
            } catch (error) {
                console.error("Error decoding token:", error);
                return null;
            }
        }
        return null;
    });

    const driverState = useSelector((state: RootState) => state.driver);
    const vehicleState = useSelector((state: RootState) => state.vehicle);
    const tripState = useSelector((state: RootState) => state.trip);
    const trips = tripState.list;



    console.log("Current User Role (State/LS):", user?.role, role);
    console.log("Current User ID (State/Token):", user?._id, (user as any)?.id);
    console.log("Total Trips in Redux:", trips?.length);
    console.log("All Trip Driver IDs:", trips && Array.isArray(trips) ? trips.map(t => (t.driverId?._id || t.driverId)) : []);

    const [localTrips, setLocalTrips] = useState<PopulatedTripDTO[]>([]);
    const [startProvince, setStartProvince] = useState<string>("");
    // const [startDistrict, setStartDistrict] = useState<string>("");
    // const [endProvince, setEndProvince] = useState<string>("");
    // const [endDistrict, setEndDistrict] = useState<string>("");
    const [ratingModal, setRatingModal] = useState<{
        show: boolean;
        tripId: string;
        driverId: string;
        driverName: string;
    } | null>(null);
    const [ratedTrips, setRatedTrips] = useState<Set<string>>(new Set());
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [selectedTripDetails, setSelectedTripDetails] = useState<PopulatedTripDTO | null>(null);

    // OSM LocationPicker state
    const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [startAddress, setStartAddress] = useState<string>("");
    const [endAddress, setEndAddress] = useState<string>("");
    const [isCalculatingDistance, setIsCalculatingDistance] = useState<boolean>(false);

    // Invoice Modal State
    const [invoiceTripId, setInvoiceTripId] = useState<string | null>(null);

    // Reassignment Modal State
    const location = useLocation();
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [reassignTripId, setReassignTripId] = useState<string | null>(null);
    const [reassignTripDetails, setReassignTripDetails] = useState<{
        startLocation: string;
        endLocation: string;
        price: number;
        date: string;
        endDate?: string | null;
        startLat?: number;
        startLng?: number;
    } | null>(null);

    // Promo Code State
    const [promoCodeInput, setPromoCodeInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<{
        code: string;
        discountAmount: number;
        newTotal: number;
    } | null>(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);

    // Use nearby lists if start location is selected, otherwise use all
    // Filter out unavailable drivers
    const drivers = (startCoords ? driverState.nearbyList : driverState.list)
        .filter((d: UserData) => d.isAvailable !== false);

    const vehicles = startCoords ? vehicleState.nearbyList : vehicleState.list;

    // Filter vehicles by category
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    // Get unique categories from available vehicles
    const availableCategories = ["All", ...Array.from(new Set(vehicles.map(v => v.category || "Standard")))];

    const filteredVehicles = selectedCategory === "All"
        ? vehicles
        : vehicles.filter(v => (v.category || "Standard") === selectedCategory);

    useEffect(() => {
        if (trips && Array.isArray(trips) && trips.length > 0) {
            setLocalTrips(trips);
        } else if (trips && Array.isArray(trips)) {
            setLocalTrips([]);
        }
    }, [trips]);



    // Customer trips
    const customerTrips = localTrips.filter(
        (trip) => {
            const tripCustId = (trip.customerId?._id || trip.customerId || "").toString();
            // Token typically has 'id', Redux state often has '_id'
            const currUserId = (user?._id || (user as any)?.id || "").toString();
            return tripCustId && currUserId && tripCustId === currUserId;
        }
    );

    const customerPendingTrips = customerTrips.filter(
        (trip) => trip.status?.toLowerCase() === "pending"
    );

    const customerProcessingTrips = customerTrips.filter(
        (trip) => trip.status?.toLowerCase() === "accepted" || trip.status?.toLowerCase() === "processing"
    );

    const customerCompletedTrips = customerTrips.filter(
        (trip) => trip.status?.toLowerCase() === "completed" || trip.status?.toLowerCase() === "paid"
    );

    // Driver trips
    const driverTrips = localTrips.filter(
        (trip) => {
            const tripDriverId = (trip.driverId?._id || trip.driverId || "").toString();
            const currUserId = (user?._id || (user as any)?.id || "").toString();
            return tripDriverId && currUserId && tripDriverId === currUserId;
        }
    );

    const driverPendingTrips = driverTrips.filter(
        (trip) => trip.status?.toLowerCase() === "pending"
    );

    const driverProcessingTrips = driverTrips.filter(
        (trip) => trip.status?.toLowerCase() === "accepted" || trip.status?.toLowerCase() === "processing"
    );

    const driverCompletedTrips = driverTrips.filter(
        (trip) => trip.status?.toLowerCase() === "completed" || trip.status?.toLowerCase() === "paid"
    );

    console.log("Driver Pending Trip IDs:", driverPendingTrips.map(t => t._id));
    console.log("Customer Pending Trip IDs:", customerPendingTrips.map(t => t._id));

    // Helper function to format date display with endDate if present and different
    const formatTripDate = (trip: PopulatedTripDTO) => {
        if (!trip.date) return "N/A";
        const startDate = new Date(trip.date);
        const startDateStr = startDate.toLocaleString();

        if (trip.endDate) {
            const endDate = new Date(trip.endDate);
            const startDateOnly = startDate.toDateString();
            const endDateOnly = endDate.toDateString();

            // If endDate is different from start date, show both
            if (startDateOnly !== endDateOnly) {
                return `${startDateStr} - ${endDate.toLocaleString()}`;
            }
        }

        return startDateStr;
    };

    useEffect(() => {
        // Initialize Quick Ride mode with current date
        const now = new Date();
        setTripData(prev => ({
            ...prev,
            date: now.toISOString(),
            tripType: "Instant"
        }));

        if (accessToken) {
            const email = getUserFromToken(accessToken)?.email;
            if (email) {
                dispatch(getUserByEmail(email))
                    .unwrap()
                    .then((userData) => {
                        console.log("Fetched user:", userData);
                        setUser(userData);
                        // Auto-set customerId for customers
                        if (userData && userData.role === "customer" && userData._id) {
                            setTripData(prev => ({ ...prev, customerId: userData._id }));
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching user:", error);
                    });
            }
            dispatch(getAllDrivers());
            dispatch(getAllVehicles());
            dispatch(getAllTrips());
        }
    }, [dispatch, accessToken]);

    // Check which trips have been rated
    const checkRatedTrips = async () => {
        try {
            if (user?.role === "customer" && user._id && localTrips.length > 0) {
                const customerCompleted = localTrips.filter(
                    (trip) => trip.customerId && trip.customerId._id && user._id && trip.customerId._id === user._id && trip.status === "Completed"
                );

                const ratedSet = new Set<string>();
                for (const trip of customerCompleted) {
                    if (trip._id) {
                        try {
                            const ratingResponse = await backendApi.get(`/api/v1/ratings/trip/${trip._id}`);
                            if (ratingResponse.data) {
                                ratedSet.add(trip._id);
                            }
                        } catch (error) {
                            console.error(error)
                        }
                    }
                }
                setRatedTrips(ratedSet);
            }
        } catch (error) {
            console.error("Error checking rated trips:", error);
        }
    };

    // Check rated trips when user or trips change
    useEffect(() => {
        if (user && localTrips.length > 0) {
            checkRatedTrips();
        }
    }, [user, localTrips]);

    // Check for reassignment parameter from notification
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const reassignTripIdParam = params.get('reassign');

        if (reassignTripIdParam && localTrips.length > 0) {
            console.log("Reassign Param detected:", reassignTripIdParam);
            const trip = localTrips.find(t => t._id === reassignTripIdParam);
            console.log("Trip found for reassign:", trip?._id, "Status:", trip?.status);

            if (trip && trip.status?.toLowerCase() === 'rejected') {
                setReassignTripId(reassignTripIdParam);
                setReassignTripDetails({
                    startLocation: trip.startLocation,
                    endLocation: trip.endLocation,
                    price: trip.price || 0,
                    date: trip.date,
                    endDate: trip.endDate,
                    startLat: trip.startLat,
                    startLng: trip.startLng
                });
                setShowReassignModal(true);
            }
        }
    }, [location.search, localTrips]);

    // Extract province from address for driver sorting
    const extractProvinceFromAddress = (address: string): string => {
        if (!address) return "";
        // Try to match province names from the address
        for (const province of SRI_LANKA_PROVINCES) {
            if (address.toLowerCase().includes(province.name.toLowerCase())) {
                return province.name;
            }
        }
        return "";
    };

    // Update startProvince when startAddress changes (for driver sorting)
    useEffect(() => {
        if (startAddress) {
            const province = extractProvinceFromAddress(startAddress);
            setStartProvince(province);
        } else {
            setStartProvince("");
        }
    }, [startAddress]);

    // Fetch nearby drivers and vehicles when start location is selected
    useEffect(() => {
        if (startCoords) {
            // Pass date and endDate (if extended trip) for availability checking
            const reqDate = tripData.date;
            const reqEndDate = tripData.tripType === "Scheduled" ? tripData.endDate : undefined;

            dispatch(getDriversNearby({
                lat: startCoords.lat,
                lng: startCoords.lng,
                radius: 5,
                date: reqDate,
                endDate: reqEndDate
            }));

            dispatch(getVehiclesNearby({
                lat: startCoords.lat,
                lng: startCoords.lng,
                radius: 5,
                date: reqDate,
                endDate: reqEndDate
            }));
        }
    }, [startCoords, dispatch, tripData.date, tripData.endDate, tripData.tripType]);

    // Reset selected driver if they are no longer in the filtered list (e.g. date changed)
    useEffect(() => {
        if (tripData.driverId && !driverState.loading) {
            const isDriverAvailable = drivers.find((d: UserData) => d._id === tripData.driverId);
            if (!isDriverAvailable) {
                setTripData(prev => ({ ...prev, driverId: "" }));
            }
        }
    }, [drivers, tripData.driverId, driverState.loading]);

    // Auto-select best driver when start location is chosen and list is loaded
    useEffect(() => {
        if (startCoords && drivers.length > 0 && !tripData.driverId && !driverState.loading) {
            // Sorting logic to find the "Best"
            const sortedDrivers = [...drivers].sort((a, b) => {
                const aRating = a.averageRating || 0;
                const bRating = b.averageRating || 0;
                const aExp = a.experience || 0;
                const bExp = b.experience || 0;

                // Province Expert priority
                if (startProvince) {
                    const aVisitCount = (driverState.driverStats?.experienceByProvince?.[startProvince] || 0);
                    const bVisitCount = (driverState.driverStats?.experienceByProvince?.[startProvince] || 0);
                    if (aVisitCount !== bVisitCount) return bVisitCount - aVisitCount;
                }

                // Top Rated priority
                if (aRating !== bRating) return bRating - aRating;

                // Experience tie-breaker
                return bExp - aExp;
            });

            if (sortedDrivers.length > 0) {
                const bestDriver = sortedDrivers[0];
                setTripData(prev => ({ ...prev, driverId: bestDriver._id }));
                console.log("Automatically suggested best driver:", bestDriver.name);
            }
        }
    }, [drivers, startCoords, tripData.driverId, driverState.loading, startProvince, driverState.driverStats]);

    // Reset selected vehicle if they are no longer in the filtered list
    useEffect(() => {
        if (tripData.vehicleId && !vehicleState.loading) {
            const isVehicleAvailable = vehicles.find((v: VehicleData) => v._id === tripData.vehicleId);
            if (!isVehicleAvailable) {
                setTripData(prev => ({ ...prev, vehicleId: "" }));
            }
        }
    }, [vehicles, tripData.vehicleId, vehicleState.loading]);

    // Auto-select best vehicle when list is loaded (or category changed)
    useEffect(() => {
        if (startCoords && filteredVehicles.length > 0 && !tripData.vehicleId && !vehicleState.loading) {
            // Sort by price (cheapest first) within the filtered list
            const sortedVehicles = [...filteredVehicles].sort((a, b) => {
                const aPrice = a.pricePerKm || (a.category === "Economy" ? 50 : a.category === "Luxury" ? 150 : a.category === "Premium" ? 250 : 80);
                const bPrice = b.pricePerKm || (b.category === "Economy" ? 50 : b.category === "Luxury" ? 150 : b.category === "Premium" ? 250 : 80);
                return aPrice - bPrice;
            });

            if (sortedVehicles.length > 0) {
                const bestVehicle = sortedVehicles[0];
                setTripData(prev => ({ ...prev, vehicleId: bestVehicle._id }));
                console.log("Automatically suggested best vehicle:", bestVehicle.brand, bestVehicle.model);
            }
        }
    }, [filteredVehicles, startCoords, tripData.vehicleId, vehicleState.loading]);

    // Calculate distance when both coordinates are set
    useEffect(() => {
        const calculateDistance = async () => {
            if (startCoords && endCoords) {
                setIsCalculatingDistance(true);
                try {
                    const distance = await getRouteDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);

                    // Determine price based on selected vehicle
                    let pricePerKm = 100; // Default fallback
                    if (tripData.vehicleId) {
                        const vehicle = vehicles.find((v: VehicleData) => v._id === tripData.vehicleId);
                        if (vehicle) {
                            pricePerKm = vehicle.pricePerKm || (vehicle.category === "Economy" ? 50 : vehicle.category === "Luxury" ? 150 : vehicle.category === "Premium" ? 250 : 80);
                        }
                    }

                    const calculatedPrice = distance * pricePerKm;
                    setTripData(prev => ({
                        ...prev,
                        distance: distance.toString(),
                        price: calculatedPrice
                    }));
                } catch (error) {
                    console.error("Error calculating distance:", error);
                    // Keep existing distance if calculation fails
                } finally {
                    setIsCalculatingDistance(false);
                }
            }
        };

        calculateDistance();
    }, [startCoords, endCoords, tripData.vehicleId, vehicles]);


    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === "distance") {
            const distanceVal = value;
            const numericDistance = parseFloat(distanceVal);

            // Get current vehicle price
            let pricePerKm = 100; // Fallback default
            if (tripData.vehicleId) {
                const vehicle = vehicles.find((v: VehicleData) => v._id === tripData.vehicleId);
                if (vehicle) {
                    pricePerKm = vehicle.pricePerKm || (vehicle.category === "Economy" ? 50 : vehicle.category === "Luxury" ? 150 : vehicle.category === "Premium" ? 250 : 80);
                }
            }

            const calculatedPrice = isNaN(numericDistance) ? 0 : numericDistance * pricePerKm;
            setTripData(prev => ({
                ...prev,
                distance: distanceVal,
                price: calculatedPrice
            }));
            if (appliedPromo) {
                setAppliedPromo(null);
                setPromoCodeInput("");
                setPromoError("Price changed, please re-apply promo code.");
            }
        } else if (name === "vehicleId") {
            // Recalculate price when vehicle changes
            const selectedVehicleId = value;
            let pricePerKm = 100; // Fallback default

            if (selectedVehicleId) {
                const vehicle = vehicles.find((v: VehicleData) => v._id === selectedVehicleId);
                if (vehicle) {
                    pricePerKm = vehicle.pricePerKm || (vehicle.category === "Economy" ? 50 : vehicle.category === "Luxury" ? 150 : vehicle.category === "Premium" ? 250 : 80);
                }
            }

            const currentDistance = parseFloat(tripData.distance);
            const calculatedPrice = !isNaN(currentDistance) ? currentDistance * pricePerKm : 0;

            setTripData(prev => ({
                ...prev,
                [name]: value,
                price: calculatedPrice > 0 ? calculatedPrice : prev.price
            }));
            if (appliedPromo) {
                setAppliedPromo(null);
                setPromoCodeInput("");
                setPromoError("Vehicle changed, please re-apply promo code.");
            }
        } else {
            setTripData(prev => ({
                ...prev,
                [name]: name === "price" ? Number(value) : value,
            }));
        }
    };

    const handleTripModeChange = (mode: "Quick Ride" | "Extended Trip") => {
        setTripMode(mode);
        if (mode === "Quick Ride") {
            // Quick Ride: Auto-set date to Now, no endDate, tripType = "Instant"
            const now = new Date();
            setTripData(prev => ({
                ...prev,
                date: now.toISOString(),
                endDate: "",
                tripType: "Instant"
            }));
        } else {
            // Extended Trip: Set date to now (user can change), show endDate field, tripType = "Scheduled"
            const now = new Date();
            setTripData(prev => ({
                ...prev,
                date: now.toISOString(),
                endDate: "",
                tripType: "Scheduled"
            }));
        }
    };



    // Commented out handleEdit as Update button was removed
    // const handleEdit = (trip: PopulatedTripDTO) => {
    //     if (driverState.loading) {
    //         alert("Please wait until drivers are loaded.");
    //         return;
    //     }
    //     // ... rest of the function
    // };

    const handleStatusUpdateUI = async (tripId: string, newStatus: string) => {
        try {
            await backendApi.put(`/api/v1/trips/status/${tripId}`, { status: newStatus });

            // Update the trip status in local state without removing completed trips
            setLocalTrips(prev =>
                prev.map(trip =>
                    trip._id === tripId
                        ? { ...trip, status: newStatus }
                        : trip
                )
            );
        } catch (err) {
            console.log(err)
            alert(`Failed to update trip to ${newStatus}`);
        }
    };

    const handleRejectTrip = async (tripId: string) => {
        if (!window.confirm("Are you sure you want to decline this trip?")) return;

        try {
            await dispatch(rejectTrip({ tripId, reason: "Declined by driver" })).unwrap();

            // Update local state
            setLocalTrips(prev =>
                prev.map(trip =>
                    trip._id === tripId
                        ? { ...trip, status: "Rejected" }
                        : trip
                )
            );
            alert("Trip declined successfully");
        } catch (err: any) {
            alert(err || "Failed to decline trip");
        }
    };


    const handleApplyPromo = async () => {
        if (!promoCodeInput.trim()) return;
        if (!tripData.price) {
            alert("Please select a vehicle and locations first to calculate base price.");
            return;
        }

        setIsValidatingPromo(true);
        setPromoError(null);

        try {
            const res = await backendApi.post("/api/v1/promotions/validate", {
                code: promoCodeInput,
                tripAmount: tripData.price + (appliedPromo ? appliedPromo.discountAmount : 0) // Validate against base price
            });

            setAppliedPromo(res.data);
            setTripData(prev => ({
                ...prev,
                price: res.data.newTotal
            }));
            alert("Promo code applied successfully!");
        } catch (error: any) {
            setPromoError(error.response?.data?.message || "Invalid promo code");
            setAppliedPromo(null);
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const handleRemovePromo = () => {
        if (appliedPromo) {
            setTripData(prev => ({
                ...prev,
                price: prev.price + appliedPromo.discountAmount
            }));
            setAppliedPromo(null);
            setPromoCodeInput("");
            setPromoError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use addresses from LocationPicker (already set in tripData.startLocation and tripData.endLocation)
            // Ensure both locations are set
            if (!startAddress || !endAddress) {
                alert("Please select both start and end locations on the map.");
                return;
            }

            // Determine date based on trip mode
            let tripDate: string;
            if (tripMode === "Quick Ride") {
                // Quick Ride: Use current server time
                tripDate = new Date().toISOString();
            } else {
                // Extended Trip: Use selected date/time
                tripDate = tripData.date;
            }

            const submitData = {
                ...tripData,
                startLocation: startAddress,
                endLocation: endAddress,
                date: tripDate,
                // For Quick Ride, don't send endDate (or set to null)
                endDate: tripMode === "Quick Ride" ? null : (tripData.endDate || null),
                tripType: tripMode === "Quick Ride" ? "Instant" : "Scheduled",
                customerId: (role?.toLowerCase() === "customer" || user?.role?.toLowerCase() === "customer")
                    ? (user?._id || (user as any)?.id || tripData.customerId)
                    : tripData.customerId,
                // Include coordinates for the Live Map "Points"
                startLat: startCoords?.lat,
                startLng: startCoords?.lng,
                endLat: endCoords?.lat,
                endLng: endCoords?.lng,
                promoCode: appliedPromo?.code || "",
                discountAmount: appliedPromo?.discountAmount || 0,
            };

            if (isUpdating && selectedTripId) {
                await backendApi.put(`/api/v1/trips/update/${selectedTripId}`, submitData);
                alert("Trip updated successfully");
                window.location.reload();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { status, ...newTripData } = submitData;
                const res = await backendApi.post("/api/v1/trips/save", newTripData);
                alert("Trip added successfully");

                try {
                    await backendApi.post("/api/v1/email/send-trip-assignment", {
                        to: driverState.list.find(driver => driver._id === tripData.driverId)?.email,
                        driverName: driverState.list.find(driver => driver._id === tripData.driverId)?.name,
                        tripId: res.data._id,
                        startLocation: startAddress,
                        endLocation: endAddress,
                        date: tripData.date
                    })
                } catch (error) {
                    console.error("Error sending email:", error);
                }

            }

            // Reset form
            const resetDate = new Date().toISOString();
            setTripData({
                driverId: "",
                vehicleId: "",
                startLocation: "",
                endLocation: "",
                date: resetDate,
                endDate: "",
                distance: "",
                price: 0,
                status: "Pending",
                notes: "",
                tripType: "Instant",
                customerId: role === "customer" && user?._id ? user._id : "",
                startLat: 0,
                startLng: 0,
                endLat: 0,
                endLng: 0,
            });
            setAppliedPromo(null);
            setPromoCodeInput("");
            setPromoError(null);
            setTripMode("Quick Ride");
            setStartProvince("");
            // setStartDistrict("");
            // setEndProvince("");
            // setEndDistrict("");
            setStartCoords(null);
            setEndCoords(null);
            setStartAddress("");
            setEndAddress("");
            setIsUpdating(false);
            setSelectedTripId(null);
        } catch {
            alert(isUpdating ? "Failed to update trip" : "Error adding trip");
        }
    };


    // Trip Details Modal Component
    const TripDetailsModal = ({ trip, onClose }: { trip: PopulatedTripDTO; onClose: () => void }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-blue-600 text-white p-6 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Trip Details</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-3xl font-bold">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Trip Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${trip.status === "Completed" ? "bg-green-100 text-green-800" :
                            trip.status === "Processing" ? "bg-yellow-100 text-yellow-800" :
                                trip.status === "Accepted" ? "bg-blue-100 text-blue-800" :
                                    trip.status === "Pending" ? "bg-orange-100 text-orange-800" :
                                        "bg-gray-100 text-gray-800"
                            }`}>
                            {trip.status || "N/A"}
                        </span>
                    </div>

                    {/* Route Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Route</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-green-600 font-semibold">📍 {trip.startLocation}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-red-600 font-semibold">📍 {trip.endLocation}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-600">Distance:</span>
                                <p className="font-semibold">{trip.distance || "N/A"} km</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Price:</span>
                                <p className="font-semibold text-green-600">Rs. {trip.price || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-blue-600">👤</span> Customer Information
                            </h3>
                            {trip.customerId ? (
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <p className="font-semibold">{trip.customerId.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <p className="font-semibold text-blue-600">{trip.customerId.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Customer ID:</span>
                                        <p className="font-mono text-xs text-gray-500">{trip.customerId._id}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No customer assigned</p>
                            )}
                        </div>

                        {/* Driver Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-green-600">🚗</span> Driver Information
                            </h3>
                            {trip.driverId ? (
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <p className="font-semibold">{trip.driverId.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <p className="font-semibold text-green-600">{trip.driverId.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Driver ID:</span>
                                        <p className="font-mono text-xs text-gray-500">{trip.driverId._id}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No driver assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-purple-600">🚙</span> Vehicle Information
                        </h3>
                        {trip.vehicleId ? (
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600">Brand:</span>
                                    <p className="font-semibold">{trip.vehicleId.brand}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Model:</span>
                                    <p className="font-semibold">{trip.vehicleId.model}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Name:</span>
                                    <p className="font-semibold">{trip.vehicleId.name}</p>
                                </div>
                                <div className="md:col-span-3">
                                    <span className="text-sm text-gray-600">Vehicle ID:</span>
                                    <p className="font-mono text-xs text-gray-500">{trip.vehicleId._id}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No vehicle assigned</p>
                        )}
                    </div>

                    {/* Trip Timeline */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-orange-600">📅</span> Trip Timeline
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-600">Booking Date:</span>
                                <p className="font-semibold">{trip.createdAt ? new Date(trip.createdAt).toLocaleString() : "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Trip Type:</span>
                                <p className="font-semibold">
                                    <span className={`px-2 py-1 rounded text-xs ${trip.tripType === "Instant" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
                                        }`}>
                                        {trip.tripType === "Instant" ? "Quick Ride" : "Extended Trip"}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">Start Date & Time:</span>
                                <p className="font-semibold">{trip.date ? new Date(trip.date).toLocaleString() : "N/A"}</p>
                            </div>
                            {trip.endDate && (
                                <div>
                                    <span className="text-sm text-gray-600">End Date & Time:</span>
                                    <p className="font-semibold">{new Date(trip.endDate).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Notes */}
                    {trip.notes && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="text-yellow-600">📝</span> Notes
                            </h3>
                            <p className="text-gray-700">{trip.notes}</p>
                        </div>
                    )}

                    {/* Trip ID */}
                    <div className="border-t pt-4">
                        <span className="text-sm text-gray-600">Trip ID:</span>
                        <p className="font-mono text-xs text-gray-500">{trip._id}</p>
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

    return (
        <>
            {role !== "driver" && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
                        {isUpdating ? "Update Trip" : "Add Trip"}
                    </h1>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium">Driver</label>
                            {!startCoords && (
                                <p className="text-xs text-orange-600 mb-1">
                                    ⚠️ Please select a start location first to see nearby drivers (within 5km)
                                </p>
                            )}
                            {startCoords && startProvince && (
                                <p className="text-xs text-blue-600 mb-1">
                                    💡 Showing drivers within 5km. Drivers with experience in <strong>{startProvince}</strong> are shown first
                                </p>
                            )}
                            {startCoords && !startProvince && (
                                <p className="text-xs text-green-600 mb-1">
                                    ✓ Showing drivers within 5km of start location
                                </p>
                            )}
                            {driverState.loading ? (
                                <p className="text-sm text-gray-600">Loading nearby drivers...</p>
                            ) : driverState.error ? (
                                <p className="text-red-500">{driverState.error}</p>
                            ) : drivers.length === 0 && startCoords ? (
                                <p className="text-sm text-orange-600">No drivers available within 5km of the start location</p>
                            ) : (
                                <select
                                    name="driverId"
                                    value={tripData.driverId}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                    required
                                    disabled={!startCoords}
                                >
                                    <option value="">Select Driver</option>
                                    {drivers.length === 0 && !startCoords ? (
                                        <option value="" disabled>Select start location first</option>
                                    ) : (
                                        [...drivers]
                                            .map(driver => {
                                                const rating = driver.averageRating || 0;
                                                const totalRatings = driver.totalRatings || 0;
                                                const experience = driver.experience || 0;
                                                const provincesVisited = driver.provincesVisited || [];

                                                // Check if driver is a local expert for the selected start province
                                                // provincesVisited is now array of objects {province: string, count: number}
                                                const visitData = startProvince ? (provincesVisited as { province: string; count: number }[]).find(p => p.province === startProvince) : undefined;
                                                const visitCount = visitData ? visitData.count : 0;
                                                const isLocalExpert = visitCount > 0;

                                                // Check if driver is top rated (4.5+ rating & experience)
                                                const isTopRated = rating >= 4.5 && experience >= 10;

                                                // Calculate sort priority: Local Experts (1), Top Rated (2), Others (3)
                                                let sortPriority = 3;
                                                if (isLocalExpert) {
                                                    sortPriority = 1; // Local Experts first
                                                } else if (isTopRated) {
                                                    sortPriority = 2; // Top Rated second
                                                }

                                                return {
                                                    driver,
                                                    sortPriority,
                                                    rating,
                                                    experience,
                                                    isLocalExpert,
                                                    isTopRated,
                                                    totalRatings,
                                                    provincesVisited,
                                                    visitCount
                                                };
                                            })
                                            .sort((a, b) => {
                                                // First sort by priority (Local Experts > Top Rated > Others)
                                                if (a.sortPriority !== b.sortPriority) {
                                                    return a.sortPriority - b.sortPriority;
                                                }

                                                // Within same priority, sort by rating
                                                if (a.rating !== b.rating) {
                                                    return b.rating - a.rating; // Higher rating first
                                                }

                                                // Then by experience
                                                return b.experience - a.experience; // Higher experience first
                                            })
                                            .map(({ driver, rating, totalRatings, experience, isLocalExpert, isTopRated, visitCount }) => {

                                                // Build recommendation text
                                                let recommendation = "";
                                                if (isLocalExpert && startProvince) {
                                                    recommendation = ` 🏆 Expert in ${startProvince}`;
                                                    if (visitCount > 1) {
                                                        recommendation += ` (${visitCount} trips)`;
                                                    }
                                                } else if (isTopRated) {
                                                    recommendation = " ⭐ Highly Recommended";
                                                } else if (rating >= 4.0 && experience >= 5) {
                                                    recommendation = " ✓ Recommended";
                                                }

                                                return (
                                                    <option key={driver._id} value={driver._id}>
                                                        {driver.name}
                                                        {` (⭐ ${rating.toFixed(1)}${totalRatings > 0 ? `, ${totalRatings} reviews` : ''}, ${experience} trips)`}
                                                        {recommendation}
                                                    </option>
                                                );
                                            })
                                    )}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Vehicle</label>

                            {/* Vehicle Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {availableCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCategory(cat);
                                            // Reset selected vehicle when changing category filter if current selection is hidden
                                            if (tripData.vehicleId) {
                                                const currentVehicle = vehicles.find(v => v._id === tripData.vehicleId);
                                                if (currentVehicle && (currentVehicle.category || "Standard") !== cat && cat !== "All") {
                                                    setTripData(prev => ({ ...prev, vehicleId: "" }));
                                                }
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs rounded-full border ${selectedCategory === cat
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {!startCoords && (
                                <p className="text-xs text-orange-600 mb-1">
                                    ⚠️ Please select a start location first to see nearby vehicles (within 5km)
                                </p>
                            )}
                            {startCoords && (
                                <p className="text-xs text-green-600 mb-1">
                                    ✓ Showing {selectedCategory === "All" ? "all" : selectedCategory} vehicles within 5km of start location
                                </p>
                            )}
                            {vehicleState.loading ? (
                                <p className="text-sm text-gray-600">Loading nearby vehicles...</p>
                            ) : vehicleState.error ? (
                                <p className="text-red-500">{vehicleState.error}</p>
                            ) : filteredVehicles.length === 0 && startCoords ? (
                                <p className="text-sm text-orange-600">No {selectedCategory !== "All" ? selectedCategory : ""} vehicles found within 5km</p>
                            ) : (
                                <select
                                    name="vehicleId"
                                    value={tripData.vehicleId}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                    required
                                    disabled={!startCoords}
                                >
                                    <option value="">Select {selectedCategory !== "All" ? selectedCategory : ""} Vehicle</option>
                                    {filteredVehicles.length === 0 && !startCoords ? (
                                        <option value="" disabled>Select start location first</option>
                                    ) : (
                                        filteredVehicles.map(vehicle => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {vehicle.brand} - {vehicle.model} ({vehicle.category || "Standard"} - Rs. {vehicle.pricePerKm || (vehicle.category === "Economy" ? 50 : vehicle.category === "Luxury" ? 150 : vehicle.category === "Premium" ? 250 : 80)}/km)
                                            </option>
                                        ))
                                    )}
                                </select>
                            )}

                            {/* Selected Vehicle Preview Card */}
                            {tripData.vehicleId && (
                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-4 items-center">
                                    {/* Find selected vehicle details */}
                                    {(() => {
                                        const selectedVehicle = vehicles.find(v => v._id === tripData.vehicleId);
                                        if (!selectedVehicle) return null;

                                        const price = selectedVehicle.pricePerKm || (selectedVehicle.category === "Economy" ? 50 : selectedVehicle.category === "Luxury" ? 150 : selectedVehicle.category === "Premium" ? 250 : 80);

                                        return (
                                            <>
                                                <div className="w-20 h-20 bg-white rounded-md border flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {selectedVehicle.image ? (
                                                        <img
                                                            src={`http://localhost:3000/uploads/vehicle/${selectedVehicle.image}`}
                                                            alt={selectedVehicle.model}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Image";
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">🚗</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{selectedVehicle.brand} {selectedVehicle.model}</h4>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedVehicle.category === 'Premium' ? 'bg-purple-100 text-purple-800' :
                                                                selectedVehicle.category === 'Luxury' ? 'bg-yellow-100 text-yellow-800' :
                                                                    selectedVehicle.category === 'Economy' ? 'bg-green-100 text-green-800' :
                                                                        'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {selectedVehicle.category || "Standard"}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block font-bold text-green-600">Rs. {price}/km</span>
                                                            <span className="text-xs text-gray-500">{selectedVehicle.seats} Seats</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedVehicle.description}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <LocationPicker
                                label="Start Location"
                                onLocationSelect={(lat, lng, address) => {
                                    setStartCoords({ lat, lng });
                                    setStartAddress(address);
                                    setTripData(prev => ({ ...prev, startLocation: address }));
                                }}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <LocationPicker
                                label="End Location"
                                onLocationSelect={(lat, lng, address) => {
                                    setEndCoords({ lat, lng });
                                    setEndAddress(address);
                                    setTripData(prev => ({ ...prev, endLocation: address }));
                                }}
                            />
                        </div>

                        {/* Trip Mode Tabs */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Trip Type</label>
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => handleTripModeChange("Quick Ride")}
                                    className={`px-6 py-3 font-medium text-sm ${tripMode === "Quick Ride"
                                        ? "border-b-2 border-blue-600 text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Quick Ride
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTripModeChange("Extended Trip")}
                                    className={`px-6 py-3 font-medium text-sm ${tripMode === "Extended Trip"
                                        ? "border-b-2 border-blue-600 text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    Extended Trip
                                </button>
                            </div>
                        </div>

                        {/* Quick Ride Mode - Auto-set to Now, hide endDate */}
                        {tripMode === "Quick Ride" && (
                            <div>
                                <label className="block text-sm font-medium">Trip Date & Time</label>
                                <input
                                    type="text"
                                    value={tripData.date ? new Date(tripData.date).toLocaleString() : new Date().toLocaleString()}
                                    disabled
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">Trip will start immediately (current time)</p>
                            </div>
                        )}

                        {/* Extended Trip Mode - Show Start Date and End Date */}
                        {tripMode === "Extended Trip" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium">Start Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={tripData.date
                                            ? toLocalDateTimeString(tripData.date)
                                            : toLocalDateTimeString(new Date().toISOString())}
                                        onChange={(e) => {
                                            const selectedDateTime = e.target.value;
                                            if (selectedDateTime) {
                                                setTripData(prev => ({ ...prev, date: fromLocalDateTimeString(selectedDateTime) }));
                                            }
                                        }}
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                        required
                                        min={toLocalDateTimeString(new Date().toISOString())}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">End Date & Time (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={tripData.endDate
                                            ? toLocalDateTimeString(tripData.endDate)
                                            : ""}
                                        onChange={(e) => {
                                            const selectedDateTime = e.target.value;
                                            if (selectedDateTime) {
                                                setTripData(prev => ({ ...prev, endDate: fromLocalDateTimeString(selectedDateTime) }));
                                            } else {
                                                setTripData(prev => ({ ...prev, endDate: "" }));
                                            }
                                        }}
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                        min={tripData.date ? toLocalDateTimeString(tripData.date) : toLocalDateTimeString(new Date().toISOString())}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for same-day trips</p>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium">Distance (km)</label>
                            <input
                                type="text"
                                name="distance"
                                value={isCalculatingDistance ? "Calculating..." : tripData.distance}
                                onChange={handleChange}
                                readOnly={!!startCoords && !!endCoords}
                                className={`w-full border border-gray-300 px-3 py-2 rounded-md ${startCoords && endCoords ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                            {startCoords && endCoords && (
                                <p className="text-xs text-gray-500 mt-1">Distance is automatically calculated from selected locations</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Price (LKR)</label>
                            <input
                                type="number"
                                name="price"
                                readOnly
                                value={tripData.price}
                                onChange={handleChange}
                                className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-50 font-bold text-green-700"
                            />
                            {appliedPromo && (
                                <p className="text-xs text-green-600 mt-1 font-semibold">
                                    ✓ Discount of Rs. {appliedPromo.discountAmount} applied!
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <label className="block text-sm font-medium text-blue-800 mb-2">Have a Promo Code? 🏷️</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter code (e.g. SAVE10)"
                                    className="flex-1 border border-blue-200 px-3 py-2 rounded-md uppercase font-mono"
                                    value={promoCodeInput}
                                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                    disabled={!!appliedPromo || isValidatingPromo}
                                />
                                {appliedPromo ? (
                                    <button
                                        type="button"
                                        onClick={handleRemovePromo}
                                        className="bg-red-100 text-red-600 px-4 py-2 rounded-md hover:bg-red-200 font-semibold transition"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApplyPromo}
                                        disabled={!promoCodeInput || isValidatingPromo}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
                                    >
                                        {isValidatingPromo ? "Verifying..." : "Apply"}
                                    </button>
                                )}
                            </div>
                            {promoError && <p className="text-xs text-red-600 mt-2">❌ {promoError}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Notes</label>
                            <textarea
                                name="notes"
                                value={tripData.notes || ""}
                                onChange={handleChange}
                                rows={3}
                                className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                placeholder="Optional notes or special instructions"
                            />
                        </div>

                        {isUpdating && (
                            <div>
                                <label className="block text-sm font-medium">Status</label>
                                <select
                                    name="status"
                                    value={tripData.status}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        )}

                        <div ref={formRef} className="col-span-full">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                            >
                                {isUpdating ? "Update Trip" : "Add Trip"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {((user?.role?.toLowerCase() || role?.toLowerCase()) === "admin") && (
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Trips</h2>
                    <table className="w-full border-collapse bg-white shadow rounded">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="p-3 text-left">Customer</th>
                                <th className="p-3 text-left">Driver</th>
                                <th className="p-3 text-left">Vehicle</th>
                                <th className="p-3 text-left">Route</th>
                                <th className="p-3 text-left">Trip Date</th>
                                <th className="p-3 text-left">Booking Date</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-left">Discount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tripState.loading || tripState.error ? (
                                <tr>
                                    <td colSpan={8}>
                                        {tripState.loading ? (
                                            <p>Loading trips...</p>
                                        ) : (
                                            <p className="text-red-500">{tripState.error}</p>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                (trips && Array.isArray(trips) ? trips : []).map(trip => (
                                    <tr key={trip._id} className="border-b">
                                        <td className="p-3">{trip.customerId?.name || "N/A"}</td>
                                        <td className="p-3">{trip.driverId?.name || "N/A"}</td>
                                        <td className="p-3">{trip.vehicleId?.brand} {trip.vehicleId?.model || "N/A"}</td>
                                        <td className="p-3">{trip.startLocation} → {trip.endLocation}</td>
                                        <td className="p-3">
                                            {trip.date ? (
                                                trip.endDate && new Date(trip.date).toDateString() !== new Date(trip.endDate).toDateString()
                                                    ? `${new Date(trip.date).toLocaleString()} - ${new Date(trip.endDate).toLocaleString()}`
                                                    : new Date(trip.date).toLocaleString()
                                            ) : "N/A"}
                                        </td>
                                        <td className="p-3">{trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : "-"}</td>
                                        <td className="p-3 font-semibold">{trip.status || "N/A"}</td>
                                        <td className="p-3">
                                            {trip.promoCode ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded w-fit mb-1">{trip.promoCode}</span>
                                                    <span className="text-sm font-bold text-red-600">- Rs. {trip.discountAmount}</span>
                                                </div>
                                            ) : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {((user?.role?.toLowerCase() || role?.toLowerCase()) === "driver") && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-center flex-1">Your Trips</h2>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-md border">
                            <span className={`font-medium ${user?.isAvailable !== false ? 'text-green-600' : 'text-gray-500'}`}>
                                {user?.isAvailable !== false ? '🟢 Available' : '🔴 Not Available'}
                            </span>
                            <button
                                onClick={async () => {
                                    if (user?._id) {
                                        try {
                                            const response = await backendApi.patch(`/api/v1/users/toggle-availability/${user._id}`);
                                            setUser(response.data);
                                            alert(user?.isAvailable !== false
                                                ? "You are now unavailable for new trips"
                                                : "You are now available for new trips");
                                        } catch (error) {
                                            console.error("Error toggling availability:", error);
                                            alert("Failed to update availability");
                                        }
                                    }
                                }}
                                className={`px-4 py-2 rounded-md font-medium transition-colors ${user?.isAvailable !== false
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                            >
                                {user?.isAvailable !== false ? 'Set Unavailable' : 'Set Available'}
                            </button>
                        </div>
                    </div>

                    {driverPendingTrips.length === 0 && driverProcessingTrips.length === 0 && driverCompletedTrips.length === 0 && (
                        <p className="text-center text-gray-600">You don't have any trips at the moment.</p>
                    )}

                    {driverPendingTrips.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Pending Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {driverPendingTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        {trip.customerId && (
                                            <p><strong>Customer:</strong> {trip.customerId.name} ({trip.customerId.email})</p>
                                        )}
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model || "N/A"}</p>
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        <p className="mt-2"><strong>Status:</strong> <span
                                            className="text-blue-600">{trip.status || "N/A"}</span></p>

                                        <div className="flex justify-between mt-4 gap-2">
                                            <button
                                                onClick={() => handleRejectTrip(trip._id!)}
                                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Extended Trips (has endDate) → "Accepted"
                                                    // Quick Rides (no endDate) → "Processing"
                                                    const newStatus = trip.endDate ? "Accepted" : "Processing";
                                                    handleStatusUpdateUI(trip._id!, newStatus);
                                                }}
                                                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {driverProcessingTrips.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Active Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {driverProcessingTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        {trip.customerId && (
                                            <p><strong>Customer:</strong> {trip.customerId.name} ({trip.customerId.email})</p>
                                        )}
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model || "N/A"}</p>
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        {trip.promoCode && (
                                            <div className="bg-green-50 p-1.5 rounded border border-green-200 mt-2 text-sm">
                                                <span className="text-green-700 font-bold">Promo Applied: {trip.promoCode}</span>
                                                <br />
                                                <span className="text-red-600 font-bold font-mono">- Rs. {trip.discountAmount}</span>
                                            </div>
                                        )}
                                        <p className="mt-2"><strong>Status:</strong> <span
                                            className="text-yellow-600">{trip.status || "N/A"}</span></p>


                                        <div className="flex justify-end mt-4">
                                            {trip.status === "Accepted" && new Date(trip.date) <= new Date() ? (
                                                <button
                                                    onClick={() => handleStatusUpdateUI(trip._id!, "Processing")}
                                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                                >
                                                    Start Trip
                                                </button>
                                            ) : trip.status === "Accepted" ? (
                                                <p className="text-sm text-gray-500 italic">
                                                    Trip starts on {new Date(trip.date).toLocaleString()}
                                                </p>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusUpdateUI(trip._id!, "Completed")}
                                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {driverCompletedTrips.length > 0 && (
                        <div className="mt-10 mb-8">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Completed Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {driverCompletedTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        {trip.customerId && (
                                            <p><strong>Customer:</strong> {trip.customerId.name} ({trip.customerId.email})</p>
                                        )}
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model || "N/A"}</p>
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        <div className="mt-2 flex justify-between items-center">
                                            <p><strong>Status:</strong> <span className="text-green-600 font-bold">{trip.status || "N/A"}</span></p>
                                        </div>
                                        <button
                                            onClick={() => setInvoiceTripId(trip._id!)}
                                            className="mt-3 w-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-semibold py-1.5 rounded transition"
                                        >
                                            View Invoice / Receipt
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {((user?.role?.toLowerCase() || role?.toLowerCase()) === "customer") && (
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-center">My Trips</h2>

                    {customerTrips.length === 0 && (
                        <p className="text-center text-gray-600">You don't have any trips at the moment.</p>
                    )}

                    {customerPendingTrips.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Pending Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {customerPendingTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        <p><strong>Driver:</strong> {trip.driverId?.name || "N/A"}</p>
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model}</p>
                                        {trip.promoCode && (
                                            <p className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                                                <span className="text-green-700 font-bold text-xs uppercase tracking-wider">Promo: {trip.promoCode} applied</span>
                                                <br />
                                                <span className="text-red-600 font-black text-lg">- Rs. {trip.discountAmount}</span>
                                            </p>
                                        )}
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        <p className="mt-2"><strong>Status:</strong> <span
                                            className="text-blue-600">{trip.status}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {customerProcessingTrips.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Active Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {customerProcessingTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        <p><strong>Driver:</strong> {trip.driverId?.name || "N/A"}</p>
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model}</p>
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        {trip.promoCode && (
                                            <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                                                <span className="text-green-700 font-bold text-xs uppercase tracking-wider">Promo: {trip.promoCode} applied</span>
                                                <br />
                                                <span className="text-red-600 font-black text-lg">- Rs. {trip.discountAmount}</span>
                                            </div>
                                        )}
                                        <p className="mt-2"><strong>Status:</strong> <span
                                            className="text-yellow-600">{trip.status}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {customerCompletedTrips.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2 text-gray-700">Completed Trips</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {customerCompletedTrips.map(trip => (
                                    <div key={trip._id}
                                        className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-2">{trip.startLocation} → {trip.endLocation}</h3>
                                        <p><strong>Driver:</strong> {trip.driverId?.name || "N/A"}</p>
                                        <p><strong>Date:</strong> {formatTripDate(trip)}</p>
                                        <p><strong>Distance:</strong> {trip.distance || "N/A"} km</p>
                                        <p><strong>Price:</strong> Rs. {trip.price || "N/A"}</p>
                                        <p><strong>Vehicle:</strong> {trip.vehicleId?.brand} {trip.vehicleId?.model}</p>
                                        {trip.notes && <p><strong>Notes:</strong> {trip.notes}</p>}
                                        <p className="mt-2 text-sm"><strong>Status:</strong> <span
                                            className="text-green-600 font-semibold">{trip.status}</span></p>

                                        <button
                                            onClick={() => setInvoiceTripId(trip._id!)}
                                            className="mt-3 w-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-semibold py-1.5 rounded transition"
                                        >
                                            View Invoice / Receipt
                                        </button>

                                        {trip._id &&
                                            trip.driverId?._id &&
                                            !ratedTrips.has(trip._id) && (
                                                <div className="flex justify-end mt-4">
                                                    <button
                                                        onClick={() => {
                                                            setRatingModal({
                                                                show: true,
                                                                tripId: trip._id!,
                                                                driverId: trip.driverId._id!,
                                                                driverName: trip.driverId.name || "Driver"
                                                            });
                                                        }}
                                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                                    >
                                                        Rate Driver
                                                    </button>
                                                </div>
                                            )}

                                        {trip._id && ratedTrips.has(trip._id) && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500 italic">✓ You have rated this trip</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {ratingModal?.show && (
                <RatingModal
                    tripId={ratingModal.tripId}
                    driverId={ratingModal.driverId}
                    driverName={ratingModal.driverName}
                    onClose={() => setRatingModal(null)}
                    onRatingSubmitted={() => {
                        checkRatedTrips();
                        dispatch(getAllTrips());
                    }}
                />
            )}

            {showDetailsModal && selectedTripDetails && (
                <TripDetailsModal
                    trip={selectedTripDetails}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedTripDetails(null);
                    }}
                />
            )}

            {invoiceTripId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
                        <button
                            onClick={() => setInvoiceTripId(null)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 font-bold"
                        >✕</button>
                        <Invoice
                            tripId={invoiceTripId}
                            currentUserRole={role}
                            onPaymentComplete={() => {
                                // Optional: Refresh trip list if needed to update UI elsewhere
                                dispatch(getAllTrips());
                            }}
                        />
                    </div>
                </div>
            )}

            {showReassignModal && reassignTripId && reassignTripDetails && (
                <TripReassignmentModal
                    isOpen={showReassignModal}
                    onClose={() => {
                        setShowReassignModal(false);
                        setReassignTripId(null);
                        setReassignTripDetails(null);
                        dispatch(getAllTrips());
                    }}
                    tripId={reassignTripId}
                    tripDetails={reassignTripDetails}
                />
            )}
        </>
    );
}
