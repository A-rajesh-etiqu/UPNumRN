import React, {
    useEffect,
    PropsWithChildren,
} from "react";

import { router } from "../navigation/RootNavigation";
import { Platform } from "react-native";

import { secureStorage } from "../services/secureStorage";
import { useAuthStore } from "../store/auth.store";

import {
    isTokenExpired,
} from "../utils/jwt";
import { useDashboardStore } from "../store/dashboard.store";

export default function AuthProvider({
    children,
}: PropsWithChildren) {
    const {
        restoreSession,
        logout,
    } = useAuthStore();

    useEffect(() => {
        restoreAuth();
    }, []);

    const restoreAuth = async () => {
        try {
            const accessToken =
                await secureStorage.getAccessToken();

            const refreshToken =
                await secureStorage.getRefreshToken();

            const user =
                await secureStorage.getUser();

            if (
                !accessToken ||
                !refreshToken ||
                !user
            ) {
                console.log("Auth restore failed: Missing tokens or user");
                router.replace("/auth");
                return;
            }

            if (isTokenExpired(accessToken)) {
                console.log("Auth restore failed: Token expired");
                await secureStorage.clearSession();
                logout();
                router.replace("/auth");
                return;
            }

            restoreSession(
                user,
                accessToken,
                refreshToken
            );

            // Pre-fetch dashboard data so the splash screen stays until data is ready
            try {
                if (user.role !== "ADMIN") {
                    await useDashboardStore.getState().loadDashboard(user.id, "30D");
                }
            } catch (err) {
                console.warn("Failed to pre-fetch dashboard data:", err);
            }

            // Preserve search params if any
            let searchStr = "";
            const gWindow = (globalThis as any).window;
            if (Platform.OS === 'web' && typeof gWindow !== 'undefined' && gWindow.location?.search) {
                searchStr = gWindow.location.search;
            }

            if (user.role === "ADMIN") {
                router.replace(`/admin${searchStr}`);
            } else {
                router.replace(`/tabs/dashboard${searchStr}`);
            }
        } catch (err) {
            console.error("Auth restore error:", err);
            await secureStorage.clearSession();

            logout();

            router.replace("/auth");
        }
    };

    return <>{children}</>;
}