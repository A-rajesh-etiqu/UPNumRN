import { View, Text, StyleSheet } from "react-native";

export default function SubscriptionPlansScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Subscription Plans</Text>
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
