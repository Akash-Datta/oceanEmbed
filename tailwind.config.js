/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // Brand type system (loaded in index.html with display=swap).
        sans: ["Inter", "system-ui", "Arial", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Preliminary OceanEmbed brand ramp — mirrored as CSS vars in
        // src/styles/tokens.css (Phase 1, single source of truth).
        abyss: "#06283d",
        ink: "#0f172a",
        ocean: {
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
        },
        lagoon: "#22d3ee",
        foam: "#f0f9ff",
      },
      boxShadow: {
        soft: "0 4px 16px rgba(2, 132, 199, 0.12)",
        lift: "0 12px 32px rgba(2, 132, 199, 0.18)",
      },
    },
  },
  plugins: [],
}