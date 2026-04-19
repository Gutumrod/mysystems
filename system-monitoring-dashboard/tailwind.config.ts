import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ega: {
          black: "#000000",
          blue: "#0000aa",
          green: "#00aa00",
          cyan: "#00aaaa",
          red: "#aa0000",
          magenta: "#aa00aa",
          brown: "#aa5500",
          lightgray: "#aaaaaa",
          darkgray: "#555555",
          brightblue: "#5555ff",
          brightgreen: "#55ff55",
          brightcyan: "#55ffff",
          brightred: "#ff5555",
          brightmagenta: "#ff55ff",
          yellow: "#ffff55",
          white: "#ffffff"
        }
      },
      fontFamily: {
        pixel: ["var(--font-press-start)", "var(--font-vt323)", "monospace"],
        terminal: ["var(--font-vt323)", "monospace"]
      },
      boxShadow: {
        crt: "0 0 16px rgba(85, 255, 85, 0.45), inset 0 0 44px rgba(0, 170, 170, 0.28)",
        pixel: "4px 4px 0 #000"
      }
    }
  },
  plugins: []
};

export default config;
