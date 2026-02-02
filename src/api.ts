import axios from "axios";

export const backendApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
});

// add a request interceptor
backendApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            config.headers['authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// add a response interceptor
backendApi.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear all auth related data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('role');
            localStorage.removeItem('profileComplete');

            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);