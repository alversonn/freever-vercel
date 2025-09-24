// src/app/layout.tsx (SERVER component — tanpa "use client")
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Freever App", template: "%s • Freever" },
  description: "Clinical Decision Support for Fever Diagnosis",
  icons: { icon: "/favicon.ico" }, // sesuaikan kalau perlu
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
