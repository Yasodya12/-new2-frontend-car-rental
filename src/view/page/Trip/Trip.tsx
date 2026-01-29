import { useEffect, useState, type ChangeEvent } from "react";
import { backendApi } from "../../../api";
import type { PopulatedTripDTO, TripData } from "../../../Model/trip.data.ts";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { getAllDrivers, getDriversNearby } from "../../../slices/driverSlices.ts";
import { getAllVehicles, getVehiclesNearby } from "../../../slices/vehicleSlices.ts";
import { getAllTrips } from "../../../slices/TripSlice.ts";
import { getUserFromToken } from "../../../auth/auth.ts";
import { getUserByEmail } from "../../../slices/UserSlices.ts";
import { useLocation } from "react-router-dom";

import { SRI_LANKA_PROVINCES, extractDistrictFromAddress } from "../../../utils/sriLankaLocations.ts";
import { RatingModal } from "../../components/RatingModal/RatingModal.tsx";
import { LocationPicker } from "../../common/Map/LocationPicker.tsx";
import { getRouteDistance } from "../../../utils/mapUtils.ts";
import type { UserData } from "../../../Model/userData.ts";
import type { VehicleData } from "../../../Model/vehicleData.ts";
import { TripReassignmentModal } from "../../components/TripReassignmentModal.tsx";
import { Invoice } from "../../components/Invoice/Invoice.tsx";

import { FaCar, FaClock, FaCalendarAlt, FaRoute, FaUser, FaStickyNote, FaCheckCircle } from 'react-icons/fa';
import { HiArrowRight, HiTruck } from 'react-icons/hi';

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
    const [datePart, timePart] = localDateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    return date.toISOString();
};

// --- Sub-Components ---

const Pagination = ({ totalItems, currentPage, onPageChange, itemsPerPage }: { totalItems: number, currentPage: number, onPageChange: (page: number) => void, itemsPerPage: number }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center mt-12 gap-3">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-sm active:scale-95'}`}
            >
                Prev
            </button>
            <div className="flex items-center px-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                    Mission Page <span className="text-blue-600">{currentPage}</span> / {totalPages}
                </span>
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === totalPages ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-200 shadow-sm active:scale-95'}`}
            >
                Next
            </button>
        </div>
    );
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
    const [endProvince, setEndProvince] = useState<string>("");
    // const [startDistrict, setStartDistrict] = useState<string>("");
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
    const [reassignTripId, setReassignTripId] = useState<string | null>(null);
    const [reassignTripDetails, setReassignTripDetails] = useState<{
        startLocation: string;
        endLocation: string;
        price: number;
        date: string;
        endDate?: string;
        startLat: number;
        startLng: number;
    } | null>(null);
    const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [promoCodeInput, setPromoCodeInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<{
        code: string;
        discountAmount: number;
        newTotal: number;
    } | null>(null);

    const availableCategories = ["All", "Economy", "Standard", "Premium", "Luxury"];

    const handleApplyPromo = async () => {
        if (!promoCodeInput) {
            setPromoError("Please enter a promo code.");
            return;
        }
        if (!tripData.price || tripData.price <= 0) {
            setPromoError("Please calculate trip price first.");
            return;
        }

        setIsValidatingPromo(true);
        setPromoError(null);
        try {
            const response = await backendApi.post("/api/v1/promos/apply", {
                code: promoCodeInput,
                originalPrice: tripData.price,
            });
            setAppliedPromo(response.data);
            setTripData(prev => ({ ...prev, price: response.data.newTotal }));
        } catch (error: any) {
            setPromoError(error.response?.data?.message || "Failed to apply promo code.");
            setAppliedPromo(null);
        } finally {
            setIsValidatingPromo(false);
        }
    };


    // Use nearby lists if start location is selected, otherwise use all
    // Filter out unavailable drivers
    const drivers = (startCoords ? driverState.nearbyList : driverState.list)
        .filter((d: UserData) => d.isAvailable !== false);

    const vehicles = startCoords ? vehicleState.nearbyList : vehicleState.list;

    // Redundant declarations removed

    const filteredVehicles = selectedCategory === "All"
        ? vehicles
        : vehicles.filter(v => (v.category || "Standard") === selectedCategory);

    // Filter Filters for Admin View
    const [activeTab, setActiveTab] = useState<'All' | 'Instant' | 'Scheduled'>('All');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, filterStatus]);



    // Filter trips based on inputs
    const getFilteredTrips = () => {
        if (!trips || !Array.isArray(trips)) return [];
        return trips.filter(trip => {
            // Filter by Tab (Trip Type)
            if (activeTab === 'Instant' && trip.tripType !== 'Instant') return false;
            if (activeTab === 'Scheduled' && trip.tripType !== 'Scheduled') return false;

            // Filter by Status
            if (filterStatus !== 'All' && trip.status !== filterStatus) return false;

            return true;
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    };

    const filteredTrips = getFilteredTrips();

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
            const currUserId = (user?._id || (user as any)?.id || "").toString();
            return tripCustId && currUserId && tripCustId === currUserId;
        }
    );

    // Driver trips
    const driverTrips = localTrips.filter(
        (trip) => {
            const tripDriverId = (trip.driverId?._id || trip.driverId || "").toString();
            const currUserId = (user?._id || (user as any)?.id || "").toString();

            // Show if it's assigned to me OR if it's a broadcast trip
            return (tripDriverId && currUserId && tripDriverId === currUserId) ||
                (trip.isBroadcast && trip.status === "Pending");
        }
    );

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
            if (user?.role?.toLowerCase() === "customer" && user._id && localTrips.length > 0) {
                const customerCompleted = localTrips.filter(
                    (trip) => trip.customerId && trip.customerId._id && user._id && trip.customerId._id === user._id && (trip.status === "Completed" || trip.status === "Paid")
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
        const tripIdFromParams = params.get("tripId"); // Get tripId from params

        if (reassignTripIdParam && localTrips.length > 0) {
            console.log("Reassign Param detected:", reassignTripIdParam);
            // Use tripIdFromParams if available, otherwise fallback to reassignTripIdParam
            const tripToFind = tripIdFromParams || reassignTripIdParam;
            const trip = localTrips.find(t => t._id === tripToFind);
            console.log("Trip found for reassign:", trip?._id, "Status:", trip?.status);

            if (trip && trip.status?.toLowerCase() === 'rejected') {
                setReassignTripId(tripToFind); // Use the ID that was found
                setReassignTripDetails({
                    startLocation: trip.startLocation,
                    endLocation: trip.endLocation,
                    price: trip.price || 0,
                    date: trip.date,
                    endDate: trip.endDate || undefined,
                    startLat: trip.startLat || 0,
                    startLng: trip.startLng || 0
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

    // Update provinces when addresses change (for route-specific driver sorting)
    useEffect(() => {
        if (startAddress) {
            const province = extractProvinceFromAddress(startAddress);
            setStartProvince(province);
        } else {
            setStartProvince("");
        }

        if (endAddress) {
            const province = extractProvinceFromAddress(endAddress);
            setEndProvince(province);
        } else {
            setEndProvince("");
        }
    }, [startAddress, endAddress]);

    // Updated imports - manually added here in snippet context
    // import { SRI_LANKA_PROVINCES, extractDistrictFromAddress } from "../../../utils/sriLankaLocations.ts";

    // Fetch nearby drivers and vehicles when start location is selected
    useEffect(() => {
        if (startCoords) {
            // Pass date and endDate (if extended trip) for availability checking
            const reqDate = tripData.date;
            const reqEndDate = tripData.tripType === "Scheduled" ? tripData.endDate : undefined;

            const startDistrict = extractDistrictFromAddress(startAddress);
            const endDistrict = extractDistrictFromAddress(endAddress);

            dispatch(getDriversNearby({
                lat: startCoords.lat,
                lng: startCoords.lng,
                radius: 5,
                date: reqDate,
                endDate: reqEndDate,
                endLat: endCoords?.lat,
                endLng: endCoords?.lng,
                startDistrict: startDistrict,
                endDistrict: endDistrict
            }));

            dispatch(getVehiclesNearby({
                lat: startCoords.lat,
                lng: startCoords.lng,
                radius: 5,
                date: reqDate,
                endDate: reqEndDate
            }));
        }
    }, [startCoords, endCoords, dispatch, tripData.date, tripData.endDate, tripData.tripType, startAddress, endAddress]);

    // Reset selected driver if they are no longer in the filtered list
    useEffect(() => {
        // Only reset if we have a list of drivers and the current selected driver is NOT in it.
        // If the list is empty, it might be loading or in a transition state, so we wait.
        if (tripData.driverId && !driverState.loading && drivers.length > 0) {
            const isDriverAvailable = drivers.find((d: UserData) => d._id === tripData.driverId);
            if (!isDriverAvailable) {
                setTripData(prev => ({ ...prev, driverId: "" }));
            }
        }
    }, [drivers, tripData.driverId, driverState.loading]);

    // Calculate route-specific expertise score for a driver
    const calculateRouteExpertise = (driver: UserData, startProv: string, endProv: string): number => {
        if (!driver.provincesVisited || driver.provincesVisited.length === 0) return 0;

        // Get trip counts for start and end provinces
        const startExp = driver.provincesVisited.find(p => p.province === startProv)?.count || 0;
        const endExp = driver.provincesVisited.find(p => p.province === endProv)?.count || 0;

        // If same province (e.g., Colombo to Colombo), just return the count
        if (startProv === endProv) {
            return startExp * 10;
        }

        // For different provinces, prioritize drivers who know BOTH areas
        // min() ensures balanced experience, sum gives overall route exposure
        // Formula: min(start, end) * 10 + (start + end)
        // This heavily weights drivers with experience in BOTH provinces
        return Math.min(startExp, endExp) * 10 + (startExp + endExp);
    };

    // Auto-select best driver based on route-specific expertise
    // Re-runs when route changes (endProvince) to update suggestion
    useEffect(() => {
        if (startCoords && drivers.length > 0 && !driverState.loading) {
            // Route-specific sorting logic
            const sortedDrivers = [...drivers].sort((a, b) => {
                const aRating = a.averageRating || 0;
                const bRating = b.averageRating || 0;
                const aExp = a.experience || 0;
                const bExp = b.experience || 0;

                // 1. Route Expertise - Highest priority if both provinces are known
                if (startProvince && endProvince) {
                    const aRouteScore = calculateRouteExpertise(a, startProvince, endProvince);
                    const bRouteScore = calculateRouteExpertise(b, startProvince, endProvince);
                    if (aRouteScore !== bRouteScore) {
                        console.log(`Route expertise: ${a.name} = ${aRouteScore}, ${b.name} = ${bRouteScore}`);
                        return bRouteScore - aRouteScore;
                    }
                } else if (startProvince) {
                    // Fallback to start province only if end is unknown
                    const aStartExp = a.provincesVisited?.find(p => p.province === startProvince)?.count || 0;
                    const bStartExp = b.provincesVisited?.find(p => p.province === startProvince)?.count || 0;
                    if (aStartExp !== bStartExp) return bStartExp - aStartExp;
                }

                // 2. Rating - Secondary priority
                if (aRating !== bRating) return bRating - aRating;

                // 3. General Experience - Tiebreaker
                return bExp - aExp;
            });

            if (sortedDrivers.length > 0) {
                const bestDriver = sortedDrivers[0];
                // Auto-select if no driver chosen, or if route changed (endProvince changed)
                if (!tripData.driverId || (startProvince && endProvince)) {
                    setTripData(prev => ({ ...prev, driverId: bestDriver._id || "" }));
                    console.log("Route-based suggestion:", bestDriver.name,
                        "| Route score:", calculateRouteExpertise(bestDriver, startProvince, endProvince),
                        "| Route:", startProvince, "→", endProvince);
                }
            }
        }
    }, [drivers, startCoords, driverState.loading, startProvince, endProvince]);

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
                setTripData(prev => ({ ...prev, vehicleId: bestVehicle._id || "" }));
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

            // Ensure Driver and Vehicle are selected
            if (!tripData.driverId) {
                alert("Please select a driver for this trip.");
                return;
            }

            if (!tripData.vehicleId) {
                alert("Please select a vehicle for this trip.");
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
            setEndProvince("");
            // setStartDistrict("");
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
        <div className="fixed inset-0 bg-[#0B0F1A]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 lg:p-8" onClick={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4 relative border border-white/20" onClick={(e) => e.stopPropagation()}>
                {/* Header Contextual Label */}
                {/*<div className="absolute top-8 right-12 z-20">*/}
                {/*    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] shadow-sm ${trip.status === "Completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :*/}
                {/*        trip.status === "Processing" ? "bg-amber-50 text-amber-600 border border-amber-100" :*/}
                {/*            trip.status === "Accepted" ? "bg-blue-50 text-blue-600 border border-blue-100" :*/}
                {/*                trip.status === "Pending" ? "bg-orange-50 text-orange-600 border border-orange-100" :*/}
                {/*                    "bg-gray-50 text-gray-600 border border-gray-100"*/}
                {/*        }`}>*/}
                {/*        {trip.status || "Status Unknown"}*/}
                {/*    </span>*/}
                {/*</div>*/}

                <div className="p-10 lg:p-14">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FaRoute className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Mission Metadata</h2>
                            <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mt-1">Trip Reference: {trip._id?.slice(-8)}</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* High-Fidelity Route Visualization */}
                        <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden">
                            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-100 rounded-full blur-[80px] opacity-30"></div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="mt-1 flex flex-col items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                                            <div className="w-0.5 h-12 bg-gradient-to-b from-emerald-200 to-red-200"></div>
                                            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-50"></div>
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Departure Point</p>
                                                <p className="text-lg font-bold text-gray-900 leading-tight">{trip.startLocation}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Destination Vector</p>
                                                <p className="text-lg font-bold text-gray-900 leading-tight">{trip.endLocation}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto flex md:flex-col gap-4">
                                    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Distance</p>
                                        <p className="text-2xl font-black text-gray-900">{trip.distance || "0"}<span className="text-sm font-bold ml-1">KM</span></p>
                                    </div>
                                    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-2xl font-black text-emerald-600">Rs. {trip.price?.toLocaleString() || "0"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Entity Profiles */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Operator & Unit</h4>
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                                    {trip.driverId && (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                <FaUser />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Driver</p>
                                                <p className="font-bold text-gray-900">{trip.driverId.name}</p>
                                            </div>
                                        </div>
                                    )}
                                    {trip.vehicleId && (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                                <FaCar />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</p>
                                                <p className="font-bold text-gray-900">{trip.vehicleId.brand} {trip.vehicleId.model}</p>
                                                <p className="text-[11px] text-gray-500 font-medium">{trip.vehicleId.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2">Trip data</h4>
                                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                            <FaCalendarAlt />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip Date</p>
                                            <p className="font-bold text-gray-900">{trip.date ? new Date(trip.date).toLocaleString() : "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <FaClock />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip Type</p>
                                            <p className="font-bold text-gray-900 capitalize">{trip.tripType} Operation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {trip.notes && (
                            <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-100 flex gap-4">
                                <div className="mt-1 text-amber-500"><FaStickyNote /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-widest mb-1">Operational Directives</p>
                                    <p className="text-gray-700 font-medium italic">"{trip.notes}"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-14 pt-8 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-xl shadow-gray-200"
                            >
                                Close
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Fleet v5.0.2</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTripCard = (trip: PopulatedTripDTO, isMarketplace: boolean) => {
        const status = trip.status?.toLowerCase() || 'pending';
        const isCompleted = status === 'completed' || status === 'paid';
        const isProcessing = status === 'processing';
        const isAccepted = status === 'accepted';
        const isPending = status === 'pending';

        return (
            <div
                key={trip._id}
                onClick={() => { setSelectedTripDetails(trip); setShowDetailsModal(true); }}
                className="group relative bg-white border border-gray-200 rounded-3xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
                {/* Ambient Background Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-5 transition-opacity duration-700 group-hover:opacity-10 ${isCompleted ? 'bg-emerald-400' :
                        isProcessing ? 'bg-amber-400' :
                            isAccepted ? 'bg-blue-400' :
                                'bg-gray-400'
                    }`}></div>

                <div className="relative z-10">
                    {/* Header Section - Trip ID and Status (side by side) */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md transition-transform duration-500 group-hover:scale-110 ${isCompleted ? 'bg-emerald-50 text-emerald-600' :
                                    isProcessing ? 'bg-amber-50 text-amber-600' :
                                        isAccepted ? 'bg-blue-50 text-blue-600' :
                                            'bg-gray-50 text-gray-400'
                                }`}>
                                <FaRoute />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-0.5">Trip ID</p>
                                <p className="text-sm font-bold text-gray-900">#{trip._id?.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className={`px-4 py-2 rounded-xl text-xs font-semibold border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                isProcessing ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    isAccepted ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                            {trip.status}
                        </div>
                    </div>

                    {/* Action Buttons - Moved below header */}
                    <div className="flex gap-2 mb-6">
                        {isCompleted && user?.role?.toLowerCase() === 'customer' && !ratedTrips.has(trip._id!) && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRatingModal({
                                        show: true,
                                        tripId: trip._id!,
                                        driverId: trip.driverId?._id!,
                                        driverName: trip.driverId?.name!
                                    });
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                                title="Rate Driver"
                            >
                                ⭐ Rate Trip
                            </button>
                        )}
                        {isCompleted && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setInvoiceTripId(trip._id!);
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                                title="View Invoice"
                            >
                                📄 Invoice
                            </button>
                        )}
                    </div>

                    {/* Route Section */}
                    <div className="space-y-6 mb-6">
                        <div className="relative pl-6 border-l-2 border-dashed border-gray-200 space-y-6">
                            <div className="absolute top-0 -left-[5px] w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></div>
                            <div className="absolute bottom-0 -left-[5px] w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/50"></div>

                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1.5">Pickup Location</p>
                                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{trip.startLocation}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1.5">Drop-off Location</p>
                                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{trip.endLocation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Trip Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-gray-100">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors group-hover:bg-blue-50 group-hover:border-blue-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Total Fee</p>
                            <p className="text-lg font-bold text-blue-600">Rs. {trip.price?.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors group-hover:bg-blue-50 group-hover:border-blue-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Distance</p>
                            <p className="text-lg font-bold text-gray-900">{trip.distance} <span className="text-sm text-gray-500">km</span></p>
                        </div>
                    </div>

                    {/* Footer with Icons and Details Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex -space-x-2">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 shadow-sm" title="Driver">
                                <FaUser />
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-blue-600 shadow-sm" title="Vehicle">
                                <FaCar />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group/btn">
                            <span className="text-xs font-semibold">View Details</span>
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-all group-hover/btn:bg-blue-600 group-hover/btn:text-white">
                                <HiArrowRight />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons for Different States */}
                    {((isMarketplace && isPending) || (!isMarketplace && isPending && user?.role?.toLowerCase() === 'driver')) && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdateUI(trip._id!, 'Accepted');
                            }}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaCheckCircle /> {isMarketplace ? 'Accept Trip' : 'Accept Request'}
                        </button>
                    )}

                    {!isMarketplace && isAccepted && user?.role?.toLowerCase() === 'driver' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdateUI(trip._id!, 'Processing');
                            }}
                            className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaClock /> Start Trip
                        </button>
                    )}

                    {!isMarketplace && isProcessing && user?.role?.toLowerCase() === 'driver' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdateUI(trip._id!, 'Completed');
                            }}
                            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaCheckCircle /> Complete Trip
                        </button>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-[#F8FAFC] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] p-4 lg:p-10 font-sans">

            <div className="max-w-7xl mx-auto space-y-12">
                {/* 1. MISSION DISPATCH CONSOLE (Customer & Admin) */}
                {(user?.role?.toLowerCase() !== "driver") && (
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-1 shadow-[0_40px_90px_rgba(0,0,0,0.06)] border border-white/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* Internal Ambient Glow */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>

                        <div className="p-8 lg:p-14 relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                                <div>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                                            <HiTruck className="text-white text-2xl" />
                                        </div>
                                        <h1 className="text-4xl font-bold text-gray-900">
                                            {isUpdating ? "Update Booking" : "Book Your Ride"}
                                        </h1>
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm ml-1">Fast, reliable, and comfortable transportation</p>
                                </div>
                                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                                    {(['Quick Ride', 'Extended Trip'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => handleTripModeChange(mode)}
                                            className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all ${tripMode === mode
                                                ? "bg-white text-blue-600 shadow-md"
                                                : "text-gray-600 hover:text-gray-900"
                                                }`}
                                        >
                                            {mode === 'Quick Ride' ? 'Quick Ride' : 'Schedule Trip'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Left Column: Trip Details */}
                                    <div className="space-y-8">
                                        {/* 1. Pickup & Drop-off Locations */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                                                        1
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700">Pickup Location</span>
                                                </div>
                                                <LocationPicker
                                                    onLocationSelect={(lat, lng, address) => {
                                                        setStartCoords({ lat, lng });
                                                        setStartAddress(address);
                                                        setTripData(prev => ({ ...prev, startLocation: address, startLat: lat, startLng: lng }));
                                                    }}
                                                />
                                            </div>

                                            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shadow-md">
                                                        2
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-700">Drop-off Location</span>
                                                </div>
                                                <LocationPicker
                                                    onLocationSelect={(lat, lng, address) => {
                                                        setEndCoords({ lat, lng });
                                                        setEndAddress(address);
                                                        setTripData(prev => ({ ...prev, endLocation: address, endLat: lat, endLng: lng }));
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* 2. Driver Selection */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                                    Select Driver
                                                </label>
                                                {!startCoords && (
                                                    <span className="text-xs font-medium text-amber-600 animate-pulse">
                                                        Select pickup to view drivers
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none snap-x">
                                                {drivers.length === 0 ? (
                                                    <div className="w-full py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                        <p className="text-sm font-medium text-gray-400">No drivers available in this area</p>
                                                    </div>
                                                ) : (
                                                    drivers.map(d => (
                                                        <div
                                                            key={d._id}
                                                            onClick={() => setTripData(prev => ({ ...prev, driverId: d._id! }))}
                                                            className={`min-w-[260px] snap-start bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer ${tripData.driverId === d._id
                                                                ? 'border-blue-600 shadow-lg ring-2 ring-blue-100'
                                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 mb-4">
                                                                {d.profileImage ? (
                                                                    <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${tripData.driverId === d._id
                                                                        ? 'border-blue-600 ring-2 ring-blue-100'
                                                                        : 'border-gray-200'
                                                                        }`}>
                                                                        <img
                                                                            src={d.profileImage}
                                                                            alt={d.name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors ${tripData.driverId === d._id
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'bg-gray-100 text-gray-400'
                                                                        }`}>
                                                                        <FaUser />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="text-base font-bold text-gray-900">{d.name}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-sm font-semibold text-amber-500">
                                                                            ⭐ {d.averageRating?.toFixed(1) || "5.0"}
                                                                        </span>
                                                                        <span className="text-xs font-medium text-gray-500">
                                                                            {(() => {
                                                                                // 1. Exact Route Match (District to District) - Prioritized
                                                                                if (d.routeTripCount !== undefined) {
                                                                                    return `${d.routeTripCount} trips on this route`;
                                                                                }

                                                                                // 2. Province Match logic
                                                                                if (startProvince && endProvince && d.provincesVisited) {
                                                                                    const startCount = d.provincesVisited.find(p => p.province === startProvince)?.count || 0;
                                                                                    const endCount = d.provincesVisited.find(p => p.province === endProvince)?.count || 0;

                                                                                    // If same province, show that count
                                                                                    if (startProvince === endProvince) {
                                                                                        return `${startCount} trips in ${startProvince}`;
                                                                                    }

                                                                                    // Show combined for route
                                                                                    return `${startCount + endCount} route trips`;
                                                                                } else if (startProvince && d.provincesVisited) {
                                                                                    const count = d.provincesVisited.find(p => p.province === startProvince)?.count || 0;
                                                                                    return `${count} trips in ${startProvince}`;
                                                                                }

                                                                                // Fallback to total
                                                                                return `${d.experience || 0} total trips`;
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                                <span className="text-xs font-medium text-gray-500">Verified Driver</span>
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Vehicle Selection */}
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                                                <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                                    Choose Vehicle
                                                </label>
                                                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
                                                    {availableCategories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedCategory === cat
                                                                ? 'bg-white text-purple-600 shadow-sm'
                                                                : 'text-gray-600 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredVehicles.length === 0 ? (
                                                    <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                        <p className="text-sm font-medium text-gray-400">
                                                            No vehicles available in {selectedCategory} category
                                                        </p>
                                                    </div>
                                                ) : (
                                                    filteredVehicles.map(v => (
                                                        <div
                                                            key={v._id}
                                                            onClick={() => setTripData(prev => ({ ...prev, vehicleId: v._id! }))}
                                                            className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${tripData.vehicleId === v._id
                                                                ? 'border-purple-600 shadow-xl ring-2 ring-purple-100'
                                                                : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                                                                }`}
                                                        >
                                                            {/* Vehicle Image */}
                                                            <div className="relative h-36 overflow-hidden bg-gray-100">
                                                                {v.image ? (
                                                                    <img
                                                                        src={v.image}
                                                                        alt={`${v.brand} ${v.model}`}
                                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                                        <FaCar className="text-5xl text-gray-300" />
                                                                    </div>
                                                                )}
                                                                {/* Category Badge */}
                                                                <div className="absolute top-3 right-3">
                                                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border ${v.category === 'Luxury' ? 'bg-amber-500/90 text-white border-amber-400' :
                                                                        v.category === 'Premium' ? 'bg-purple-500/90 text-white border-purple-400' :
                                                                            v.category === 'Economy' ? 'bg-green-500/90 text-white border-green-400' :
                                                                                'bg-blue-500/90 text-white border-blue-400'
                                                                        }`}>
                                                                        {v.category}
                                                                    </span>
                                                                </div>
                                                                {/* Selected Indicator */}
                                                                {tripData.vehicleId === v._id && (
                                                                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
                                                                        <span className="text-white font-bold">✓</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Vehicle Details */}
                                                            <div className="p-4 space-y-3">
                                                                {/* Title & Name */}
                                                                <div>
                                                                    <p className="text-base font-bold text-gray-900">
                                                                        {v.brand} {v.model}
                                                                    </p>
                                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">{v.name}</p>
                                                                </div>

                                                                {/* Price */}
                                                                <div className={`rounded-xl p-3 border transition-all ${tripData.vehicleId === v._id
                                                                    ? 'bg-purple-50 border-purple-200'
                                                                    : 'bg-gray-50 border-gray-200'
                                                                    }`}>
                                                                    <p className="text-xs font-medium text-gray-500 mb-1">Rate</p>
                                                                    <p className="text-2xl font-bold text-purple-600">
                                                                        Rs. {v.pricePerKm || 100}
                                                                        <span className="text-sm text-gray-500 font-semibold ml-1">/km</span>
                                                                    </p>
                                                                </div>

                                                                {/* Specifications Grid */}
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="text-center bg-gray-50 rounded-xl p-2 border border-gray-200">
                                                                        <p className="text-xs font-medium text-gray-500 mb-1">Seats</p>
                                                                        <p className="text-sm font-bold text-gray-900">{v.seats || 4}</p>
                                                                    </div>
                                                                    <div className="text-center bg-gray-50 rounded-xl p-2 border border-gray-200">
                                                                        <p className="text-xs font-medium text-gray-500 mb-1">Year</p>
                                                                        <p className="text-sm font-bold text-gray-900">{v.year || 'N/A'}</p>
                                                                    </div>
                                                                    <div className="text-center bg-gray-50 rounded-xl p-2 border border-gray-200">
                                                                        <p className="text-xs font-medium text-gray-500 mb-1">Color</p>
                                                                        <div className="flex items-center justify-center">
                                                                            <div
                                                                                className="w-4 h-4 rounded-full border-2 border-gray-300 shadow-sm"
                                                                                style={{ backgroundColor: v.color || '#666' }}
                                                                                title={v.color}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Description */}
                                                                {v.description && (
                                                                    <div className="pt-2 border-t border-gray-100">
                                                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                                                            {v.description}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Selection Indicator */}
                                                                {tripData.vehicleId === v._id && (
                                                                    <div className="flex items-center justify-center gap-2 pt-1">
                                                                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></div>
                                                                        <p className="text-xs font-semibold text-purple-600">Selected</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Trip Summary & Options */}
                                    <div className="space-y-8">
                                        {/* Date Selection for Extended Trips */}
                                        {tripMode === 'Extended Trip' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-gray-700 ml-1">Start Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={tripData.date ? toLocalDateTimeString(tripData.date) : ""}
                                                        onChange={(e) => setTripData(prev => ({ ...prev, date: fromLocalDateTimeString(e.target.value) }))}
                                                        className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 px-5 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-gray-700 ml-1">End Date & Time</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={tripData.endDate ? toLocalDateTimeString(tripData.endDate) : ""}
                                                        onChange={(e) => setTripData(prev => ({ ...prev, endDate: fromLocalDateTimeString(e.target.value) }))}
                                                        className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 px-5 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Trip Summary Card */}
                                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                            <div className="relative z-10 space-y-6">
                                                <h3 className="text-lg font-bold mb-6">Trip Summary</h3>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-xs font-medium text-blue-200 mb-2">Total Distance</p>
                                                        <p className="text-4xl font-bold">
                                                            {isCalculatingDistance ? "..." : (tripData.distance || "0")}
                                                            <span className="text-lg ml-1 opacity-70">km</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-blue-200 mb-2">Total Fare</p>
                                                        <p className="text-4xl font-bold">
                                                            Rs. {tripData.price?.toLocaleString() || "0"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Promo Code Section */}
                                                <div className="pt-4 space-y-3">
                                                    <p className="text-sm font-semibold">Have a promo code?</p>
                                                    <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-1.5 border border-white/20 flex">
                                                        <input
                                                            placeholder="Enter promo code"
                                                            className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/50 font-medium px-4 py-2.5 w-full text-sm focus:outline-none"
                                                            value={promoCodeInput}
                                                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                                            disabled={!!appliedPromo}
                                                        />
                                                        {appliedPromo ? (
                                                            <button
                                                                type="button"
                                                                onClick={handleRemovePromo}
                                                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                                                            >
                                                                Remove
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={handleApplyPromo}
                                                                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                                                            >
                                                                Apply
                                                            </button>
                                                        )}
                                                    </div>
                                                    {promoError && (
                                                        <p className="text-xs text-red-200 font-medium ml-1">⚠️ {promoError}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Notes */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Additional Notes (Optional)</label>
                                            <textarea
                                                name="notes"
                                                value={tripData.notes || ""}
                                                onChange={handleChange}
                                                rows={4}
                                                placeholder="Add any special requests or instructions for the driver..."
                                                className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 px-5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Section */}
                                <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex flex-wrap justify-center gap-6">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                            <FaCheckCircle className="text-emerald-500 text-lg" /> Safe & Secure
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                            <FaClock className="text-blue-500 text-lg" /> Quick Booking
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                            <FaUser className="text-purple-500 text-lg" /> Verified Drivers
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        {isUpdating && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsUpdating(false);
                                                    setSelectedTripId(null);
                                                    window.location.reload();
                                                }}
                                                className="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-semibold text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="flex-1 sm:min-w-[240px] bg-gray-900 hover:bg-black text-white py-4 px-8 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            {isUpdating ? "Update Booking" : "Book Now"}
                                            <HiArrowRight className="text-xl" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                {/* 2. ADMIN OPERATIONAL OVERSIGHT */}
                {((user?.role?.toLowerCase() || role?.toLowerCase()) === "admin") && (
                    <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-1 shadow-[0_40px_90px_rgba(0,0,0,0.04)] border border-white/20 relative overflow-hidden">
                        <div className="p-8 lg:p-14">
                            <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-16">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Operational Ledger</h2>
                                    </div>
                                    <p className="text-gray-400 font-bold uppercase tracking-[0.15em] text-[10px] ml-1">Observing {filteredTrips.length} global logistics vectors</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                    {['All', 'Instant', 'Scheduled'].map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveTab(tab as any)}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/5' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {tab} Units
                                        </button>
                                    ))}
                                    <div className="w-px h-6 bg-gray-200 mx-2"></div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none cursor-pointer pr-4"
                                    >
                                        <option value="All">All Logistics</option>
                                        {['Pending', 'Accepted', 'Processing', 'Completed', 'Paid', 'Cancelled', 'Rejected'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-8 lg:-mx-14 px-8 lg:px-14">
                                <table className="w-full border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                            <th className="px-8 pb-4">Logistics Nodes</th>
                                            <th className="px-8 pb-4">Geometry Matrix</th>
                                            <th className="px-8 pb-4">Status & Telemetry</th>
                                            <th className="px-8 pb-4 text-right">Fiscal Yield</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(trip => (
                                            <tr key={trip._id} className="group bg-white hover:bg-blue-50/20 transition-all rounded-3xl cursor-pointer" onClick={() => { setSelectedTripDetails(trip); setShowDetailsModal(true); }}>
                                                <td className="px-8 py-6 rounded-l-[1.8rem] border-y border-l border-gray-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                            {trip.customerId?.name?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{trip.customerId?.name || "Unverified Client"}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ref: #{trip._id?.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-gray-50">
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs font-bold text-gray-700 truncate max-w-[200px] flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span> {trip.startLocation}
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-700 truncate max-w-[200px] flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-red-500"></span> {trip.endLocation}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-gray-50">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${trip.status === 'Completed' || trip.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                                                        trip.status === 'Accepted' ? 'bg-blue-50 text-blue-600' :
                                                            trip.status === 'Processing' ? 'bg-amber-50 text-amber-600' :
                                                                'bg-gray-50 text-gray-400'}`}>
                                                        {trip.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 rounded-r-[1.8rem] border-y border-r border-gray-50 text-right">
                                                    <p className="text-lg font-black text-gray-900 leading-none">Rs. {trip.price?.toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 tracking-widest">{trip.distance} KM Radius</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredTrips.length === 0 && (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                            <FaRoute size={32} />
                                        </div>
                                        <p className="text-xl font-black text-gray-900 tracking-tight">Zero Logistics Nodes</p>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">No missions detected within current tactical parameters</p>
                                    </div>
                                )}
                            </div>
                            <Pagination totalItems={filteredTrips.length} currentPage={currentPage} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                        </div>
                    </div>
                )}


                {/* 3. DRIVER MISSION PULSE */}
                {((user?.role?.toLowerCase() || role?.toLowerCase()) === "driver") && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        {/* Availablity Control */}
                        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-10 shadow-[0_40px_90px_rgba(0,0,0,0.04)] border border-white/20 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                            <div className="flex items-center gap-6 relative z-10">
                                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-all duration-700 ${user?.isAvailable !== false ? 'bg-emerald-500 shadow-emerald-500/30 ring-4 ring-emerald-50' : 'bg-gray-200 shadow-gray-200/30'}`}>
                                    <FaUser className="text-white text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Driver Control Module</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${user?.isAvailable !== false ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                        <span className={`font-black uppercase tracking-[0.2em] text-[10px] ${user?.isAvailable !== false ? 'text-emerald-500' : 'text-gray-400'}`}>
                                            {user?.isAvailable !== false ? 'Current Status Available' : 'Current Status Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (user?._id) {
                                        try {
                                            const response = await backendApi.patch(`/api/v1/users/toggle-availability/${user._id}`);
                                            setUser(response.data);
                                        } catch (error) { console.error(error); }
                                    }
                                }}
                                className={`relative z-10 px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-2xl active:scale-95 ${user?.isAvailable !== false
                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-amber-200/20'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
                                    }`}
                            >
                                {user?.isAvailable !== false ? 'Set As Unavailable' : 'Set As Available'}
                            </button>
                        </div>

                        {/* Marketplace Broadcasting Section */}
                        {(() => {
                            const marketplaceTrips = driverTrips.filter(t => t.isBroadcast && t.status === "Pending");
                            if (marketplaceTrips.length === 0) return null;
                            return (
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-ping"></div> Live Broadcast
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Unassign Driver Trips</h3>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{marketplaceTrips.length} Operational Nodes</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        {marketplaceTrips.map(trip => renderTripCard(trip, true))}
                                    </div>
                                </section>
                            );
                        })()}

                        {/* Personal Mission Ledger */}
                        <section className="space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-6">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Personal Operational Ledger</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Historical & active logistics tracking</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                    {(['All', 'Pending', 'Accepted', 'Processing', 'Completed'] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFilterStatus(s)}
                                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {(() => {
                                const myTrips = driverTrips.filter(t => !(t.isBroadcast && t.status === "Pending"));
                                const filteredMyTrips = myTrips.filter(trip => {
                                    if (filterStatus !== 'All' && trip.status !== filterStatus) return false;
                                    if (activeTab !== 'All' && trip.tripType !== activeTab) return false;
                                    return true;
                                }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                                if (filteredMyTrips.length === 0) {
                                    return (
                                        <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100">
                                            <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-gray-100">
                                                <HiTruck size={40} />
                                            </div>
                                            <p className="text-xl font-black text-gray-900 tracking-tight lowercase first-letter:uppercase italic font-serif">No missions inscribed in ledger</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-4">Awaiting operational requisition...</p>
                                        </div>
                                    );
                                }

                                const indexOfLastItem = currentPage * itemsPerPage;
                                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                                const currentMyTrips = filteredMyTrips.slice(indexOfFirstItem, indexOfLastItem);

                                return (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                            {currentMyTrips.map(trip => renderTripCard(trip, false))}
                                        </div>
                                        <Pagination totalItems={filteredMyTrips.length} currentPage={currentPage} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                                    </div>
                                );
                            })()}
                        </section>
                    </div>
                )}



                {/* 4. CUSTOMER MISSION ARCHIVE */}
                {((user?.role?.toLowerCase() || role?.toLowerCase()) === "customer") && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-10 px-8">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mission History</h2>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Comprehensive archive of your transit logistics</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-xl">
                                {(['All', 'Instant', 'Scheduled'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {tab} History
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(() => {
                            const filteredCustomerTrips = customerTrips.filter(trip => {
                                if (activeTab !== 'All' && trip.tripType !== activeTab) return false;
                                if (filterStatus !== 'All' && trip.status !== filterStatus) return false;
                                return true;
                            }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                            const indexOfLastItem = currentPage * itemsPerPage;
                            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                            const currentTrips = filteredCustomerTrips.slice(indexOfFirstItem, indexOfLastItem);

                            if (currentTrips.length === 0) {
                                return (
                                    <div className="bg-white/50 backdrop-blur-xl rounded-[3rem] p-32 text-center border border-gray-100 border-dashed">
                                        <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-10 text-gray-100">
                                            <FaCar size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Archive Empty</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-4">No tactical mission data found for selected filters</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                        {currentTrips.map(trip => renderTripCard(trip, false))}
                                    </div>
                                    <Pagination totalItems={filteredCustomerTrips.length} currentPage={currentPage} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* MODAL LAYER ZONE */}
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
                <div className="fixed inset-0 bg-[#0B0F1A]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-in fade-in duration-500">
                    <div className="bg-card-dark rounded-[3rem] p-1 shadow-[0_50px_100px_rgba(0,0,0,0.2)] w-full max-w-2xl relative border border-border-dark max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent z-30"></div>
                        <button
                            type="button"
                            onClick={() => setInvoiceTripId(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-bg-dark flex items-center justify-center text-text-muted hover:text-text-light transition-colors z-30 font-black shadow-sm"
                        >✕</button>
                        <div className="p-6 md:p-10 lg:p-14">
                            <Invoice
                                tripId={invoiceTripId}
                                currentUserRole={role}
                                onPaymentComplete={() => {
                                    dispatch(getAllTrips());
                                    setInvoiceTripId(null);
                                }}
                            />
                        </div>
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
        </div>
    );
}



