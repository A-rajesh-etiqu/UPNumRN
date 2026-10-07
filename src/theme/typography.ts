import Fonts from "./fonts";

const Typography = {
    // Primary Font (Poppins): Headings
    h1: {
        fontFamily: Fonts.headings,
        fontSize: 42,
        fontWeight: "700" as const,
    },

    h2: {
        fontFamily: Fonts.headings,
        fontSize: 32,
        fontWeight: "700" as const,
    },

    h3: {
        fontFamily: Fonts.primary.semiBold,
        fontSize: 24,
        fontWeight: "600" as const,
    },

    title: {
        fontFamily: Fonts.primary.semiBold,
        fontSize: 20,
        fontWeight: "600" as const,
    },

    // Primary Font (Poppins): Logo
    logo: {
        fontFamily: Fonts.logo,
        fontSize: 24,
        fontWeight: "700" as const,
    },

    // Primary Font (Poppins): KPI Numbers
    kpi: {
        fontFamily: Fonts.kpi,
        fontSize: 28,
        fontWeight: "700" as const,
    },

    // Primary Font (Poppins): CTA Buttons
    button: {
        fontFamily: Fonts.cta,
        fontSize: 18,
        fontWeight: "600" as const,
    },

    // Secondary Font (Inter): Forms
    input: {
        fontFamily: Fonts.forms,
        fontSize: 14,
        fontWeight: "400" as const,
    },

    // Secondary Font (Inter): Tables
    tableHeader: {
        fontFamily: Fonts.secondary.semiBold,
        fontSize: 14,
        fontWeight: "600" as const,
    },

    tableCell: {
        fontFamily: Fonts.tables,
        fontSize: 14,
        fontWeight: "400" as const,
    },

    // Secondary Font (Inter): Paragraph Text
    body: {
        fontFamily: Fonts.paragraph,
        fontSize: 16,
        fontWeight: "400" as const,
    },

    bodyMedium: {
        fontFamily: Fonts.secondary.medium,
        fontSize: 16,
        fontWeight: "500" as const,
    },

    bodyBold: {
        fontFamily: Fonts.secondary.bold,
        fontSize: 16,
        fontWeight: "700" as const,
    },

    bodySmall: {
        fontFamily: Fonts.paragraph,
        fontSize: 14,
        fontWeight: "400" as const,
    },

    caption: {
        fontFamily: Fonts.paragraph,
        fontSize: 12,
        fontWeight: "400" as const,
    },

    // Secondary Font (Inter): Chart Labels
    chartLabel: {
        fontFamily: Fonts.chartLabels,
        fontSize: 12,
        fontWeight: "500" as const,
    },
};

export default Typography;