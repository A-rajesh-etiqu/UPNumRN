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
    countryId: string;
    value: string;
    onChange: (stateId: string) => void;
}

export default function StateSelector({
    countryId,
    value,
    onChange,
}: Props) {

    const {
        states,
        loadStates,
    } = useLocation();

    useEffect(() => {

        if (countryId) {

            loadStates(countryId);

        }

    }, [countryId]);

    return (
        <View style={styles.container}>

            <Text style={styles.label}>
                State
            </Text>

            <View style={styles.pickerContainer}>

                <Picker
                    enabled={!!countryId}
                    selectedValue={value}
                    onValueChange={onChange}
                >

                    <Picker.Item
                        label="Select State"
                        value=""
                    />

                    {states.map((state) => (

                        <Picker.Item
                            key={state.id}
                            label={state.name}
                            value={state.id}
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