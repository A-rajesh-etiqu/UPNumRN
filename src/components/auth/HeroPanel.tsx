import React from "react";
import { View, Text, StyleSheet, useWindowDimensions, Platform, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
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
            <View style={styles.logoRow}>
                {/* 3D Arrowhead Brand Logo Wrap */}
                <View style={styles.logoCircle}>
                    <Svg width="26" height="26" viewBox="0 0 32 32">
                        <Defs>
                            <SvgGradient id="orangeGradHero" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#FB923C" />
                                <Stop offset="100%" stopColor="#EA580C" />
                            </SvgGradient>
                            <SvgGradient id="purpleGradHero" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#C084FC" />
                                <Stop offset="100%" stopColor="#6B21A8" />
                            </SvgGradient>
                        </Defs>
                        {/* Shadow facet */}
                        <Path d="M 4 20 L 16 22 L 12 28 Z" fill="#4C1D95" />
                        {/* Left facet */}
                        <Path d="M 4 20 L 28 6 L 16 22 Z" fill="url(#orangeGradHero)" />
                        {/* Right facet */}
                        <Path d="M 16 22 L 28 6 L 22 28 Z" fill="url(#purpleGradHero)" />
                        
                        {/* Sparkles */}
                        <Path d="M 26 2 Q 26 4 24 4 Q 26 4 26 6 Q 26 4 28 4 Q 26 4 26 2 Z" fill="#FB923C" />
                        <Path d="M 30 6 Q 30 7.5 28.5 7.5 Q 30 7.5 30 9 Q 30 7.5 31.5 7.5 Q 30 7.5 30 6 Z" fill="#FDBA74" />
                    </Svg>
                </View>
                <View style={styles.logoTextContainer}>
                    <Text style={styles.logoText}>UP Num</Text>
                    <Text style={styles.logoTagline}>Track. Analyze. Grow.</Text>
                </View>
            </View>

            {/* Headers */}
            <Text style={styles.heading}>
                Smart Insights,{"\n"}Stronger Business{"\n"}Decisions
            </Text>
            <Text style={styles.subtitle}>
                Track your sales, analyze performance and grow your business with AI Powered Insights.
            </Text>

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
                        <Ionicons name="trending-up" size={14} color="#22C55E" />
                        <Text style={styles.trendText}>+ 18.6%</Text>
                        <Text style={styles.trendSub}>vs last period</Text>
                    </View>

                    {/* SVG Line Chart */}
                    <View style={styles.chartContainer}>
                        <Svg height="100" width="100%" viewBox="0 0 300 100">
                            <Defs>
                                <SvgGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
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
                    <Svg height="70" width="70" viewBox="0 0 40 40">
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
                    <Ionicons name="card" size={24} color="#A78BFA" />
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
                <Svg height="80" width="100%" viewBox="0 0 500 80" preserveAspectRatio="none">
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
        paddingHorizontal: 40,
        paddingTop: 48,
        paddingBottom: 24,
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    logoCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    logoTextContainer: {
        justifyContent: "center",
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
    },
    logoTagline: {
        color: "#FDBA74",
        fontSize: 12,
        marginTop: 1,
    },
    heading: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "800",
        lineHeight: 42,
        marginTop: 12,
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.75)",
        fontSize: 15,
        lineHeight: 22,
        marginTop: 12,
        marginBottom: 24,
    },
    mockupContainer: {
        height: 180,
        width: "100%",
        position: "relative",
        marginVertical: 16,
    },
    salesCard: {
        backgroundColor: "rgba(30, 27, 75, 0.6)",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
            web: {
                boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
            } as any,
        }),
        width: "80%",
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
        fontSize: 11,
        fontWeight: "600",
    },
    salesCardValue: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 2,
    },
    periodBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    periodText: {
        color: "#94A3B8",
        fontSize: 9,
        fontWeight: "600",
        marginRight: 4,
    },
    trendRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },
    trendText: {
        color: "#22C55E",
        fontSize: 11,
        fontWeight: "700",
        marginLeft: 4,
    },
    trendSub: {
        color: "#64748B",
        fontSize: 10,
        marginLeft: 4,
    },
    chartContainer: {
        marginTop: 8,
        height: 80,
        overflow: "hidden",
    },
    donutCard: {
        position: "absolute",
        right: 10,
        bottom: 10,
        backgroundColor: "rgba(23, 14, 53, 0.85)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 20,
        padding: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 15,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: "0 8px 15px rgba(0,0,0,0.25)",
            } as any,
        }),
        zIndex: 2,
    },
    smallCard: {
        position: "absolute",
        right: 40,
        top: 10,
        backgroundColor: "rgba(49, 46, 129, 0.8)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
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
                boxShadow: "0 6px 10px rgba(0,0,0,0.2)",
            } as any,
        }),
        zIndex: 2,
    },
    smallCardText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 14,
    },
    features: {
        marginTop: 24,
        zIndex: 3,
    },
    skyline: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        zIndex: 0,
    },
});