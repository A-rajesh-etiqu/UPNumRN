export type SetuConsentStatus =
    | "PENDING"
    | "ACTIVE"
    | "APPROVED"
    | "REJECTED"
    | "REVOKED"
    | "EXPIRED";


export interface SetuConsent {
    [x: string]: string;
    id: string;
    url: string;
    status: SetuConsentStatus | string;
}


export interface SetuConsentResponse {
    url: any;
    success: boolean;
    data: SetuConsent;
}


export interface SetuDataSession {
    id: string;

    consentId: string;

    status:
    | "PENDING"
    | "PARTIAL"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | string;

    format: "json" | "xml";

    dataRange: {
        from: string;
        to: string;
    };
}


export interface SetuDataSessionResponse {
    success: boolean;
    data: SetuDataSession;
}