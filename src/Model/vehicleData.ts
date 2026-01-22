export interface VehicleData {
    _id?: string;
    brand: string;
    name: string;
    model: string;
    year: string;
    color: string;
    seats: number;
    description: string;
    image: string;
    category?: 'Economy' | 'Standard' | 'Luxury' | 'Premium';
    pricePerKm?: number;
    maintenance?: {
        startDate: string | Date;
        endDate: string | Date;
        reason?: string;
    }[];
    location?: {
        lat?: number
        lng?: number
        address?: string
    }
}