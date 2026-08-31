import { Platform } from "react-native";
import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/auth";

const STORAGE_KEYS = {
    ACCESS_TOKEN: "upnum_access_token",
    REFRESH_TOKEN: "upnum_refresh_token",
    USER: "upnum_user",
};

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string) {
    if (isWeb) {
        await AsyncStorage.setItem(key, value);
    } else {
        await Keychain.setGenericPassword(key, value, { service: key });
    }
}

async function getItem(key: string) {
    if (isWeb) {
        return AsyncStorage.getItem(key);
    }
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
}

async function deleteItem(key: string) {
    if (isWeb) {
        await AsyncStorage.removeItem(key);
    } else {
        await Keychain.resetGenericPassword({ service: key });
    }
}

class SecureStorageService {
    async saveAccessToken(token: string) {
        await setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }

    async saveRefreshToken(token: string) {
        await setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }

    async saveUser(user: User) {
        await setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    async saveSession(
        accessToken: string,
        refreshToken: string,
        user: User
    ) {
        await Promise.all([
            this.saveAccessToken(accessToken),
            this.saveRefreshToken(refreshToken),
            this.saveUser(user),
        ]);
    }

    async getAccessToken() {
        return getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    async getRefreshToken() {
        return getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }

    async getUser(): Promise<User | null> {
        const value = await getItem(STORAGE_KEYS.USER);

        return value ? JSON.parse(value) : null;
    }

    async updateAccessToken(token: string) {
        await this.saveAccessToken(token);
    }

    async clearSession() {
        await Promise.all([
            deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
            deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
            deleteItem(STORAGE_KEYS.USER),
        ]);
    }
}

export const secureStorage = new SecureStorageService();