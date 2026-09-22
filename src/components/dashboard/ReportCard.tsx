import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "../../theme";

export const ReportCard = ({ title, value, icon, color, change, isUp, isDesktop, colors, changeText = "vs. month" }: any) => {
    return (
        <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: isDesktop ? 20 : 12 }, isDesktop ? { width: "23%", marginBottom: 0 } : { width: "48%", marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={[{ width: isDesktop ? 48 : 36, height: isDesktop ? 48 : 36, borderRadius: isDesktop ? 24 : 18, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: color + "15" }]}>
                    <Ionicons name={icon} size={isDesktop ? 24 : 18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.kpiLabel, { color: colors.textSecondary, ...Typography.bodyMedium, fontSize: isDesktop ? 13 : 11, marginBottom: 2 }]} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
                    <Text style={[styles.kpiValue, { color: colors.text, fontSize: isDesktop ? 24 : 16, marginBottom: 0 }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={isUp ? "caret-up" : "caret-down"} size={12} color={isUp ? "#10B981" : "#EF4444"} />
                <Text style={[styles.kpiTrendUp, { color: isUp ? "#10B981" : "#EF4444", marginLeft: 4, fontSize: 11, fontWeight: '700' }]} numberOfLines={1} adjustsFontSizeToFit>
                    {change} <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '500' }}>{changeText}</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    kpiCard: {
        borderRadius: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
            android: { elevation: 1 },
            web: { boxShadow: "0 2px 10px rgba(0,0,0,0.02)" } as any,
        })
    },
    kpiLabel: {
        fontWeight: "600",
    },
    kpiValue: {
        fontWeight: "800",
    },
    kpiTrendUp: {
        fontWeight: "700",
    },
});
