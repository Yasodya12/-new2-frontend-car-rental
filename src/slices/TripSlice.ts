import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PopulatedTripDTO } from "../Model/trip.data.ts";
import { backendApi } from "../api.ts";

interface TripState {
    list: PopulatedTripDTO[];
    loading: boolean;
    error: string | null;
}

const initialState: TripState = {
    list: [],
    loading: false,
    error: null
};

export const getAllTrips = createAsyncThunk(
    "trip/getAllTrips",
    async (_, { rejectWithValue }) => {
        try {
            const response = await backendApi.get("/api/v1/trips/all");
            return response.data as PopulatedTripDTO[];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch trips");
        }
    }
);

export const rejectTrip = createAsyncThunk(
    "trip/rejectTrip",
    async ({ tripId, reason }: { tripId: string; reason?: string }, { rejectWithValue }) => {
        try {
            const response = await backendApi.put(`/api/v1/trips/${tripId}/reject`, { reason });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to reject trip");
        }
    }
);

export const reassignTrip = createAsyncThunk(
    "trip/reassignTrip",
    async ({ tripId, newDriverId }: { tripId: string; newDriverId: string }, { rejectWithValue }) => {
        try {
            const response = await backendApi.put(`/api/v1/trips/${tripId}/reassign`, { newDriverId });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to reassign trip");
        }
    }
);

const tripSlice = createSlice({
    name: "trip",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllTrips.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllTrips.fulfilled, (state, action: PayloadAction<PopulatedTripDTO[]>) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(getAllTrips.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            });
    }
});

export default tripSlice.reducer;
