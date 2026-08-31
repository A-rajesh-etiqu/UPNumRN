import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Slot, router } from "../../navigation/RootNavigation";
import { useAuthStore } from "../../store/auth.store";

export default function AdminLayout() {
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Enforce role access: redirect non-admin back to login
        if (!isAuthenticated || user?.role !== "ADMIN") {
            router.replace("/auth/login");
        }
    }, [isAuthenticated, user]);

    if (!isAuthenticated || user?.role !== "ADMIN") {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FC" }}>
                <ActivityIndicator size="large" color="#6C2CF4" />
            </View>
        );
    }

    return <Slot />;
}
