import type {UserData} from "../Model/userData.ts";
import {backendApi} from "../api.ts";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";

interface UserState {
    list: UserData[];
    selectedUser: UserData | null;
    loadingAll: boolean;
    loadingByEmail: boolean;
    errorAll: string | null;
    errorByEmail: string | null;
}


const initialState: UserState = {
    list: [],
    selectedUser: null,
    loadingAll: false,
    loadingByEmail: false,
    errorAll: null,
    errorByEmail: null
};

export const getAllUsers = createAsyncThunk(
    'user/getAllUsers',
    async () => {
        const response = await backendApi.get('api/v1/users/all');
        return await response.data;
    }
);

export const getUserByEmail = createAsyncThunk(
    'user/getUserByEmail',
    async (email: string) => {
        const response = await backendApi.get(`api/v1/users/find-by-email/${email}`);
        return await response.data;
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getAllUsers.pending, (state) => {
                state.loadingAll = true;
                state.errorAll = null;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.loadingAll = false;
                state.list = action.payload;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.loadingAll = false;
                state.errorAll = action.error.message || 'Failed to fetch users';
            })

            .addCase(getUserByEmail.pending, (state) => {
                state.loadingByEmail = true;
                state.errorByEmail = null;
            })
            .addCase(getUserByEmail.fulfilled, (state, action) => {
                state.loadingByEmail = false;
                state.selectedUser = action.payload;
            })
            .addCase(getUserByEmail.rejected, (state, action) => {
                state.loadingByEmail = false;
                state.errorByEmail = action.error.message || 'Failed to fetch user by email';
            });
    },
});


export default userSlice.reducer;