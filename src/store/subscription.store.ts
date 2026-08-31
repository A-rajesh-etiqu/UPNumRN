import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
    UserSubscription
} from "../types/subscription";


interface SubscriptionState {


    subscription:
    UserSubscription | null;


    setSubscription:
    (
        subscription: UserSubscription
    ) => void;



    clearSubscription:
    () => void;



    isActive:
    () => boolean;

}



export const useSubscriptionStore =
    create<SubscriptionState>()(

        persist(

            (set, get) => ({


                subscription: null,



                setSubscription:
                    (
                        subscription
                    ) =>
                        set({
                            subscription
                        }),




                clearSubscription:
                    () =>
                        set({
                            subscription: null
                        }),




                isActive:
                    () => {


                        const subscription =
                            get().subscription;



                        if (!subscription) {
                            return false;
                        }



                        if (!subscription.active) {
                            return false;
                        }



                        if (
                            subscription.expiresAt
                        ) {

                            return (
                                new Date(
                                    subscription.expiresAt
                                )
                                >
                                new Date()
                            );

                        }



                        return true;

                    }


            }),


            {
                name:
                    "upnum-subscription"
            }


        )

    );