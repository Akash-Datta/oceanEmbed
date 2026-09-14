/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    // NOTE: `sm` is intentionally 701px (not the 640px default) so that
    // Tailwind responsive variants match the JS `isMobile` breakpoint
    // (window.innerWidth <= 700) used across all components.
    screens: {
      sm: "701px",
      md: "1024px",
      lg: "1280px",
    },
    extend: {
      fontFamily: {
        // Brand type system (loaded in index.html with display=swap).
        // Serif for headlines/wordmark, functional sans for everything else.
        sans: ["Public Sans", "system-ui", "Arial", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        mono: ["Public Sans", "system-ui", "sans-serif"],
      },
      colors: {
        // Strict 3-hex brand system (mirrors tokens.css).
        // Neutrals/hairlines derive from these via opacity — no new hues.
        paper: "#F7F4ED",
        ink: "#132730",
        accent: "#0C6E5E",
      },
      boxShadow: {
        // Hairline borders carry elevation; only one restrained shadow.
        soft: "0 1px 2px rgba(19, 39, 48, 0.08)",
        lift: "0 4px 16px rgba(19, 39, 48, 0.12)",
      },
      zIndex: {
        // Named stacking scale (mirrors tokens.css --z-*).
        control: 1000,
        panel: 2000,
        dropdown: 3000,
        toast: 4000,
        modal: 5000,
        boot: 6000,
      },
    },
  },
  plugins: [],
}