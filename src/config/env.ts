/**
 * ============================================================
 * Environment Configuration
 * UpNum
 * ============================================================
 */

import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
    const g = globalThis as any;
    if (Platform.OS === 'web' && typeof g.window !== 'undefined' && g.window.location) {
        const hostname = g.window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return "http://localhost:8085/api";
        }
        return "https://upnum.etiquetteai.in/api";
    }
    return "http://192.168.1.2:8085/api";
};

export const ENV = {
    API_BASE_URL: getApiBaseUrl(),

    REQUEST_TIMEOUT: 30000,

    APP_NAME: "UpNum",

    VERSION: "1.0.0",
};