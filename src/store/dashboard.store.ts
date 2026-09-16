import { create } from "zustand";

import {
    DashboardData,
} from "../types/dashboard";

import {
    dashboardService,
} from "../services/dashboard.service";

interface DashboardStore {

    data?: DashboardData;

    loading: boolean;

    loadDashboard: (userId?: string, period?: string) => Promise<void>;

}

export const useDashboardStore =
    create<DashboardStore>((set) => ({

        data: undefined,

        loading: false,

        loadDashboard: async (userId, period) => {
            if (!userId) return; // Wait for user to be available
            set({ loading: true });
            try {
                const data = await dashboardService.getDashboard(userId, period);
                set({ data, loading: false });
            } catch (error) {
                console.error("Failed to load dashboard:", error);
                set({ loading: false });
            }
        },

    }));