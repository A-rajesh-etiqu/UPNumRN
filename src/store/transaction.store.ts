import { create } from "zustand";
import { transactionsService, Transaction } from "../services/transactions.service";

interface TransactionStore {
    transactions: Transaction[];
    loading: boolean;
    loadTransactions: (userId?: string) => Promise<void>;
    addTransaction: (data: { userId?: string, title: string, category: string, amount: number, type: "income" | "expense", date_time?: string }) => Promise<boolean>;
    uploadBulkTransactions: (formData: FormData, userId?: string) => Promise<boolean>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
    transactions: [],
    loading: false,

    loadTransactions: async (userId) => {
        set({ loading: true });
        try {
            const transactions = await transactionsService.getTransactions(userId);
            set({ transactions, loading: false });
        } catch (error) {
            console.error("Failed to load transactions", error);
            set({ loading: false });
        }
    },

    addTransaction: async (data) => {
        try {
            await transactionsService.addTransaction(data);
            const { loadTransactions } = get();
            await loadTransactions(data.userId);
            return true;
        } catch (error) {
            console.error("Failed to add transaction", error);
            return false;
        }
    },

    uploadBulkTransactions: async (formData, userId) => {
        try {
            await transactionsService.uploadBulkTransactions(formData);
            const { loadTransactions } = get();
            await loadTransactions(userId);
            return true;
        } catch (error) {
            console.error("Failed to bulk upload transactions", error);
            return false;
        }
    }
}));
