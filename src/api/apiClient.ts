import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

import { ENV } from "../config/env";
import { secureStorage } from "../services/secureStorage";
import { useAuthStore } from "../store/auth.store";

const apiClient = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: ENV.REQUEST_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    async (
        config: InternalAxiosRequestConfig
    ) => {
        const token =
            await secureStorage.getAccessToken();

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);

apiClient.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken =
                    await secureStorage.getRefreshToken();

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Direct call to avoid circular require cycle with authApi
                const refreshRes = await axios.post(
                    `${ENV.API_BASE_URL}/auth/refresh-token`,
                    { refreshToken }
                );

                const newAccessToken = refreshRes.data.accessToken;

                await secureStorage.updateAccessToken(newAccessToken);

                useAuthStore
                    .getState()
                    .updateAccessToken(newAccessToken);

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return apiClient(originalRequest);
            } catch {
                await secureStorage.clearSession();

                useAuthStore.getState().logout();

                throw error;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;