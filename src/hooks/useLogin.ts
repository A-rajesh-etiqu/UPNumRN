import { Alert } from "react-native";
import { router } from "../navigation/RootNavigation";

import { authApi } from "../api/authApi";
import { secureStorage } from "../services/secureStorage";
import { useAuthStore } from "../store/auth.store";
import { fetchNetworkTowerLocation } from "../services/networkLocation.service";

export function useLogin() {
    const {
        login,
        setLoading,
    } = useAuthStore();

    const onLogin = async (
        email: string,
        password: string
    ) => {
        try {
            setLoading(true);

            const tower = await fetchNetworkTowerLocation().catch(() => null);

            const response = await authApi.login({
                email,
                password,
                location: tower?.formattedLocation,
                ip: tower?.ip,
                carrier: tower?.isp,
            });

            if (tower && response.user) {
                response.user.loginLocation = tower.formattedLocation;
                response.user.loginIp = tower.ip;
                response.user.loginCarrier = tower.isp;
            }

            await secureStorage.saveSession(
                response.accessToken,
                response.refreshToken,
                response.user
            );

            login(
                response.user,
                response.accessToken,
                response.refreshToken
            );

            router.replace("/tabs/dashboard");
        } catch (error: any) {
            let message = "Unable to login.";

            if (error?.response?.data?.message) {
                if (Array.isArray(error.response.data.message)) {
                    message = error.response.data.message.join("\n");
                } else {
                    message = error.response.data.message;
                }
            }

            Alert.alert(
                "Login Failed",
                message
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        onLogin,
    };
}