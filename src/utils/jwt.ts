import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    exp: number;

    iat: number;

    sub: string;
}

/**
 * Decode JWT
 */
export function decodeToken(token: string): JwtPayload | null {
    try {
        return jwtDecode<JwtPayload>(token);
    } catch {
        return null;
    }
}

/**
 * Check token expiry
 */
export function isTokenExpired(token: string): boolean {
    if (token.startsWith("mock-")) {
        return false;
    }

    const decoded = decodeToken(token);

    if (!decoded) {
        return true;
    }

    return decoded.exp * 1000 <= Date.now();
}

/**
 * Minutes remaining
 */
export function getRemainingMinutes(
    token: string
): number {
    const decoded = decodeToken(token);

    if (!decoded) {
        return 0;
    }

    return Math.floor(
        (decoded.exp * 1000 - Date.now()) / 60000
    );
}

/**
 * Seconds remaining
 */
export function getRemainingSeconds(
    token: string
): number {
    const decoded = decodeToken(token);

    if (!decoded) {
        return 0;
    }

    return Math.floor(
        (decoded.exp * 1000 - Date.now()) / 1000
    );
}