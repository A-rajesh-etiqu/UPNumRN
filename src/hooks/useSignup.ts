import { useState } from "react";
import { router } from "../navigation/RootNavigation";

import { authApi } from "../api/authApi";

export function useSignup() {

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const onSignup = async (data: any) => {

        try {

            setLoading(true);

            setError("");

            const response =
                await authApi.signup({

                    firstName: data.firstName,

                    lastName: data.lastName,

                    email: data.email,

                    mobile: data.mobile,

                    password: data.password,

                    referralCode: data.referralCode,

                });

            router.push({

                pathname: "/auth/otp",

                params: {

                    userId: response.userId,

                },

            });

        } catch (e: any) {

            setError(

                e?.response?.data?.message ??

                "Unable to create account"

            );

        } finally {

            setLoading(false);

        }

    };

    return {

        loading,

        error,

        onSignup,

    };

}