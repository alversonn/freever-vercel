import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate" // <-- 1. Tambahkan import di sini

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
      // Tema custom Anda bisa ditambahkan di sini
    },
  },
  plugins: [tailwindcssAnimate], // <-- 2. Ganti 'require(...)' dengan variabel ini
}

export default config