import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { backendApi } from "../api";
import type { TicketData } from "../Model/TicketData";

interface TicketState {
    tickets: TicketData[];
    userTickets: TicketData[];
    loading: boolean;
    error: string | null;
}

const initialState: TicketState = {
    tickets: [],
    userTickets: [],
    loading: false,
    error: null
};

export const fetchAllTickets = createAsyncThunk(
    'tickets/fetchAll',
    async () => {
        const response = await backendApi.get('api/v1/tickets');
        return response.data;
    }
);

export const fetchUserTickets = createAsyncThunk(
    'tickets/fetchUser',
    async () => {
        const response = await backendApi.get('api/v1/tickets/user');
        return response.data;
    }
);

export const createTicket = createAsyncThunk(
    'tickets/create',
    async (ticketData: TicketData) => {
        const response = await backendApi.post('api/v1/tickets', ticketData);
        return response.data;
    }
);

export const resolveTicket = createAsyncThunk(
    'tickets/resolve',
    async ({ id, adminResponse, status }: { id: string; adminResponse: string; status?: string }) => {
        const response = await backendApi.put(`api/v1/tickets/${id}/resolve`, { adminResponse, status });
        return response.data.ticket;
    }
);

const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAllTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.tickets = action.payload;
            })
            .addCase(fetchAllTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch tickets';
            })
            // Fetch User Tickets
            .addCase(fetchUserTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.userTickets = action.payload;
            })
            .addCase(fetchUserTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch user tickets';
            })
            // Create Ticket
            .addCase(createTicket.fulfilled, (state, action) => {
                state.userTickets.unshift(action.payload.ticket);
            })
            // Resolve Ticket
            .addCase(resolveTicket.fulfilled, (state, action) => {
                const index = state.tickets.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.tickets[index] = action.payload;
                }
            });
    }
});

export default ticketSlice.reducer;
