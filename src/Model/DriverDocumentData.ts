export interface DriverDocumentData {
    _id?: string;
    driverId: string | { _id: string; name: string; email: string };
    type: "License" | "Insurance" | "ID";
    documentUrl: string;
    expiryDate?: string;
    status: "Pending" | "Verified" | "Rejected";
    adminNotes?: string;
    createdAt?: string;
    updatedAt?: string;
}
