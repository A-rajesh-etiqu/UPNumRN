import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";

import {
    useAppTheme,
    Radius,
    Shadows,
    Spacing,
    Typography,
} from "../../theme";

export default function SalesChartCard() {
    const { colors } = useAppTheme();

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                Sales Overview
            </Text>

            <View style={styles.chartContainer}>
                <Svg width="100%" height="160" viewBox="0 0 350 140" preserveAspectRatio="none">
                    <Defs>
                        <SvgGradient id="salesCardGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
                            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                        </SvgGradient>
                    </Defs>

                    {/* Area Fill */}
                    <Path
                        d="M 10,100 C 50,70 80,90 120,50 C 160,20 200,60 250,30 C 290,10 320,40 340,20 L 340,130 L 10,130 Z"
                        fill="url(#salesCardGrad)"
                    />

                    {/* Line Stroke */}
                    <Path
                        d="M 10,100 C 50,70 80,90 120,50 C 160,20 200,60 250,30 C 290,10 320,40 340,20"
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="3"
                    />

                    {/* Active Point Highlight */}
                    <Circle cx="250" cy="30" r="5" fill={colors.primary} stroke={colors.surface} strokeWidth="2" />
                </Svg>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        ...Shadows.md,
    },
    title: {
        ...Typography.title,
        marginBottom: 20,
    },
    chartContainer: {
        height: 160,
        width: "100%",
    },
});