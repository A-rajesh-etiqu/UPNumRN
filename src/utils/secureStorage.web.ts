import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveToken(
    token: string
) {
    await AsyncStorage.setItem("accessToken", token);
}

export async function getToken() {
    return AsyncStorage.getItem("accessToken");
}

export async function removeToken() {
    return AsyncStorage.removeItem("accessToken");
}
