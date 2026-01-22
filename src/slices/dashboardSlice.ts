import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {backendApi} from "../api.ts";

export const getAllData = createAsyncThunk(
    'dashboard/getAllData',
    async () => {
        const response = await backendApi.get('api/v1/dashboard/status');
        return response.data;
    }
);

interface DashboardState {
    data: any;
    loading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    data: null,
    loading: false,
    error: null,
};


const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllData.pending, (state) => {
                state.loading = true;
            })
            .addCase(getAllData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getAllData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? 'Unknown error';
            });
    }
});

export default dashboardSlice.reducer;