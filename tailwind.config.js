/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        text: "#0F172A",
        muted: "#475569",
        primary: "#0F766E",
        primaryMuted: "#0F766E1A",
        accent: "#D4AF37",
        danger: "#B91C1C",
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
