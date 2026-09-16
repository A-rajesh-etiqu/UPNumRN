import { useColorScheme } from "react-native";
import { useThemeStore } from "../store/theme.store";

export const LightColors = {
    primary: "#6C2CF4", // Primary Violet
    primaryDark: "#2A0A6E", // Deep Purple
    secondary: "#FF7A00", // Action Orange
    accent: "#FF4D6D", // Gradient End
    success: "#00C853", // Success
    warning: "#FFC107", // Warning
    danger: "#FF5252", // Error
    error: "#FF5252",
    info: "#3B82F6",
    background: "#F8F9FC", // Background
    sidebarDark: "#18003F", // Sidebar Dark

    surface: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    placeholder: "#9CA3AF",
    border: "#E5E7EB",
    inputBackground: "#FFFFFF",
    white: "#FFFFFF",
    black: "#000000",

    gradient: {
        start: "#2A0A6E",
        middle: "#6C2CF4",
        end: "#FF4D6D",
    },

    card: "#FFFFFF",
    shadow: "rgba(0,0,0,0.08)",
    transparent: "transparent",
};

export const DarkColors = {
    primary: "#6C2CF4", // Brand Primary Violet
    primaryDark: "#2A0A6E", // Brand Deep Purple
    secondary: "#FF7A00", // Brand Action Orange
    accent: "#FF4D6D", // Brand Gradient End
    success: "#00C853", // Success
    warning: "#FFC107", // Warning
    danger: "#FF5252", // Error
    error: "#FF5252",
    info: "#3B82F6",
    background: "#090D1A", // Dark theme background
    sidebarDark: "#18003F", // Brand Sidebar Dark

    surface: "#111827", // Cards/sections background
    text: "#F3F4F6", // Light text for dark mode
    textSecondary: "#9CA3AF", // Dimmed text
    placeholder: "#4B5563",
    border: "#1F2937",
    inputBackground: "#1F2937",
    white: "#FFFFFF",
    black: "#000000",

    gradient: {
        start: "#2A0A6E",
        middle: "#6C2CF4",
        end: "#FF4D6D",
    },

    card: "#111827",
    shadow: "rgba(0,0,0,0.25)",
    transparent: "transparent",
};

// Default static Colors (fallback to Light mode for static style evaluations)
const Colors = LightColors;

export function useAppTheme() {
    const themeMode = useThemeStore((state) => state.themeMode);
    const systemColorScheme = useColorScheme();

    const resolvedTheme =
        themeMode === "system"
            ? systemColorScheme === "dark"
                ? "dark"
                : "light"
            : themeMode;

    const colors = resolvedTheme === "dark" ? DarkColors : LightColors;

    return {
        themeMode,
        resolvedTheme,
        colors,
        isDark: resolvedTheme === "dark",
        setThemeMode: useThemeStore((state) => state.setThemeMode),
    };
}

export default Colors;