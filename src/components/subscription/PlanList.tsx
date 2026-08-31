import React from "react";
import { View } from "react-native";

import { SubscriptionPlan } from "../../types/subscription";
import PlanCard from "./PlanCard";

interface Props {
    plans: SubscriptionPlan[];
    selectedPlanId: string;
    onSelect: (planId: string) => void;
}

export default function PlanList({
    plans,
    selectedPlanId,
    onSelect,
}: Props) {
    return (
        <View>
            {plans.map((plan) => (
                <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={
                        selectedPlanId === plan.id
                    }
                    onPress={() =>
                        onSelect(plan.id)
                    }
                />
            ))}
        </View>
    );
}