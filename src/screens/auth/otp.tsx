import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "../../navigation/RootNavigation";

import AuthLayout from "../../components/auth/AuthLayout";
import OTPVerificationForm from "../../components/auth/OTPVerificationForm";

export default function OTPScreen() {
    const { userId } = useLocalSearchParams<{
        userId: string;
    }>();

    return (
        <SafeAreaView style={styles.container}>
            <AuthLayout>
                <OTPVerificationForm userId={userId ?? ""} />
            </AuthLayout>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
});