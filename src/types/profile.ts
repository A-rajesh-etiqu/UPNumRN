/**
 * ============================================================
 * UpNum Profile Types
 * ============================================================
 */

export type Gender =
    | "MALE"
    | "FEMALE"
    | "OTHER";

export interface UserProfile {

    id: string;

    firstName: string;

    lastName: string;

    fullName: string;

    email: string;

    mobile: string;

    profileImage?: string | null;

    dateOfBirth?: string | null;

    gender?: Gender | null;

    state?: string | null;

    city?: string | null;

    country: string;

    language: string;

    currency: string;

    timezone: string;

    profileCompleted: boolean;

    createdAt: string;

    updatedAt: string;

}

/* ===========================================
   Get Profile
=========================================== */

export interface GetProfileResponse {

    profile: UserProfile;

}

/* ===========================================
   Complete Profile
=========================================== */

export interface CompleteProfileRequest {

    firstName: string;

    lastName: string;

    dateOfBirth: string;

    gender: Gender;

    state: string;

    city: string;

    country: string;

    language: string;

    profileImage?: string;

}

export interface CompleteProfileResponse {

    success: boolean;

    message: string;

    profile: UserProfile;

}

/* ===========================================
   Update Profile
=========================================== */

export interface UpdateProfileRequest {

    firstName: string;

    lastName: string;

    dateOfBirth?: string;

    gender?: Gender;

    state?: string;

    city?: string;

    country?: string;

    language: string;

}

export interface UpdateProfileResponse {

    success: boolean;

    message: string;

    profile: UserProfile;

}

/* ===========================================
   Upload Profile Image
=========================================== */

export interface UploadProfileImageResponse {

    success: boolean;

    imageUrl: string;

}

/* ===========================================
   Delete Profile Image
=========================================== */

export interface DeleteProfileImageResponse {

    success: boolean;

    message: string;

}