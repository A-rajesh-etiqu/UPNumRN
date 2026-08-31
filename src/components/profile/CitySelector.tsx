import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { useLocation } from "../../hooks/useLocation";
import {
    Colors,
    Radius,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    stateId: string;
    value: string;
    onChange: (cityId: string) => void;
}

export default function CitySelector({
    stateId,
    value,
    onChange,
}: Props) {

    const {
        cities,
        loadCities,
    } = useLocation();

    useEffect(() => {

        if (stateId) {

            loadCities(stateId);

        }

    }, [stateId]);

    return (

        <View style={styles.container}>

            <Text style={styles.label}>
                City
            </Text>

            <View style={styles.pickerContainer}>

                <Picker
                    enabled={!!stateId}
                    selectedValue={value}
                    onValueChange={onChange}
                >

                    <Picker.Item
                        label="Select City"
                        value=""
                    />

                    {cities.map((city) => (

                        <Picker.Item
                            key={city.id}
                            label={city.name}
                            value={city.id}
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