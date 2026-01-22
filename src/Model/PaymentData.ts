import type { UserData } from "./userData";
import type { TripData } from "./trip.data";

export interface PaymentData {
    _id?: string;
    tripId: string | TripData;
    userId: string | UserData;
    amount: number;
    method: 'Cash' | 'Bank Transfer';
    status: 'Pending' | 'Paid';
    collectedBy?: string | UserData;
    collectedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
