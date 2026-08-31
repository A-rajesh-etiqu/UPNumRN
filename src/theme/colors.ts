import { useColorScheme } from "react-native";
import { useThemeStore } from "../store/theme.store";

export const LightColors = {
    primary: "#6C2CF4", // Primary Violet
    primaryDark: "#2A0A6E", // Deep Purple
    secondary: "#FF7A00", // Action Orange
    accent: "#FF4D6D", // Gradient End / Accent
    success: "#00C853", // Success Green
    warning: "#FFC107", // Warning Yellow
    danger: "#FF5252", // Error / Danger Red
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
        end: "#FF7A00",
    },

    card: "#FFFFFF",
    shadow: "rgba(0,0,0,0.08)",
    transparent: "transparent",
};

export const DarkColors = {
    primary: "#A78BFA", // Lighter violet for dark mode contrast
    primaryDark: "#1E1B4B",
    secondary: "#F97316",
    accent: "#FB7185",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    error: "#EF4444",
    info: "#3B82F6",
    background: "#090D1A", // Very dark navy/slate background
    sidebarDark: "#030712", // Slate 950 for sidebar

    surface: "#111827", // Slate 900 for cards/sections
    text: "#F3F4F6", // Light gray text
    textSecondary: "#9CA3AF", // Medium gray text
    placeholder: "#4B5563", // Dark gray placeholder
    border: "#1F2937", // Slate 800 border
    inputBackground: "#1F2937",
    white: "#FFFFFF",
    black: "#000000",

    gradient: {
        start: "#030712",
        middle: "#111827",
        end: "#1E1B4B",
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