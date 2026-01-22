import type { VehicleData } from "../Model/vehicleData.ts";
import { backendApi } from "../api.ts";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface vehicleState {
    list: VehicleData[]
    nearbyList: VehicleData[]
    loading: boolean
    error: string | null | undefined
}

const initialState: vehicleState = {
    list: [],
    nearbyList: [],
    loading: false,
    error: null,
};

export const getAllVehicles = createAsyncThunk(
    'vehicle/getAllVehicles',
    async () => {
        const response = await backendApi.get('api/v1/vehicles/all');
        return await response.data;
    }
);

export const getVehiclesNearby = createAsyncThunk(
    'vehicle/getVehiclesNearby',
    async ({ lat, lng, radius = 5, date, endDate }: { lat: number; lng: number; radius?: number; date?: string; endDate?: string }) => {
        let query = `api/v1/vehicles/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
        if (date) query += `&date=${date}`;
        if (endDate) query += `&endDate=${endDate}`;
        const response = await backendApi.get(query);
        return await response.data;
    }
);

const vehicleSlice = createSlice({
    name: 'vehicle',
    initialState: initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllVehicles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getAllVehicles.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })

            .addCase(getAllVehicles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Unknown error';
                alert("Error while loading vehicles data" + state.error);
            })
            .addCase(getVehiclesNearby.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getVehiclesNearby.fulfilled, (state, action) => {
                state.loading = false;
                state.nearbyList = action.payload;
            })
            .addCase(getVehiclesNearby.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Unknown error';
                state.nearbyList = [];
            });
    },
});

export default vehicleSlice.reducer;