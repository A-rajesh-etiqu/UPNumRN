import React from "react";
import { useAuthStore } from "../../../store/auth.store";
import AiInsightsBusiness from "./AiInsightsBusiness";
import AiInsightsPersonal from "./AiInsightsPersonal";

export default function AiInsightsScreen() {
    const { user } = useAuthStore();
    const isBusiness = user?.userType === "BUSINESS";

    if (isBusiness) {
        return <AiInsightsBusiness />;
    }

    return <AiInsightsPersonal />;
}
