import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { backendApi } from "../api";

interface Conversation {
    _id: string;
    participants: any[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: any;
}

interface ChatState {
    conversations: Conversation[];
    totalUnreadCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    conversations: [],
    totalUnreadCount: 0,
    loading: false,
    error: null
};

export const fetchConversations = createAsyncThunk(
    "chat/fetchConversations",
    async (_, { getState, rejectWithValue }) => {
        try {
            const response = await backendApi.get("/api/v1/chat/conversations");
            const state = getState() as any;
            const userId = state.auth.user?._id;

            let totalUnread = 0;
            if (userId && Array.isArray(response.data)) {
                response.data.forEach((conv: any) => {
                    const unreadMap = conv.unreadCount || {};
                    const count = unreadMap[userId] || 0;
                    totalUnread += count;
                });
            }

            return {
                conversations: response.data,
                totalUnread
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch conversations");
        }
    }
);

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setUnreadCount: (state, action: PayloadAction<number>) => {
            state.totalUnreadCount = action.payload;
        },
        incrementUnreadCount: (state) => {
            state.totalUnreadCount += 1;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = action.payload.conversations;
                state.totalUnreadCount = action.payload.totalUnread;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setUnreadCount, incrementUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;
