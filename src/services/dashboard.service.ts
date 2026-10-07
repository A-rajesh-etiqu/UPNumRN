import apiClient from "../api/apiClient";
import { DashboardData } from "../types/dashboard";
import { dashboardMock } from "../mocks/dashboard.mock";

export const dashboardService = {
    async getDashboard(userId?: string, period?: string, startDate?: string, endDate?: string): Promise<DashboardData> {
        const response = await apiClient.get<DashboardData>("/dashboard/summary", {
            params: { userId, period, startDate, endDate },
        });
        return response.data;
    },
};