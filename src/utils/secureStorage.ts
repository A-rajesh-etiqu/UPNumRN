import { Platform } from "react-native";
import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

export async function saveToken(
    token: string
) {
    if (isWeb) {
        await AsyncStorage.setItem("accessToken", token);
    } else {
        await Keychain.setGenericPassword("accessToken", token, { service: "accessToken" });
    }
}

export async function getToken() {
    if (isWeb) {
        return AsyncStorage.getItem("accessToken");
    }
    const credentials = await Keychain.getGenericPassword({ service: "accessToken" });
    return credentials ? credentials.password : null;
}

export async function removeToken() {
    if (isWeb) {
        return AsyncStorage.removeItem("accessToken");
    }
    return Keychain.resetGenericPassword({ service: "accessToken" });
}