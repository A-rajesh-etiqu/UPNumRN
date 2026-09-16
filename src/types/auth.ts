/**
 * ============================================================
 * UpNum Authentication Types
 * ============================================================
 */

export type UserRole = "USER" | "ADMIN";

export type BillingCycle = "MONTHLY";

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: "INR";
    billingCycle: BillingCycle;
    isLifetimeOffer: boolean;
    expiresAt?: string | null;
    status?: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;

    email: string;
    mobile: string;

    businessName?: string | null;
    category?: string | null;
    city?: string | null;

    profileImage?: string | null;

    role: UserRole;

    userType: "PERSONAL" | "BUSINESS";

    isVerified: boolean;
    isUpiVerified: boolean;

    subscription: SubscriptionPlan;

    createdAt: string;
    updatedAt: string;
}

/* ===========================================
   Login
=========================================== */

export interface LoginRequest {
    mobile: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";
    user: User;
}

/* ===========================================
   Signup
=========================================== */

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    password: string;
    userType: "PERSONAL" | "BUSINESS";
    businessName?: string;
    referralCode?: string;
}

export interface SignupResponse {
    message: string;
    userId: string;
    otpRequired: boolean;
}

/* ===========================================
   OTP
=========================================== */

export interface VerifyOtpRequest {
    userId: string;
    otp: string;
}

export interface VerifyOtpResponse {
    verified: boolean;
    message: string;

    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";

    user: User;
}

/* ===========================================
   Forgot Password
=========================================== */

export interface ForgotPasswordRequest {
    mobile: string;
}

export interface ForgotPasswordResponse {
    message: string;
    otp?: string;
    email?: string;
}

/* ===========================================
   Reset Password
=========================================== */

export interface ResetPasswordRequest {
    mobile: string;
    otp: string;
    newPassword: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
}

/* ===========================================
   Refresh Token
=========================================== */

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

/* ===========================================
   Update Profile
=========================================== */

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
}

/* ===========================================
   Change Password
=========================================== */

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/* ===========================================
   Generic API Error
=========================================== */

export interface ApiErrorResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
}