import { combineReducers } from "redux";
import authReducer from "./authSlice.ts";
import dashboardReducer from "./dashboardSlice.ts";
import driverReducer from "./driverSlices.ts";
import vehicleReducer from "./vehicleSlices.ts";
import tripReducer from "./TripSlice.ts";
import userReducer from "./UserSlices.ts";
import chatReducer from "./chatSlice.ts";
import ticketReducer from "./ticketSlice.ts";
import notificationReducer from "./notificationSlice.ts";

export const rootReducer = combineReducers({
    auth: authReducer,
    dashboard: dashboardReducer,
    driver: driverReducer,
    vehicle: vehicleReducer,
    trip: tripReducer,
    user: userReducer,
    chat: chatReducer,
    tickets: ticketReducer,
    notification: notificationReducer
});

export type rootReducerState = ReturnType<typeof rootReducer>