// src/utils/axios-interceptor.ts
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void; config: AxiosRequestConfig }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else {
            prom.config.headers = prom.config.headers || {};
            prom.config.headers["Authorization"] = `Bearer ${token}`;
            prom.resolve(axiosInstance(prom.config));
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem("accessToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && originalRequest.url !== "/auth/refresh-token" && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            isRefreshing = true;
            try {
                const res = await axiosInstance.post("/auth/refresh-token");
                const newToken = res.data.accessToken;
                localStorage.setItem("accessToken", newToken);
                processQueue(null, newToken);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                localStorage.removeItem("accessToken");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
