/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm green/brown palette
        bg: "#FAF7F0",
        surface: "#F2EEE4",
        border: "#E0D7C8",
        text: "#2B2418",
        muted: "#6B5E4B",
        primary: "#5C724A",
        primaryMuted: "#5C724A1A",
        accent: "#8B6F47",
        danger: "#B42318",
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
