/**
 * ============================================================
 * Environment Configuration
 * UpNum
 * ============================================================
 */

import { Platform } from 'react-native';

export const ENV = {
    API_BASE_URL: Platform.OS === 'web' ? "http://localhost:8085/api" : "http://192.168.1.2:8085/api",

    REQUEST_TIMEOUT: 30000,

    APP_NAME: "UpNum",

    VERSION: "1.0.0",
};