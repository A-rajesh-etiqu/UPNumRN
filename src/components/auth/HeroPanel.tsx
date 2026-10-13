import React from "react";
import { View, Text, StyleSheet, useWindowDimensions, Platform, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path, Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import FeatureItem from "./FeatureItem";

export default function HeroPanel() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    return (
        <LinearGradient
            colors={["#1E1B4B", "#311062", "#701A75", "#EA580C"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.container}
        >
            {/* Top Branding Section */}
            <View style={styles.topSection}>
                <View style={styles.logoRow}>
                    <Image source={require('../../../assets/images/web-logo.png')} style={{ width: 130, height: 44 }} resizeMode="contain" />
                </View>

                {/* Headers */}
                <Text style={styles.heading}>
                    Smart Insights,{"\n"}Stronger Business{"\n"}Decisions
                </Text>
                <Text style={styles.subtitle}>
                    Track your sales, analyze performance and grow your business with AI Powered Insights.
                </Text>
            </View>

            {/* High-Fidelity 3D Dashboard Mockup Card */}
            <View style={styles.mockupContainer}>
                {/* 1. Main Sales Overview Card */}
                <View style={styles.salesCard}>
                    <View style={styles.salesHeader}>
                        <View>
                            <Text style={styles.salesCardLabel}>Sales Overview</Text>
                            <Text style={styles.salesCardValue}>₹ 2,45,980</Text>
                        </View>
                        <View style={styles.periodBadge}>
                            <Text style={styles.periodText}>This Month</Text>
                            <Ionicons name="chevron-down" size={10} color="#94A3B8" />
                        </View>
                    </View>

                    <View style={styles.trendRow}>
                        <Ionicons name="trending-up" size={12} color="#22C55E" />
                        <Text style={styles.trendText}>+ 18.6%</Text>
                        <Text style={styles.trendSub}>vs last period</Text>
                    </View>

                    {/* SVG Line Chart */}
                    <View style={styles.chartContainer}>
                        <Svg height="60" width="100%" viewBox="0 0 300 100">
                            <Defs>
                                <SvgGradient id="chartFill" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0%" stopColor="#D946EF" stopOpacity="0.4" />
                                    <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                                </SvgGradient>
                                <SvgGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                                    <Stop offset="0%" stopColor="#6366F1" />
                                    <Stop offset="50%" stopColor="#D946EF" />
                                    <Stop offset="100%" stopColor="#F43F5E" />
                                </SvgGradient>
                            </Defs>
                            {/* Area under curve */}
                            <Path
                                d="M0,80 Q30,50 60,60 T120,40 T180,70 T240,30 T300,10 L300,100 L0,100 Z"
                                fill="url(#chartFill)"
                            />
                            {/* The line itself */}
                            <Path
                                d="M0,80 Q30,50 60,60 T120,40 T180,70 T240,30 T300,10"
                                fill="none"
                                stroke="url(#chartLine)"
                                strokeWidth="3.5"
                            />
                            {/* Data points */}
                            <Circle cx="120" cy="40" r="5" fill="#D946EF" stroke="#FFF" strokeWidth="1.5" />
                            <Circle cx="240" cy="30" r="5" fill="#F43F5E" stroke="#FFF" strokeWidth="1.5" />
                        </Svg>
                    </View>
                </View>

                {/* 2. Donut Card overlapping */}
                <View style={styles.donutCard}>
                    <Svg height="56" width="56" viewBox="0 0 40 40">
                        {/* Outer track */}
                        <Circle cx="20" cy="20" r="16" fill="none" stroke="#312E81" strokeWidth="5" />
                        {/* Orange segment */}
                        <Circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#F97316"
                            strokeWidth="5"
                            strokeDasharray="100"
                            strokeDashoffset="40"
                            strokeLinecap="round"
                            transform="rotate(-90 20 20)"
                        />
                        {/* Purple segment */}
                        <Circle
                            cx="20"
                            cy="20"
                            r="16"
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="5"
                            strokeDasharray="100"
                            strokeDashoffset="75"
                            strokeLinecap="round"
                            transform="rotate(30 20 20)"
                        />
                    </Svg>
                </View>

                {/* 3. Small Purple Card */}
                <View style={styles.smallCard}>
                    <Ionicons name="card" size={18} color="#A78BFA" />
                    <Text style={styles.smallCardText}>₹</Text>
                </View>
            </View>

            {/* Feature List */}
            <View style={styles.features}>
                <FeatureItem
                    icon="sparkles-outline"
                    title="AI Powered Insights"
                    description="Get smart suggestions and insights to boost your sales."
                />
                <FeatureItem
                    icon="bar-chart-outline"
                    title="Real-time Analytics"
                    description="Monitor your business performance in real-time."
                />
                <FeatureItem
                    icon="shield-checkmark-outline"
                    title="Secure & Reliable"
                    description="Your data is encrypted and always protected."
                />
            </View>

            {/* City Skyline Silhouette SVG background overlay at bottom */}
            <View style={styles.skyline}>
                <Svg height="60" width="100%" viewBox="0 0 500 80" preserveAspectRatio="none">
                    <Path
                        d="M0,80 L0,50 L20,50 L20,65 L35,65 L35,40 L50,40 L50,55 L70,55 L70,30 L85,30 L85,60 L110,60 L110,45 L130,45 L130,35 L145,35 L145,55 L160,55 L160,25 L180,25 L180,60 L210,60 L210,50 L230,50 L230,30 L250,30 L250,40 L270,40 L270,55 L290,55 L290,20 L315,20 L315,45 L335,45 L335,35 L360,35 L360,55 L380,55 L380,30 L405,30 L405,60 L430,60 L430,40 L455,40 L455,50 L470,50 L470,35 L500,35 L500,80 Z"
                        fill="#F97316"
                        opacity="0.12"
                    />
                    <Path
                        d="M0,80 L0,60 L15,60 L15,70 L30,70 L30,55 L45,55 L45,65 L60,65 L60,45 L80,45 L80,65 L105,65 L105,50 L125,50 L125,40 L140,40 L140,65 L155,65 L155,35 L175,35 L175,65 L200,65 L200,55 L220,55 L220,40 L240,40 L240,50 L260,50 L260,60 L280,60 L280,35 L300,35 L300,55 L320,55 L320,45 L345,45 L345,60 L370,60 L370,40 L390,40 L390,65 L415,65 L415,50 L440,50 L440,60 L465,60 L465,45 L485,45 L500,45 L500,80 Z"
                        fill="#EA580C"
                        opacity="0.2"
                    />
                </Svg>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 36,
        paddingTop: 24,
        paddingBottom: 16,
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
    },
    topSection: {
        zIndex: 2,
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    heading: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
        lineHeight: 32,
        marginTop: 4,
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.75)",
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
        marginBottom: 8,
    },
    mockupContainer: {
        height: 145,
        width: "100%",
        position: "relative",
        marginVertical: 4,
        zIndex: 2,
    },
    salesCard: {
        backgroundColor: "rgba(30, 27, 75, 0.6)",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
            } as any,
        }),
        width: "78%",
        height: "100%",
        zIndex: 1,
    },
    salesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    salesCardLabel: {
        color: "#94A3B8",
        fontSize: 10,
        fontWeight: "600",
    },
    salesCardValue: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "700",
        marginTop: 1,
    },
    periodBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    periodText: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "600",
        marginRight: 3,
    },
    trendRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
    },
    trendText: {
        color: "#22C55E",
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 4,
    },
    trendSub: {
        color: "#64748B",
        fontSize: 9,
        marginLeft: 4,
    },
    chartContainer: {
        marginTop: 4,
        height: 60,
        overflow: "hidden",
    },
    donutCard: {
        position: "absolute",
        right: 8,
        bottom: 4,
        backgroundColor: "rgba(23, 14, 53, 0.85)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: 8,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
            } as any,
        }),
        zIndex: 2,
    },
    smallCard: {
        position: "absolute",
        right: 28,
        top: 4,
        backgroundColor: "rgba(49, 46, 129, 0.8)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 10,
        padding: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            } as any,
        }),
        zIndex: 2,
    },
    smallCardText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12,
    },
    features: {
        marginTop: 6,
        zIndex: 3,
    },
    skyline: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 0,
    },
});
