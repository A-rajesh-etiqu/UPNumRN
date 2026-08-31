import { useState } from "react";
import { router } from "../navigation/RootNavigation";

import { profileSchema } from "../validations/profile.schema";
import { profileService } from "../services/profile.service";

export function useCompleteProfile() {

    const [loading, setLoading] =
        useState(false);

    async function submit(data: any) {

        const result =
            profileSchema.safeParse(data);

        if (!result.success) {

            throw new Error(
                result.error.issues[0].message
            );

        }

        setLoading(true);

        try {

            await profileService.completeProfile(
                data
            );

            router.replace("/subscription");

        } finally {

            setLoading(false);

        }

    }

    return {

        loading,

        submit,

    };

}