import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { useLocation } from "../../hooks/useLocation";
import { Colors, Radius, Spacing, Typography } from "../../theme";

interface Props {
    value: string;
    onChange: (countryId: string) => void;
}

export default function CountrySelector({
    value,
    onChange,
}: Props) {

    const {
        countries,
    } = useLocation();

    useEffect(() => {

        // Countries are loaded automatically
        // by useLocation()

    }, []);

    return (
        <View style={styles.container}>

            <Text style={styles.label}>
                Country
            </Text>

            <View style={styles.pickerContainer}>

                <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                >

                    <Picker.Item
                        label="Select Country"
                        value=""
                    />

                    {countries.map((country) => (

                        <Picker.Item
                            key={country.id}
                            label={country.name}
                            value={country.id}
                        />

                    ))}

                </Picker>

            </View>

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
        marginBottom: 8,
        color: Colors.text,
    },

    pickerContainer: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        backgroundColor: Colors.white,
        overflow: "hidden",
    },

});