import { create } from "zustand";
import { transactionsService, Transaction } from "../services/transactions.service";

interface TransactionStore {
    transactions: Transaction[];
    loading: boolean;
    loadTransactions: (userId?: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
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
}));
