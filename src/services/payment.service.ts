const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ??
    "http://localhost:8085";


export interface CreatePaymentRequest {
    orderId: string;
    amount: number;
    planId: string;
    userId?: string;
    vua?: string;
}


export interface SetuPayment {
    orderId: string;
    platformBillID: string;
    shortURL: string;
    upiID: string;
    upiLink: string;
}


export interface CreatePaymentResponse {
    success: boolean;
    data: SetuPayment;
}


export async function createPayment(
    payload: CreatePaymentRequest
): Promise<SetuPayment> {

    const response =
        await fetch(
            `${API_BASE_URL}/api/payments/create`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    payload
                ),
            }
        );


    const result =
        await response.json();


    if (!response.ok || !result.success) {

        throw new Error(
            result.message ||
            "Unable to create payment"
        );

    }


    return result.data;
}


export async function getPaymentStatus(
    platformBillID: string
) {

    const response =
        await fetch(
            `${API_BASE_URL}/api/payments/${platformBillID}/status`
        );


    const result =
        await response.json();


    if (!response.ok || !result.success) {

        throw new Error(
            result.message ||
            "Unable to fetch payment status"
        );

    }


    return result.data;
}