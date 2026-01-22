import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendApi } from "../api";
import type { DriverDocumentData } from "../Model/DriverDocumentData";

interface DocumentState {
    driverDocuments: DriverDocumentData[];
    pendingDocuments: DriverDocumentData[];
    loading: boolean;
    error: string | null;
}

const initialState: DocumentState = {
    driverDocuments: [],
    pendingDocuments: [],
    loading: false,
    error: null,
};

export const fetchDriverDocuments = createAsyncThunk(
    "documents/fetchByDriver",
    async (driverId: string) => {
        const response = await backendApi.get(`/api/v1/documents/driver/${driverId}`);
        return response.data;
    }
);

export const fetchPendingDocuments = createAsyncThunk(
    "documents/fetchPending",
    async () => {
        const response = await backendApi.get("/api/v1/documents/pending");
        return response.data;
    }
);

export const uploadDocument = createAsyncThunk(
    "documents/upload",
    async (docData: Partial<DriverDocumentData>) => {
        const response = await backendApi.post("/api/v1/documents", docData);
        return response.data.document;
    }
);

export const verifyDocument = createAsyncThunk(
    "documents/verify",
    async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
        const response = await backendApi.put(`/api/v1/documents/${id}/verify`, { status, adminNotes });
        return response.data.document;
    }
);

const documentSlice = createSlice({
    name: "documents",
    initialState,
    reducers: {
        clearDriverDocuments: (state) => {
            state.driverDocuments = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Driver Documents
            .addCase(fetchDriverDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.driverDocuments = []; // Clear previous docs
            })
            .addCase(fetchDriverDocuments.fulfilled, (state, action) => {
                state.loading = false;
                state.driverDocuments = action.payload;
            })
            .addCase(fetchDriverDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch documents";
            })
            // Fetch Pending Documents
            .addCase(fetchPendingDocuments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPendingDocuments.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingDocuments = action.payload;
            })
            .addCase(fetchPendingDocuments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch pending documents";
            })
            // Upload Document
            .addCase(uploadDocument.fulfilled, (state, action) => {
                const index = state.driverDocuments.findIndex((d) => d.type === action.payload.type);
                if (index !== -1) {
                    state.driverDocuments[index] = action.payload;
                } else {
                    state.driverDocuments.push(action.payload);
                }
            })
            // Verify Document
            .addCase(verifyDocument.fulfilled, (state, action) => {
                // Update in pending list
                state.pendingDocuments = state.pendingDocuments.filter((d) => d._id !== action.payload._id);
                // Update in driver documents if it exists there
                const index = state.driverDocuments.findIndex((d) => d._id === action.payload._id);
                if (index !== -1) {
                    state.driverDocuments[index] = action.payload;
                }
            });
    },
});

export const { clearDriverDocuments } = documentSlice.actions;
export default documentSlice.reducer;
