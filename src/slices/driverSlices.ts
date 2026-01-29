import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendApi } from "../api.ts";
import type { UserData } from "../Model/userData.ts";



interface driverState {
    list: UserData[],
    nearbyList: UserData[],
    loading: boolean,
    error: string | null | undefined,
    driverStats?: any, // Added to fix type error in Trip.tsx
}

const initialState: driverState = {
    list: [],
    nearbyList: [],
    loading: false,
    error: null,
};

export const getAllDrivers = createAsyncThunk(
    'driver/getAllDrivers',
    async (params?: { filter?: string, search?: string }) => {
        const isAdmin = localStorage.getItem('role') === 'admin';
        let query = `api/v1/users/find-by-role/driver?`;

        if (isAdmin) query += 'includeUnapproved=true';

        if (params?.filter && params.filter !== 'all') query += `&filter=${params.filter}`;
        if (params?.search) query += `&search=${encodeURIComponent(params.search)}`;

        const response = await backendApi.get(query);
        return await response.data;
    }
);

export const getDriversNearby = createAsyncThunk(
    'driver/getDriversNearby',
    async ({ lat, lng, radius = 5, date, endDate, endLat, endLng, startDistrict, endDistrict }: { lat: number; lng: number; radius?: number; date?: string; endDate?: string, endLat?: number, endLng?: number, startDistrict?: string, endDistrict?: string }) => {
        let query = `api/v1/users/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
        if (date) query += `&date=${date}`;
        if (endDate) query += `&endDate=${endDate}`;
        if (endLat !== undefined && endLng !== undefined) {
            query += `&endLat=${endLat}&endLng=${endLng}`;
        }
        if (startDistrict) query += `&startDistrict=${encodeURIComponent(startDistrict)}`;
        if (endDistrict) query += `&endDistrict=${encodeURIComponent(endDistrict)}`;
        const response = await backendApi.get(query);
        return await response.data;
    }
);

export const approveDriver = createAsyncThunk(
    'driver/approveDriver',
    async (driverId: string) => {
        const response = await backendApi.patch(`api/v1/users/approve-driver/${driverId}`);
        return await response.data;
    }
);

const driverSlice = createSlice({
    name: 'driver',
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllDrivers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllDrivers.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(getAllDrivers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Unknown error';
                alert("Error while loading drivers data" + state.error);
            })
            .addCase(getDriversNearby.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getDriversNearby.fulfilled, (state, action) => {
                state.loading = false;
                state.nearbyList = action.payload;
            })
            .addCase(getDriversNearby.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Unknown error';
                state.nearbyList = [];
            })
            .addCase(approveDriver.fulfilled, (state, action) => {
                // Update the driver in the list
                const index = state.list.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            })
            .addCase(approveDriver.rejected, (state, action) => {
                state.error = action.error.message ?? 'Unknown error';
                alert("Error while approving driver: " + state.error);
            });
    },
});

export default driverSlice.reducer;


