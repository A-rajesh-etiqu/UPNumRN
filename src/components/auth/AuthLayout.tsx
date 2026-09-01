import React from "react";
import {
    View,
    StyleSheet,
    useWindowDimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import HeroPanel from "./HeroPanel";
import AuthBackground from "./AuthBackground";

interface AuthLayoutProps {
    children: React.ReactNode;
    type?: "login" | "signup";
}

export default function AuthLayout({
    children,
    type = "login",
}: AuthLayoutProps) {
    const { width } = useWindowDimensions();

    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

    if (isDesktop) {
        return (
            <View style={styles.desktopContainer}>
                <View style={styles.leftPanel}>
                    <HeroPanel />
                </View>

                <View style={styles.rightPanel}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.formContainer}
                        >
                            {children}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.mobileContainer}>
            <AuthBackground type={type} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.mobileContent}
                    showsVerticalScrollIndicator={false}
                >
                    {isTablet && (
                        <View style={styles.tabletHero}>
                            <HeroPanel />
                        </View>
                    )}

                    <View style={styles.mobileForm}>
                        {children}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    desktopContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
    },
    leftPanel: {
        flex: 1.1,
    },
    rightPanel: {
        flex: 0.9,
        backgroundColor: "#FFFFFF",
    },
    formContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 70,
        paddingVertical: 20,
    },
    mobileContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
    },
    mobileContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 24,
    },
    tabletHero: {
        height: 360,
    },
    mobileForm: {
        flex: 1,
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
    },
});