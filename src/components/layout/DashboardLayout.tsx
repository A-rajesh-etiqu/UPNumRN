import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    RefreshControl,
    View,
    useWindowDimensions
} from "react-native";

import {
    useAppTheme,
    Spacing,
} from "../../theme";
import Sidebar from "./Sidebar";

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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.mainContent}>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
});