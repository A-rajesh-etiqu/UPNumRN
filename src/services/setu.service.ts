import {
    SetuConsentResponse,
    SetuDataSessionResponse,
} from "../types/setu";


const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:8085";


export interface CreateConsentRequest {

    vua: string;

    consentDetail: Record<
        string,
        unknown
    >;

    additionalParams?: Record<
        string,
        unknown
    >;

    redirectUrl?: string;
}


export const setuService = {

    async checkAccountAvailability(
        mobileNumber: string
    ): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/setu-flow/account-availability`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ mobileNumber }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to check account availability");
        }
        return data;
    },

    async createConsent(
        request: CreateConsentRequest & { userId: string }
    ): Promise<SetuConsentResponse> {

        const response =
            await fetch(
                `${API_BASE_URL}/api/setu-flow/consents`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify(request),
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to create consent"
            );
        }


        return data;
    },


    async getConsent(
        consentId: string
    ) {

        const response =
            await fetch(
                `${API_BASE_URL}/api/setu-flow/consents/${consentId}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to get consent"
            );
        }


        return data;
    },


    async createDataSession(
        consentId: string,
        from: string,
        to: string
    ): Promise<SetuDataSessionResponse> {

        const response =
            await fetch(
                `${API_BASE_URL}/api/setu-flow/sessions`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body:
                        JSON.stringify({

                            consentId,

                            from,

                            to,

                            format: "json",

                        }),
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to create data session"
            );
        }


        return data;
    },


    async getDataSession(
        sessionId: string
    ) {

        const response =
            await fetch(
                `${API_BASE_URL}/api/setu-flow/sessions/${sessionId}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to get data session"
            );
        }


        return data;
    },

};