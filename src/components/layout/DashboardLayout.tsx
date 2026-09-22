import React from "react";
import {
    ScrollView,
    StyleSheet,
    RefreshControl,
    View,
    useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const { width } = useWindowDimensions();
    const isDesktop = width >= 900;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={styles.mainContent} edges={['left', 'right']}>
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { 
                            paddingTop: isDesktop ? Spacing.lg : Spacing.sm,
                            paddingBottom: isDesktop ? 60 : 24
                        }
                    ]}
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
    },
});