import type { Config } from "tailwindcss";

// Cordia design system tokens. Do not add colors/fonts/spacing outside this
// list — extend here, never with arbitrary values scattered inline.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        body: "#3A3A3A",
        muted: "#6E6E6E",
        fill: "#F6F7F4",
        accent: "#4A5A42",
        "accent-gold": "#7A5B2E",
        border: "rgba(11,11,11,0.08)",
      },
      fontFamily: {
        heading: [
          "var(--font-newsreader)",
          "Iowan Old Style",
          "Georgia",
          "serif",
        ],
        label: ["var(--font-work-sans)", "Inter", "system-ui", "sans-serif"],
        body: [
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        h1: ["40px", { lineHeight: "1.1", letterSpacing: "-0.4px", fontWeight: "500" }],
        h2: ["34px", { lineHeight: "1.15", letterSpacing: "-0.34px", fontWeight: "500" }],
        h3: ["24px", { lineHeight: "1.2", letterSpacing: "-0.24px", fontWeight: "500" }],
        eyebrow: ["11px", { lineHeight: "1.4", letterSpacing: "1.76px", fontWeight: "600" }],
        label: ["11px", { lineHeight: "1.4", letterSpacing: "1.76px", fontWeight: "600" }],
        "label-sm": ["10.5px", { lineHeight: "1.4", letterSpacing: "1.26px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "24px", fontWeight: "400" }],
      },
      borderRadius: {
        pill: "999px",
        card: "14px",
        input: "20px",
      },
      boxShadow: {
        elevation:
          "0 1px 1px rgba(11,11,11,.05), 0 3px 5px -1px rgba(11,11,11,.06), 0 9px 16px -6px rgba(11,11,11,.09), 0 20px 34px -16px rgba(11,11,11,.1)",
      },
    },
  },
  plugins: [],
};

export default config;
