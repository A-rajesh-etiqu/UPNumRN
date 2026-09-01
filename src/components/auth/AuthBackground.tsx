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
                    <Svg width="100%" height={width * 0.8} viewBox="0 0 375 300" preserveAspectRatio="none">
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

            {/* Top Right Floating Shield (Login Only) */}
            {type === "login" && (
                <View style={styles.floatingShield}>
                    <Svg width="100" height="100" viewBox="0 0 100 100">
                        {/* Faint circular outlines */}
                        <Circle cx="50" cy="50" r="40" stroke="#F3E8FF" strokeWidth="1" fill="none" />
                        <Circle cx="50" cy="50" r="30" stroke="#F3E8FF" strokeWidth="0.5" fill="none" />
                        {/* Shield icon */}
                        <Path 
                            d="M 30 35 L 50 25 L 70 35 L 70 50 C 70 65, 50 75, 50 75 C 50 75, 30 65, 30 50 Z" 
                            fill="#F3E8FF" 
                        />
                        {/* Lock body inside shield */}
                        <Path 
                            d="M 44 48 L 56 48 L 56 56 L 44 56 Z" 
                            fill="#FFFFFF" 
                        />
                        {/* Lock hook */}
                        <Path 
                            d="M 46 48 L 46 44 C 46 40, 54 40, 54 44 L 54 48" 
                            stroke="#FFFFFF" 
                            strokeWidth="2"
                            fill="none"
                        />
                        <Circle cx="80" cy="20" r="8" fill="#F3E8FF" />
                        <Path d="M 77 20 L 79 22 L 83 18" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
                <Svg width="100%" height={200} viewBox="0 0 375 200" preserveAspectRatio="none">
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
    floatingShield: {
        position: "absolute",
        top: 140,
        right: 20,
        opacity: 0.8,
    },
});
