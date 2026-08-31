import React, { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { LANGUAGES } from "../../constants/languages";
import { useLanguageStore } from "../../store/language.store";
import { Colors, Radius, Spacing } from "../../theme";

export default function LanguageSelector() {

    const [visible, setVisible] = useState(false);

    const {
        language,
        setLanguage,
    } = useLanguageStore();

    const selectedLanguage = useMemo(
        () =>
            LANGUAGES.find(
                (item) => item.code === language
            ) ?? LANGUAGES[0],
        [language]
    );

    return (
        <>
            <TouchableOpacity
                style={styles.selector}
                onPress={() => setVisible(true)}
            >
                <Ionicons
                    name="globe-outline"
                    size={16}
                    color="#64748B"
                />

                <Text style={styles.text}>
                    {selectedLanguage.nativeName}
                </Text>

                <Ionicons
                    name="chevron-down"
                    size={12}
                    color="#64748B"
                />
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="fade"
                transparent
            >
                <Pressable
                    style={styles.overlay}
                    onPress={() =>
                        setVisible(false)
                    }
                >

                    <View style={styles.card}>

                        <Text style={styles.title}>
                            Select Language
                        </Text>

                        {LANGUAGES.map((item) => (

                            <TouchableOpacity
                                key={item.code}
                                style={styles.row}
                                onPress={() => {

                                    setLanguage(item.code);

                                    setVisible(false);

                                }}
                            >

                                <Text style={styles.flag}>
                                    {item.flag}
                                </Text>

                                <View style={{ flex: 1 }}>

                                    <Text style={styles.name}>
                                        {item.nativeName}
                                    </Text>

                                    <Text style={styles.sub}>
                                        {item.name}
                                    </Text>

                                </View>

                                {language === item.code && (

                                    <Ionicons
                                        name="checkmark-circle"
                                        color={Colors.primary}
                                        size={22}
                                    />

                                )}

                            </TouchableOpacity>

                        ))}

                    </View>

                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({

    selector: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#FFF",
        gap: 6,
    },

    text: {
        fontSize: 13,
        color: "#475569",
        fontWeight: "500",
    },

    overlay: {

        flex: 1,

        backgroundColor: "rgba(0,0,0,0.45)",

        justifyContent: "center",

        alignItems: "center",
    },

    card: {

        width: 340,

        backgroundColor: "#FFF",

        borderRadius: Radius.lg,

        padding: Spacing.lg,
    },

    title: {

        fontSize: 18,

        fontWeight: "700",

        marginBottom: Spacing.lg,

        color: Colors.text,
    },

    row: {

        flexDirection: "row",

        alignItems: "center",

        paddingVertical: 14,
    },

    flag: {

        fontSize: 24,

        marginRight: 15,
    },

    name: {

        fontSize: 16,

        fontWeight: "600",

        color: Colors.text,
    },

    sub: {

        color: Colors.textSecondary,

        marginTop: 2,
    },

});