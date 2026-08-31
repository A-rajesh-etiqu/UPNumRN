import apiClient from "./apiClient";

import {
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    SignupRequest,
    SignupResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
} from "../types/auth";

class AuthApi {
    login(request: LoginRequest) {
        return apiClient
            .post<LoginResponse>("/auth/login", request)
            .then((r) => r.data);
    }

    refreshToken(request: RefreshTokenRequest) {
        return apiClient
            .post<RefreshTokenResponse>(
                "/auth/refresh-token",
                request
            )
            .then((r) => r.data);
    }

    logout() {
        return apiClient.post("/auth/logout");
    }


    async signup(request: SignupRequest) {
        const response = await apiClient.post<SignupResponse>(
            "/auth/signup",
            request
        );

        return response.data;
    }

    async verifyOtp(request: VerifyOtpRequest) {
        const response = await apiClient.post<VerifyOtpResponse>(
            "/auth/verify-otp",
            request
        );

        return response.data;
    }

    async resendOtp(userId: string) {
        return apiClient.post("/auth/resend-otp", {
            userId,
        });
    }
}

export const authApi = new AuthApi();