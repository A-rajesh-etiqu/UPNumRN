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

    loadDashboard: (userId?: string) => Promise<void>;

}

export const useDashboardStore =
    create<DashboardStore>((set) => ({

        data: undefined,

        loading: false,

        loadDashboard: async (userId) => {

            set({
                loading: true,
            });

            const data =
                await dashboardService.getDashboard(userId);

            set({

                data,

                loading: false,

            });

        },

    }));