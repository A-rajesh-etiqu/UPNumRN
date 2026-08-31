import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import AppInput from "../inputs/TextInput";
import DatePickerField from "../common/DatePickerField";
import GenderSelector from "./GenderSelector";

import {
    Colors,
    Typography,
    Spacing,
} from "../../theme";
import { Gender } from "../../types/profile";

interface Props {

    firstName: string;
    lastName: string;
    dob: string;
    gender?: Gender;

    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onDobChange: (value: string) => void;
    onGenderChange: (gender: Gender) => void;
}

export default function PersonalInfoSection({
    firstName,
    lastName,
    dob,
    gender,
    onFirstNameChange,
    onLastNameChange,
    onDobChange,
    onGenderChange,
}: Props) {

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Personal Information
            </Text>

            <AppInput
                label="First Name"
                placeholder="Enter first name"
                icon="person-outline"
                value={firstName}
                onChangeText={onFirstNameChange}
            />

            <AppInput
                label="Last Name"
                placeholder="Enter last name"
                icon="person-outline"
                value={lastName}
                onChangeText={onLastNameChange}
            />

            <DatePickerField
                label="Date of Birth"
                value={dob}
                onChange={onDobChange}
            />

            <GenderSelector
                value={gender}
                onChange={onGenderChange}
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