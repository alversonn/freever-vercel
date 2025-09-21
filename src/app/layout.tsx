import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freever App",
  description: "Clinical Decision Support for Fever Diagnosis",
  // --- TAMBAHKAN BLOK INI UNTUK MENGGANTI FAVICON ---
  icons: {
    icon: "/logo-unpad.png", // Menunjuk ke file logo Anda
  },
  // ----------------------------------------------------
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}