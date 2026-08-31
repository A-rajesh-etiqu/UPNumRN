import apiClient from "../api/apiClient";
import { DashboardData } from "../types/dashboard";
import { dashboardMock } from "../mocks/dashboard.mock";

export const dashboardService = {
    async getDashboard(userId?: string): Promise<DashboardData> {
        const response = await apiClient.get<DashboardData>("/dashboard/summary", {
            params: { userId },
        });
        return response.data;
    },
};