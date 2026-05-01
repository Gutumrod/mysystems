import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        card: "hsl(var(--card))"
      },
      fontFamily: {
        headline: ["var(--font-headline)", "Leelawadee UI", "sans-serif"],
        body: ["var(--font-body)", "Leelawadee UI", "sans-serif"],
        sans: ["var(--font-body)", "Leelawadee UI", "sans-serif"]
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      },
      boxShadow: {
        neon: "0 0 20px rgba(105, 218, 255, 0.25)",
        "neon-lg": "0 0 32px rgba(105, 218, 255, 0.4)",
        ambient: "0 20px 40px rgba(0, 0, 0, 0.6)"
      }
    }
  },
  plugins: []
};

export default config;
