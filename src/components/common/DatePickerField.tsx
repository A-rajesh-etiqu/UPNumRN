import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
    Colors,
    Radius,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    label: string;
    value?: string;
    placeholder?: string;
    maximumDate?: Date;
    minimumDate?: Date;
    error?: string;
    onChange: (value: string) => void;
}

export default function DatePickerField({

    label,

    value,

    placeholder = "Select Date",

    maximumDate,

    minimumDate,

    error,

    onChange,

}: Props) {

    const [show, setShow] =
        useState(false);

    const selectedDate = useMemo(() => {

        if (!value) return new Date();

        return new Date(value);

    }, [value]);

    function formatDate(date: Date) {

        return date.toISOString().split("T")[0];

    }

    return (

        <View style={styles.container}>

            <Text style={styles.label}>
                {label}
            </Text>

            <TouchableOpacity
                activeOpacity={0.8}
                style={[
                    styles.input,
                    error && styles.errorBorder,
                ]}
                onPress={() => setShow(true)}
            >

                <Text
                    style={[
                        styles.value,
                        !value && styles.placeholder,
                    ]}
                >
                    {value || placeholder}
                </Text>

                <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={Colors.primary}
                />

            </TouchableOpacity>

            {!!error && (
                <Text style={styles.error}>
                    {error}
                </Text>
            )}

            {show && (

                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    onChange={(event, date) => {

                        setShow(false);

                        if (date) {

                            onChange(
                                formatDate(date)
                            );

                        }

                    }}
                />

            )}

        </View>

    );

}

const styles = StyleSheet.create({

    container: {
        marginBottom: Spacing.lg,
    },

    label: {
        ...Typography.body,
        fontWeight: "600",
        color: Colors.text,
        marginBottom: 8,
    },

    input: {
        height: 56,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 16,
        backgroundColor: "#FFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    value: {
        ...Typography.body,
        color: Colors.text,
    },

    placeholder: {
        color: Colors.placeholder,
    },

    errorBorder: {
        borderColor: Colors.danger,
    },

    error: {
        marginTop: 6,
        fontSize: 13,
        color: Colors.danger,
    },

});