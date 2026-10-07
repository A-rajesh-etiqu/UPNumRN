/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Primary Font (Poppins)
        primary: ["Poppins_400Regular", "Poppins"],
        poppins: ["Poppins_400Regular", "Poppins"],
        logo: ["Poppins_700Bold", "Poppins"],
        headings: ["Poppins_700Bold", "Poppins"],
        kpi: ["Poppins_700Bold", "Poppins"],
        cta: ["Poppins_600SemiBold", "Poppins"],

        // Secondary Font (Inter)
        secondary: ["Inter_400Regular", "Inter"],
        inter: ["Inter_400Regular", "Inter"],
        forms: ["Inter_400Regular", "Inter"],
        tables: ["Inter_400Regular", "Inter"],
        paragraph: ["Inter_400Regular", "Inter"],
        chartLabels: ["Inter_500Medium", "Inter"],
      },
    },
  },
  plugins: [],
}

