export interface TripData {
    _id?: string;
    driverId: string;
    vehicleId: string;
    customerId?: string;
    startLocation: string;
    endLocation: string;
    date: string;
    endDate?: string;
    distance: string;
    price: number;
    status?: string;
    notes?: string;
    tripType?: "Instant" | "Scheduled";
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    promoCode?: string;
    discountAmount?: number;
    isBroadcast?: boolean;
}

export interface PopulatedTripDTO {
    _id?: string;
    driverId: {
        _id: string;
        name: string;
        email: string;
    };
    vehicleId: {
        _id: string;
        brand: string;
        model: string;
        name: string;
    };
    customerId?: {
        _id: string;
        name: string;
        email: string;
    };
    startLocation: string;
    endLocation: string;
    date: string;
    endDate?: string | null;
    createdAt?: string;
    status?: string;
    distance?: string | null;
    price?: number | null;
    notes?: string | null;
    tripType?: "Instant" | "Scheduled";
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    currentLat?: number;
    currentLng?: number;
    currentProgress?: number;
    promoCode?: string;
    discountAmount?: number;
    isBroadcast?: boolean;
}
