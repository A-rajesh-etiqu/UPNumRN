import { View, Text, StyleSheet } from "react-native";
import { useAppTheme } from "../../../theme";

export default function SalesChartScreen() {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Sales Chart</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
});
