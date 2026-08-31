import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LogBox } from "react-native";

const Stack = createNativeStackNavigator();

LogBox.ignoreLogs([
    "shadow* style props are deprecated",
    "props.pointerEvents is deprecated",
]);

import AuthProvider from "../providers/AuthProvider";
import { maybeCompleteAuthSession } from "../utils/browser";

maybeCompleteAuthSession();

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="index" component={require("./index").default} />

                <Stack.Screen name="auth" component={require("./auth").default} />

                <Stack.Screen name="tabs" component={require("./tabs").default} />
            </Stack.Navigator>
        </AuthProvider>
    );
}