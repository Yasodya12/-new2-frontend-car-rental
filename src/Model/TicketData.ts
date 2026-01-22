import type { UserData } from "./userData";

export interface TicketData {
    _id?: string;
    userId: string | UserData;
    tripId?: string | any;
    subject: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Resolved';
    priority: 'Low' | 'Medium' | 'High';
    adminResponse?: string;
    createdAt?: string;
    updatedAt?: string;
}
