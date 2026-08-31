import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

interface AuthBackgroundProps {
    type?: "login" | "signup";
}

const { width, height } = Dimensions.get("window");

export default function AuthBackground({ type = "login" }: AuthBackgroundProps) {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Top Wave (Login Only) */}
            {type === "login" && (
                <View style={styles.topLeftWave}>
                    <Svg width={width} height={width * 0.8} viewBox="0 0 375 300" preserveAspectRatio="none">
                        <Path
                            d="M 0 0 L 375 0 L 375 40 C 250 -40, 150 200, 0 100 Z"
                            fill="#F3E8FF"
                            opacity="0.8"
                        />
                        <Path
                            d="M 0 0 L 375 0 L 375 20 C 300 0, 200 150, 0 60 Z"
                            fill="#E9D5FF"
                            opacity="0.5"
                        />
                    </Svg>
                </View>
            )}

            {/* Top Right Dots (Login Only) */}
            {type === "login" && (
                <View style={styles.topRightDots}>
                    <Svg width="60" height="60" viewBox="0 0 60 60">
                        {Array.from({ length: 4 }).map((_, i) =>
                            Array.from({ length: 4 }).map((_, j) => (
                                <Circle key={`${i}-${j}`} cx={10 + i * 15} cy={10 + j * 15} r="2" fill="#E2E8F0" />
                            ))
                        )}
                    </Svg>
                </View>
            )}

            {/* Bottom Left Dots */}
            <View style={styles.bottomLeftDots}>
                <Svg width="60" height="60" viewBox="0 0 60 60">
                    {Array.from({ length: 4 }).map((_, i) =>
                        Array.from({ length: 3 }).map((_, j) => (
                            <Circle key={`${i}-${j}`} cx={10 + i * 15} cy={10 + j * 15} r="2" fill="#E2E8F0" />
                        ))
                    )}
                </Svg>
            </View>

            {/* Bottom Wave (Both) */}
            <View style={styles.bottomWave}>
                <Svg width={width} height={200} viewBox="0 0 375 200" preserveAspectRatio="none">
                    <Path
                        d="M 0 200 L 375 200 L 375 50 C 250 150, 100 0, 0 100 Z"
                        fill="#F3E8FF"
                        opacity="0.9"
                    />
                    <Path
                        d="M 0 200 L 375 200 L 375 120 C 250 180, 150 60, 0 150 Z"
                        fill="#E9D5FF"
                        opacity="0.6"
                    />
                </Svg>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topLeftWave: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
    },
    topRightDots: {
        position: "absolute",
        top: 60,
        right: 20,
    },
    bottomLeftDots: {
        position: "absolute",
        bottom: 30,
        left: 20,
    },
    bottomWave: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
});
