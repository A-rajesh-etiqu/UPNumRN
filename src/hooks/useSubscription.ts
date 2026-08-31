import { useState } from "react";

import {
    subscriptionSchema
} from "../validations/subscription.schema";

import {
    SubscriptionFormData
} from "../validations/subscription.schema";

import {
    subscriptionService
} from "../services/subscription.service";


export function useSubscription() {


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");



    async function subscribe(
        data: SubscriptionFormData
    ) {


        try {

            setError("");



            const result =
                subscriptionSchema.safeParse(data);



            if (!result.success) {

                const message =
                    result.error
                        .issues[0]
                        .message;


                setError(message);


                return null;

            }




            setLoading(true);



            const response =
                await subscriptionService.subscribe(
                    data
                );



            return response;



        }


        catch (e: any) {


            const message =
                e.message ??
                "Unable to activate subscription.";


            setError(message);


            return null;


        }


        finally {

            setLoading(false);

        }

    }



    return {

        loading,

        error,

        subscribe,

    };

}