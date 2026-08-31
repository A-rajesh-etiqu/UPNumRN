import apiClient from "./apiClient";

import {
    GetProfileResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UploadProfileImageResponse,
} from "../types/profile";

class ProfileApi {

    /**
     * Get logged-in user profile
     */
    async getProfile() {
        const response =
            await apiClient.get<GetProfileResponse>(
                "/profile"
            );

        return response.data;
    }

    /**
     * Update profile
     */
    async updateProfile(
        request: UpdateProfileRequest
    ) {
        const response =
            await apiClient.put<UpdateProfileResponse>(
                "/profile",
                request
            );

        return response.data;
    }

    /**
     * Upload profile image
     */
    async uploadProfileImage(
        file: FormData
    ) {
        const response =
            await apiClient.post<UploadProfileImageResponse>(
                "/profile/photo",
                file,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

        return response.data;
    }
}

export const profileApi =
    new ProfileApi();