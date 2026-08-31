import {
    useSubscriptionStore
} from "../store/subscription.store";


export function useSubscriptionGuard() {

    const {
        subscription,
        isActive
    } =
        useSubscriptionStore();



    return {

        subscription,

        hasActiveSubscription:
            isActive()

    };

}