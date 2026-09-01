import { useEffect, useState } from "react";
import { router } from "../navigation/RootNavigation";

import { authApi } from "../api/authApi";
import { secureStorage } from "../services/secureStorage";
import { useAuthStore } from "../store/auth.store";
export function useOtp(userId: string) {

    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);

    const [seconds, setSeconds] = useState(30);

    const [error, setError] = useState("");

    useEffect(() => {

        if (seconds <= 0) return;

        const timer = setInterval(() => {

            setSeconds((s) => s - 1);

        }, 1000);

        return () => clearInterval(timer);

    }, [seconds]);

    async function verifyOtp() {

        try {

            setLoading(true);

            setError("");

            const response = await authApi.verifyOtp({
                userId,
                otp,
            });

            // Save tokens
            await secureStorage.saveSession(
                response.accessToken,
                response.refreshToken,
                response.user
            );

            // Update Zustand
            useAuthStore.getState().login(
                response.user,
                response.accessToken,
                response.refreshToken
            );

            // Let AuthProvider handle the redirect to dashboard when user state changes
            router.replace("/tabs/dashboard");

        } catch (e: any) {

            setError(

                e?.response?.data?.message ||

                "Invalid OTP"

            );

        } finally {

            setLoading(false);

        }

    }

    async function resendOtp() {

        try {

            await authApi.resendOtp(userId);

            setSeconds(30);

        } catch {

        }

    }

    return {

        otp,

        setOtp,

        verifyOtp,

        resendOtp,

        loading,

        seconds,

        error,

    };

}