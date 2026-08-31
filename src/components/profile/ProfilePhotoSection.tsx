import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";

import ImagePicker from "../media/ImagePicker";
import {
    Colors,
    Spacing,
    Typography,
} from "../../theme";

interface Props {
    image: string | null;
    onImageChange: (uri: string) => void;
}

export default function ProfilePhotoSection({
    image,
    onImageChange,
}: Props) {
    return (
        <View style={styles.container}>

            <Text style={styles.title}>
                Profile Photo
            </Text>

            <ImagePicker
                imageUri={image}
                onImageSelected={onImageChange}
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