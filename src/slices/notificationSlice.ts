import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { backendApi } from '../api';
import type { NotificationData } from '../Model/NotificationData';

interface NotificationState {
    notifications: NotificationData[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
};

// Fetch unread notifications
export const fetchUnreadNotifications = createAsyncThunk(
    'notifications/fetchUnread',
    async (_, { rejectWithValue }) => {
        try {
            const response = await backendApi.get('/api/v1/notifications/unread');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
        }
    }
);

// Fetch all notifications (read and unread)
export const fetchAllNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await backendApi.get('/api/v1/notifications/all?limit=20');
            return response.data.notifications;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch notifications');
        }
    }
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await backendApi.get('/api/v1/notifications/count');
            return response.data.count;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch count');
        }
    }
);

// Mark notification as read
export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId: string, { rejectWithValue }) => {
        try {
            await backendApi.put(`/api/v1/notifications/${notificationId}/read`);
            return notificationId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark as read');
        }
    }
);

// Mark all as read
export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await backendApi.put('/api/v1/notifications/read-all');
            return true;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to mark all as read');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch unread notifications
        builder.addCase(fetchUnreadNotifications.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
            state.loading = false;
            state.notifications = action.payload;
            state.unreadCount = action.payload.length;
        });
        builder.addCase(fetchUnreadNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Fetch all notifications
        builder.addCase(fetchAllNotifications.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchAllNotifications.fulfilled, (state, action) => {
            state.loading = false;
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter((n: NotificationData) => !n.isRead).length;
        });
        builder.addCase(fetchAllNotifications.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Fetch unread count
        builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
            state.unreadCount = action.payload;
        });

        // Mark as read - update the notification instead of removing it
        builder.addCase(markAsRead.fulfilled, (state, action) => {
            const notification = state.notifications.find(n => n._id === action.payload);
            if (notification) {
                notification.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        });

        // Mark all as read - update all notifications
        builder.addCase(markAllAsRead.fulfilled, (state) => {
            state.notifications.forEach(n => n.isRead = true);
            state.unreadCount = 0;
        });
    },
});

export const { clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
