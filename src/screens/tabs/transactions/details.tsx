import { View, Text, StyleSheet } from "react-native";

export default function TransactionDetailsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Transaction Details</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
});
