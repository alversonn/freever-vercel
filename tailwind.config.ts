import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate" // <-- 1. Tambahkan import di sini

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ...
    },
  },
  plugins: [tailwindcssAnimate], // <-- 2. Ganti 'require(...)' dengan variabel ini
}

export default config