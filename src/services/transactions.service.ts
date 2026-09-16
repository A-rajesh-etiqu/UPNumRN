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
    async addTransaction(data: { userId?: string, title: string, category: string, amount: number, type: "income" | "expense", date_time?: string }): Promise<{ success: boolean, id: string }> {
        const response = await apiClient.post<{ success: boolean, id: string }>("/transactions", data);
        return response.data;
    },
    async uploadBulkTransactions(formData: FormData): Promise<{ success: boolean, message: string }> {
        const response = await apiClient.post<{ success: boolean, message: string }>("/transactions/bulk", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        return response.data;
    }
};
