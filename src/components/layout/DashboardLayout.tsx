import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    RefreshControl,
} from "react-native";

import {
    useAppTheme,
    Spacing,
} from "../../theme";

interface Props {
    children: React.ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export default function DashboardLayout({
    children,
    refreshing = false,
    onRefresh,
}: Props) {
    const { colors } = useAppTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    ) : undefined
                }
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
});