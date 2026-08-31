import { useState } from "react";
import { router } from "../navigation/RootNavigation";

import {
    UpdateProfileRequest,
    UserProfile,
} from "../types/profile";

import { profileApi } from "../api/profileApi";

export function useProfile() {

    const [loading, setLoading] =
        useState(false);

    const [profile, setProfile] =
        useState<UserProfile | null>(null);

    const [error, setError] =
        useState("");

    /**
     * Load Profile
     */
    async function loadProfile() {

        try {

            setLoading(true);

            const response =
                await profileApi.getProfile();

            setProfile(response.profile);

        } catch (e: any) {

            setError(
                e?.response?.data?.message ??
                "Unable to load profile"
            );

        } finally {

            setLoading(false);

        }

    }

    /**
     * Update Profile
     */
    async function saveProfile(
        request: UpdateProfileRequest
    ) {

        try {

            setLoading(true);

            setError("");

            const response =
                await profileApi.updateProfile(
                    request
                );

            setProfile(
                response.profile
            );

            router.replace("/tabs/dashboard");

        } catch (e: any) {

            setError(
                e?.response?.data?.message ??
                "Unable to update profile"
            );

        } finally {

            setLoading(false);

        }

    }

    /**
     * Upload Profile Image
     */
    async function uploadImage(
        formData: FormData
    ) {

        try {

            const response =
                await profileApi.uploadProfileImage(
                    formData
                );

            if (!profile) return;

            setProfile({

                ...profile,

                profileImage:
                    response.imageUrl,

            });

        } catch (e: any) {

            setError(
                e?.response?.data?.message ??
                "Unable to upload image"
            );

        }

    }

    return {

        loading,

        profile,

        error,

        loadProfile,

        saveProfile,

        uploadImage,

    };

}