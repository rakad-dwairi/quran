/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Updated palette (green + gold)
        bg: "#FAF8F5",
        surface: "#F5F3EF",
        border: "#E0DBD1",
        text: "#0F241D",
        muted: "#57756B",
        mutedBg: "#EFECE7",

        primary: "#0E4E39",
        primaryForeground: "#FAF8F5",
        primaryMuted: "#0E4E391A",

        secondary: "#EDE4D4",
        secondaryForeground: "#0F241D",

        accent: "#CEA555",
        accentForeground: "#0F241D",

        danger: "#EF4444",
        dangerForeground: "#FAFAFA",

        input: "#E0DBD1",
        ring: "#0E4E39",

        chart1: "#0E4E39",
        chart2: "#CEA555",
        chart3: "#367D65",
        chart4: "#D1BD94",
        chart5: "#669988",
      },
      fontFamily: {
        ui: ["Inter_400Regular"],
        uiMedium: ["Inter_500Medium"],
        uiSemibold: ["Inter_600SemiBold"],
        serif: ["Literata_400Regular"],
        serifMedium: ["Literata_500Medium"],
        arabic: ["NotoNaskhArabic_400Regular"],
        arabicSemibold: ["NotoNaskhArabic_600SemiBold"],
      },
    },
  },
  plugins: [],
};
