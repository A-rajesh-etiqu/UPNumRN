import React from "react";
import {
    SafeAreaView,
    StyleSheet,
} from "react-native";

import CompleteProfileForm from "../components/profile/CompleteProfileForm";
import { useCompleteProfile } from "../hooks/useCompleteProfile";

export default function CompleteProfileScreen() {

    const {
        loading,
        submit,
    } = useCompleteProfile();

    return (

        <SafeAreaView style={styles.container}>

            <CompleteProfileForm
                loading={loading}
                onSubmit={submit}
            />

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

});