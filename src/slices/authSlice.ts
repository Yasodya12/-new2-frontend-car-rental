import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        role: null,
        token: null,
    },
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.role = action.payload.role;
            state.token = action.payload.token;
        },
        logout: (state) => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('role');
            localStorage.removeItem('userName');

            state.user = null;
            state.role = null;
            state.token = null;
        },
    },
});

export const { logout , setCredentials } = authSlice.actions;
export default authSlice.reducer;
