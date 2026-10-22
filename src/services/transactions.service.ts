import { Platform } from "react-native";
import apiClient from "../api/apiClient";
import { RecentTransaction } from "../types/dashboard";

export interface Transaction extends RecentTransaction {
    time?: string;
    status?: string;
    upi?: string;
    date_time?: string;
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
        const headers: Record<string, any> = Platform.OS === "web" ? { "Content-Type": undefined } : { "Content-Type": "multipart/form-data" };
        const response = await apiClient.post<{ success: boolean, message: string }>("/transactions/bulk", formData, {
            headers,
        });
        return response.data;
    },
    async parseStatementFile(payload: FormData | { base64File: string; filename: string; password?: string; userId?: string }): Promise<{
        success: boolean;
        filename?: string;
        bankDetected?: string;
        totalFound?: number;
        transactions?: any[];
        isPasswordProtected?: boolean;
        error?: string;
    }> {
        if (payload instanceof FormData) {
            const response = await apiClient.post("/transactions/parse-statement", payload);
            return response.data;
        } else {
            const response = await apiClient.post("/transactions/parse-statement", payload);
            return response.data;
        }
    },
    async saveImportedTransactions(userId: string, transactions: any[]): Promise<{ success: boolean, count: number, message: string }> {
        const response = await apiClient.post("/transactions/save-imported", { userId, transactions });
        return response.data;
    }
};
