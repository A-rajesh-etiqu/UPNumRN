import React, { useState } from "react";
import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
} from "react-native";

import * as ImagePickerExpo from "react-native-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
    Colors,
    Radius,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    imageUri?: string | null;
    onImageSelected: (uri: string) => void;
    size?: number;
    editable?: boolean;
}

export default function ImagePicker({

    imageUri,

    onImageSelected,

    size = 120,

    editable = true,

}: Props) {

    const [loading, setLoading] = useState(false);

    async function pickImage() {

        if (!editable) return;

        try {

            if (Platform.OS !== "web") {

                const permission =
                    await ImagePickerExpo.requestMediaLibraryPermissionsAsync();

                if (!permission.granted) {

                    Alert.alert(
                        "Permission Required",
                        "Please allow photo access."
                    );

                    return;
                }

            }

            setLoading(true);

            const result =
                await ImagePickerExpo.launchImageLibraryAsync({

                    mediaTypes:
                        ImagePickerExpo.MediaTypeOptions.Images,

                    allowsEditing: true,

                    aspect: [1, 1],

                    quality: 0.8,

                });

            if (!result.canceled) {

                onImageSelected(
                    result.assets[0].uri
                );

            }

        } finally {

            setLoading(false);

        }

    }

    return (

        <TouchableOpacity

            activeOpacity={0.8}

            onPress={pickImage}

            style={styles.wrapper}

        >

            <View
                style={[
                    styles.avatar,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                ]}
            >

                {imageUri ? (

                    <Image

                        source={{ uri: imageUri }}

                        style={{
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        }}

                    />

                ) : (

                    <Ionicons

                        name="person"

                        size={size * 0.45}

                        color={Colors.placeholder}

                    />

                )}

            </View>

            {editable && (

                <View style={styles.cameraBadge}>

                    <Ionicons

                        name="camera"

                        size={18}

                        color="#FFF"

                    />

                </View>

            )}

            <Text style={styles.label}>

                {loading
                    ? "Loading..."
                    : "Upload Photo"}

            </Text>

        </TouchableOpacity>

    );

}

const styles = StyleSheet.create({

    wrapper: {

        alignItems: "center",

        marginBottom: Spacing.xl,

    },

    avatar: {

        backgroundColor: "#F6F7FB",

        justifyContent: "center",

        alignItems: "center",

        borderWidth: 2,

        borderColor: Colors.border,

        overflow: "hidden",

    },

    cameraBadge: {

        position: "absolute",

        right: 5,

        bottom: 30,

        width: 34,

        height: 34,

        borderRadius: 17,

        backgroundColor: Colors.primary,

        justifyContent: "center",

        alignItems: "center",

    },

    label: {

        marginTop: 12,

        ...Typography.body,

        color: Colors.primary,

        fontWeight: "600",

    },

});