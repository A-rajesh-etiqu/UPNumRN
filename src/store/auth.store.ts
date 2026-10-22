import { create } from "zustand";
import { User } from "../types/auth";
import { secureStorage } from "../services/secureStorage";

import { useSubscriptionStore } from "./subscription.store";

const syncSubscriptionStore = (user: User) => {
    if (user?.subscription) {
        const sub = user.subscription as any;
        const isExpired = sub.status === "EXPIRED";
        const trialEnd = sub.trialEnd || sub.expiresAt;
        const hasExpiredTrial = trialEnd && new Date(trialEnd) <= new Date();
        useSubscriptionStore.getState().setSubscription({
            planId: String(sub.id || "free-tier"),
            planName: sub.name || "Free Tier",
            active: !isExpired && !hasExpiredTrial,
            purchasedAt: user.createdAt || new Date().toISOString(),
            expiresAt: trialEnd || null,
        });
    }
};

interface AuthState {
    user: User | null;

    accessToken: string | null;

    refreshToken: string | null;

    isAuthenticated: boolean;

    rememberMe: boolean;

    loading: boolean;

    login: (
        user: User,
        accessToken: string,
        refreshToken: string
    ) => void;

    restoreSession: (
        user: User,
        accessToken: string,
        refreshToken: string
    ) => void;

    logout: () => void;

    setLoading: (loading: boolean) => void;

    setRememberMe: (remember: boolean) => void;

    updateUser: (user: User) => void;

    updateAccessToken: (token: string) => void;

    reset: () => void;


}

const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    rememberMe: false,
    loading: false,
};

export const useAuthStore = create<AuthState>((set) => ({
    ...initialState,

    login: (user, accessToken, refreshToken) => {
        syncSubscriptionStore(user);
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
        });
    },

    restoreSession: (user, accessToken, refreshToken) => {
        syncSubscriptionStore(user);
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            loading: false,
        });
    },

    logout: () => {
        secureStorage.clearSession().catch(err => console.error("Failed to clear session", err));
        set({
            ...initialState,
        });
    },

    setLoading: (loading) =>
        set({
            loading,
        }),

    setRememberMe: (rememberMe) =>
        set({
            rememberMe,
        }),

    updateUser: (user) => {
        syncSubscriptionStore(user);
        secureStorage.saveUser(user).catch(err => console.error("Failed to save user to secure storage", err));
        set({
            user,
        });
    },

    updateAccessToken: (token) =>
        set({
            accessToken: token,
        }),

    reset: () =>
        set({
            ...initialState,
        }),

}));