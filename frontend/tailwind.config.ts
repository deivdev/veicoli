import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ok: { DEFAULT: "#16a34a", bg: "#dcfce7" },
        warn: { DEFAULT: "#d97706", bg: "#fef3c7" },
        crit: { DEFAULT: "#dc2626", bg: "#fee2e2" },
      },
    },
  },
  plugins: [],
} satisfies Config;
