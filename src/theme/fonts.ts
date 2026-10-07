/**
 * Application Font Configuration
 * Single source of truth for fonts across the entire application.
 *
 * Primary Font: Poppins - logo, headings, KPI numbers, CTA buttons
 * Secondary Font: Inter - forms, tables, paragraph text, chart labels
 *
 * Modifying font definitions here will update fonts throughout the application.
 */

export const Fonts = {
  // Primary Font Family (Poppins)
  primary: {
    family: "Poppins",
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },

  // Secondary Font Family (Inter)
  secondary: {
    family: "Inter",
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },

  // Designated Role Mappings:
  // Primary Font Roles:
  logo: "Poppins_700Bold",
  headings: "Poppins_700Bold",
  kpi: "Poppins_700Bold",
  cta: "Poppins_600SemiBold",

  // Secondary Font Roles:
  forms: "Inter_400Regular",
  tables: "Inter_400Regular",
  paragraph: "Inter_400Regular",
  chartLabels: "Inter_500Medium",
} as const;

export type FontRole = keyof typeof Fonts;
export default Fonts;
