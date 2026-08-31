import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { Colors, Radius, Spacing, Typography } from "../../theme";
import { Gender } from "../../types/profile";

interface Props {
    value?: Gender;
    onChange: (value: Gender) => void;
    error?: string;
}

const OPTIONS: {
    label: string;
    value: Gender;
    icon: keyof typeof Ionicons.glyphMap;
}[] = [
        {
            label: "Male",
            value: "MALE",
            icon: "male",
        },
        {
            label: "Female",
            value: "FEMALE",
            icon: "female",
        },
        {
            label: "Other",
            value: "OTHER",
            icon: "transgender",
        },
    ];

export default function GenderSelector({
    value,
    onChange,
    error,
}: Props) {

    return (
        <View style={styles.container}>

            <Text style={styles.label}>
                Gender
            </Text>

            <View style={styles.row}>

                {OPTIONS.map((item) => {

                    const selected =
                        value === item.value;

                    return (

                        <TouchableOpacity
                            key={item.value}
                            activeOpacity={0.8}
                            onPress={() =>
                                onChange(item.value)
                            }
                            style={[
                                styles.card,
                                selected &&
                                styles.selectedCard,
                            ]}
                        >

                            <Ionicons
                                name={item.icon}
                                size={26}
                                color={
                                    selected
                                        ? "#FFFFFF"
                                        : Colors.primary
                                }
                            />

                            <Text
                                style={[
                                    styles.cardText,
                                    selected &&
                                    styles.selectedText,
                                ]}
                            >
                                {item.label}
                            </Text>

                        </TouchableOpacity>

                    );

                })}

            </View>

            {!!error && (
                <Text style={styles.error}>
                    {error}
                </Text>
            )}

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        marginBottom: Spacing.lg,
    },

    label: {
        ...Typography.bodyMedium,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: 10,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },

    card: {
        flex: 1,
        height: 90,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },

    selectedCard: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },

    cardText: {
        marginTop: 10,
        ...Typography.bodyMedium,
        color: Colors.text,
        fontWeight: "600",
    },

    selectedText: {
        color: "#FFFFFF",
    },

    error: {
        marginTop: 6,
        color: Colors.error,
        fontSize: 13,
    },

});