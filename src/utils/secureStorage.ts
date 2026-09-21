import { Platform } from "react-native";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web";

export async function saveToken(
    token: string
) {
    if (isWeb) {
        await AsyncStorage.setItem("accessToken", token);
    } else {
        await SecureStore.setItemAsync("accessToken", token);
    }
}

export async function getToken() {
    if (isWeb) {
        return AsyncStorage.getItem("accessToken");
    }
    return await SecureStore.getItemAsync("accessToken");
}

export async function removeToken() {
    if (isWeb) {
        return AsyncStorage.removeItem("accessToken");
    }
    return await SecureStore.deleteItemAsync("accessToken");
}