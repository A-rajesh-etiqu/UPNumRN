import React from "react";
import {
    View,
    StyleSheet,
    useWindowDimensions,
} from "react-native";

interface Props {
    children: React.ReactNode;
}

export default function AuthContainer({
    children,
}: Props) {
    const { width } = useWindowDimensions();

    const desktop = width >= 900;

    // Convert children to an array safely
    const childArray = React.Children.toArray(children);

    return (
        <View style={styles.root}>
            {desktop && (
                <View style={styles.left}>
                    {childArray[0]}
                </View>
            )}

            <View style={styles.right}>
                {desktop ? childArray[1] : childArray}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "#F6F7FB",
    },

    left: {
        flex: 1,
    },

    right: {
        flex: 1,
        backgroundColor: "#FFF",
        padding: 40,
        justifyContent: "center",
    },
});