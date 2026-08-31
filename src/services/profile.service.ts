import {
    CompleteProfileRequest,
    CompleteProfileResponse,
} from "../types/profileApi";

export const profileService = {
    async completeProfile(
        request: CompleteProfileRequest
    ): Promise<CompleteProfileResponse> {
        // Simulate API delay
        await new Promise((resolve) =>
            setTimeout(resolve, 1500)
        );

        const now = new Date().toISOString();

        return {
            success: true,

            message: "Profile updated successfully.",

            profile: {
                id: "1",

                firstName: request.firstName,

                lastName: request.lastName,

                fullName: `${request.firstName} ${request.lastName}`,

                // Mock values for demo
                email: "demo@upnum.com",

                mobile: "9876543210",

                profileImage:
                    request.profileImage ?? null,

                dateOfBirth:
                    request.dateOfBirth || null,

                gender: request.gender,

                country: request.country,

                state: request.state,

                city: request.city,

                language: request.language,

                currency: "INR",

                timezone: "Asia/Kolkata",

                profileCompleted: true,

                createdAt: now,

                updatedAt: now,
            },
        };
    },
};