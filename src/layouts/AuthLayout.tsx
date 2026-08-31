import React from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";

interface Props {
    children: React.ReactNode;
    hero?: React.ReactNode;
}

export default function AuthLayout({
    children,
    hero,
}: Props) {

    const { width } = useWindowDimensions();

    const desktop = width >= 1024;

    if (desktop) {

        return (

            <SafeAreaView style={styles.safe}>

                <View style={styles.desktop}>

                    <View style={styles.left}>
                        {hero}
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.right}
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>

                </View>

            </SafeAreaView>

        );

    }

    return (

        <SafeAreaView style={styles.safe}>

            <ScrollView
                contentContainerStyle={styles.mobile}
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    safe: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    desktop: {
        flex: 1,
        flexDirection: "row",
    },

    left: {
        flex: 1,
    },

    right: {
        flexGrow: 1,
        width: 520,
        justifyContent: "center",
        padding: 40,
    },

    mobile: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },

});