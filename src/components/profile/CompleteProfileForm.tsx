import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
} from "react-native";

import PrimaryButton from "../buttons/PrimaryButton";

import ProfilePhotoSection from "./ProfilePhotoSection";
import PersonalInfoSection from "./PersonalInfoSection";
import LocationSection from "./LocationSection";
import PreferenceSection from "./PreferenceSection";

import { Gender } from "../../types/profile";
import { Spacing } from "../../theme";

interface Props {
    loading?: boolean;
    onSubmit: (data: CompleteProfileData) => void;
}

export interface CompleteProfileData {
    imageUri: string | null;

    firstName: string;
    lastName: string;

    dob: string;

    gender?: Gender;

    country: string;
    state: string;
    city: string;
}

export default function CompleteProfileForm({
    loading = false,
    onSubmit,
}: Props) {

    const [imageUri, setImageUri] =
        useState<string | null>(null);

    const [firstName, setFirstName] =
        useState("");

    const [lastName, setLastName] =
        useState("");

    const [dob, setDob] =
        useState("");

    const [gender, setGender] =
        useState<Gender>();

    const [country, setCountry] =
        useState("");

    const [state, setState] =
        useState("");

    const [city, setCity] =
        useState("");

    function handleSubmit() {

        onSubmit({

            imageUri,

            firstName,

            lastName,

            dob,

            gender,

            country,

            state,

            city,

        });

    }

    return (

        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >

            <ProfilePhotoSection
                image={imageUri}
                onImageChange={setImageUri}
            />

            <PersonalInfoSection
                firstName={firstName}
                lastName={lastName}
                dob={dob}
                gender={gender}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                onDobChange={setDob}
                onGenderChange={setGender}
            />

            <LocationSection
                country={country}
                state={state}
                city={city}
                onCountryChange={setCountry}
                onStateChange={setState}
                onCityChange={setCity}
            />

            <PreferenceSection />

            <PrimaryButton
                title="Continue"
                loading={loading}
                onPress={handleSubmit}
            />

        </ScrollView>

    );

}

const styles = StyleSheet.create({

    container: {
        padding: Spacing.lg,
        paddingBottom: 80,
    },

});