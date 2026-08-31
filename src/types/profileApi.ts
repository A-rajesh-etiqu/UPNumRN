import { UserProfile } from "./profile";

export interface CompleteProfileRequest {
    firstName: string;

    lastName: string;

    dateOfBirth?: string;

    gender: "MALE" | "FEMALE" | "OTHER";

    country: string;

    state: string;

    city: string;

    language: string;

    profileImage?: string | null;
}

export interface CompleteProfileResponse {
    success: boolean;
    message: string;
    profile: UserProfile;
}