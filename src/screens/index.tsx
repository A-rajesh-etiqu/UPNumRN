import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function Index() {
    const { width, height } = useWindowDimensions();

    return (
        <View style={styles.container}>
            {/* Top Light Section */}
            <View style={styles.topSection}>
                {/* Subtle Background Chart */}
                <View style={styles.bgChart}>
                    <Svg width="100%" height="200" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <Defs>
                            <SvgGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.5" />
                                <Stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.8" />
                            </SvgGradient>
                        </Defs>
                        {/* Fake bars */}
                        <Path d="M40 180 L70 180 L70 200 L40 200 Z" fill="#EEF2FF" />
                        <Path d="M90 150 L120 150 L120 200 L90 200 Z" fill="#EEF2FF" />
                        <Path d="M140 130 L170 130 L170 200 L140 200 Z" fill="#E0E7FF" />
                        <Path d="M190 160 L220 160 L220 200 L190 200 Z" fill="#E0E7FF" />
                        <Path d="M240 110 L270 110 L270 200 L240 200 Z" fill="#C7D2FE" opacity="0.6" />
                        <Path d="M290 80 L320 80 L320 200 L290 200 Z" fill="#C7D2FE" opacity="0.8" />
                        <Path d="M340 50 L370 50 L370 200 L340 200 Z" fill="#A5B4FC" opacity="0.7" />
                        
                        {/* Line trend */}
                        <Path d="M 0 160 Q 60 180 120 120 T 240 100 T 400 40" fill="none" stroke="url(#chartLine)" strokeWidth="3" />
                        <Circle cx="120" cy="120" r="4" fill="#FFFFFF" stroke="#C7D2FE" strokeWidth="2" />
                        <Circle cx="240" cy="100" r="4" fill="#FFFFFF" stroke="#A5B4FC" strokeWidth="2" />
                        <Path d="M380 45 L395 30 L395 45 Z" fill="#C7D2FE" />
                    </Svg>
                </View>

                {/* Logo Area */}
                <View style={styles.logoWrapper}>
                    <Svg width="120" height="120" viewBox="0 0 64 64">
                        <Defs>
                            <SvgGradient id="gradOrange" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#F97316" />
                                <Stop offset="100%" stopColor="#EA580C" />
                            </SvgGradient>
                            <SvgGradient id="gradPurple" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#A855F7" />
                                <Stop offset="100%" stopColor="#6B21A8" />
                            </SvgGradient>
                            <SvgGradient id="gradShadow" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0%" stopColor="#4C1D95" />
                                <Stop offset="100%" stopColor="#312E81" />
                            </SvgGradient>
                        </Defs>
                        {/* Shadow facet */}
                        <Path d="M 12 40 L 32 44 L 26 54 Z" fill="url(#gradShadow)" />
                        {/* Left Purple facet */}
                        <Path d="M 12 40 L 52 14 L 32 44 Z" fill="url(#gradPurple)" />
                        {/* Right Orange facet */}
                        <Path d="M 32 44 L 52 14 L 46 54 Z" fill="url(#gradOrange)" />
                    </Svg>
                    <Text style={styles.appName}>UP Num</Text>
                    <Text style={styles.appTagline}>AI-Powered UPI Analytics</Text>
                </View>
            </View>

            {/* Bottom Purple Section */}
            <View style={styles.bottomSection}>
                <LinearGradient
                    colors={["#7C3AED", "#4C1D95", "#0F172A"]}
                    style={StyleSheet.absoluteFill}
                />
                {/* Wavy Divider */}
                <View style={styles.wave}>
                    <Svg width="100%" height="80" viewBox="0 0 1440 100" preserveAspectRatio="none">
                        <Path
                            fill="#7C3AED"
                            d="M0,0 C320,100 420,100 720,50 C1020,0 1120,0 1440,30 L1440,100 L0,100 Z"
                        />
                    </Svg>
                </View>
                
                <View style={styles.bottomContent}>
                    {/* 4 Icons Row */}
                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="bar-chart" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureText}>Track.{"\n"}Analyze.</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="pie-chart" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureText}>Smart{"\n"}Insights</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureText}>Secure{"\n"}Transactions</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="wallet" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.featureText}>Grow Your{"\n"}Business</Text>
                        </View>
                    </View>

                    {/* Titles & Description */}
                    <View style={styles.textWrap}>
                        <Text style={styles.mainHeading}>All your UPI data.{"\n"}One smart dashboard.</Text>
                        <Text style={styles.description}>
                            Real-time analytics, AI insights and clear{"\n"}reports to help you grow.
                        </Text>
                    </View>

                    {/* Loading Spinner */}
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#A78BFA" />
                        <Text style={styles.loadingText}>Loading your insights...</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    topSection: {
        flex: 0.45,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    bgChart: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        opacity: 0.8,
    },
    logoWrapper: {
        alignItems: "center",
        marginTop: 40,
    },
    appName: {
        fontSize: 42,
        fontWeight: "900",
        color: "#0F172A",
        marginTop: -10,
        letterSpacing: -1,
    },
    appTagline: {
        fontSize: 16,
        color: "#64748B",
        fontWeight: "500",
        marginTop: 4,
    },
    bottomSection: {
        flex: 0.55,
        position: "relative",
    },
    wave: {
        position: "absolute",
        top: -79,
        left: 0,
        right: 0,
        height: 80,
    },
    bottomContent: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 50,
    },
    featuresRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 400,
        paddingHorizontal: 10,
    },
    featureItem: {
        alignItems: "center",
        flex: 1,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    featureText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 16,
    },
    textWrap: {
        alignItems: "center",
    },
    mainHeading: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        lineHeight: 32,
    },
    description: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
        marginTop: 12,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        marginTop: 16,
        fontWeight: "500",
    },
});