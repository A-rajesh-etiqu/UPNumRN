export interface VerifyOtpRequest {
    userId: string;
    otp: string;
}

export interface ResendOtpRequest {
    userId: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
}