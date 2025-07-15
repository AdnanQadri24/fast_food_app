/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FE8C00",
        white: { DEFAULT: "#ffffff", 100: "#fafafa", 200: "fe8c00" },
        gray: { 100: "878787" },
        dark: { 100: "#181c2e" },
        error: "f14141",
        susses: "#2f9b65",
      },
      fontFamily: {
        quicksand: ["Quicksand-Regular", "sans-serif"],
        "quicksand-bold": ["Quicksand-Bold", "sans-serif"],
        "quicksand-semibold": ["Quicksand-Semibold", "sans-serif"],
        "quicksand-light": ["Quicksanf-Light", "sans-serif"],
        "quicksand-medium": ["Quicksand-medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};
