import apiClient from "../api/apiClient";
import { RecentTransaction } from "../types/dashboard";

export interface Transaction extends RecentTransaction {
    time?: string;
    status?: string;
    upi?: string;
}

export const transactionsService = {
    async getTransactions(userId?: string): Promise<Transaction[]> {
        const response = await apiClient.get<Transaction[]>("/transactions", {
            params: { userId },
        });
        return response.data;
    },
};
