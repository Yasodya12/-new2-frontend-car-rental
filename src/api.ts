import axios from "axios";

export const backendApi = axios.create({
    baseURL: "http://localhost:3000"
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
)