import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import LocationSelector from "./LocationSelector";

import {
    Colors,
    Typography,
    Spacing,
} from "../../theme";

interface Props {

    country: string;
    state: string;
    city: string;

    onCountryChange: (value: string) => void;
    onStateChange: (value: string) => void;
    onCityChange: (value: string) => void;
}

export default function LocationSection({
    country,
    state,
    city,
    onCountryChange,
    onStateChange,
    onCityChange,
}: Props) {

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Location
            </Text>

            <LocationSelector
                country={country}
                state={state}
                city={city}
                onCountryChange={onCountryChange}
                onStateChange={onStateChange}
                onCityChange={onCityChange}
            />

        </View>

    );
}

const styles = StyleSheet.create({

    container: {
        marginBottom: Spacing.xl,
    },

    title: {
        ...Typography.title,
        color: Colors.text,
        marginBottom: Spacing.md,
    },

});