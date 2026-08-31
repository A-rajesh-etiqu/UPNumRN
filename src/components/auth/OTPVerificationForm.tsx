import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

import OTPInput from "../inputs/OTPInput";
import PrimaryButton from "../buttons/PrimaryButton";
import { useOtp } from "../../hooks/useOtp";
import { Colors, Spacing } from "../../theme";

interface Props {
    userId: string;
}

export default function OTPVerificationForm({
    userId,
}: Props) {

    const {

        otp,

        setOtp,

        verifyOtp,

        resendOtp,

        loading,

        seconds,

        error,

    } = useOtp(userId);

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Verify OTP
            </Text>

            <Text style={styles.subtitle}>
                Enter the 6-digit OTP sent to your mobile number.
            </Text>

            <OTPInput
                value={otp}
                onChange={setOtp}
            />

            {!!error && (
                <Text style={styles.error}>
                    {error}
                </Text>
            )}

            <PrimaryButton
                title="Verify OTP"
                loading={loading}
                onPress={verifyOtp}
            />

            {seconds > 0 ? (

                <Text style={styles.timer}>
                    Resend OTP in {seconds}s
                </Text>

            ) : (

                <TouchableOpacity
                    onPress={resendOtp}
                >
                    <Text style={styles.resend}>
                        Resend OTP
                    </Text>
                </TouchableOpacity>

            )}

        </View>

    );

}

const styles = StyleSheet.create({

    container: {

        width: "100%",

        maxWidth: 500,

        alignSelf: "center",
    },

    title: {

        fontSize: 28,

        fontWeight: "700",

        color: Colors.text,
    },

    subtitle: {

        marginTop: 10,

        marginBottom: 24,

        color: Colors.textSecondary,
    },

    timer: {

        textAlign: "center",

        marginTop: Spacing.lg,

        color: Colors.textSecondary,
    },

    resend: {

        textAlign: "center",

        marginTop: Spacing.lg,

        color: Colors.primary,

        fontWeight: "700",
    },

    error: {

        color: "#EF4444",

        marginBottom: Spacing.md,

        textAlign: "center",
    },

});