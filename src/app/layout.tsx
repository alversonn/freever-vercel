import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "Freever App",
  description: "Clinical Decision Support for Fever Diagnosis",
  icons: {
    icon: "/freever-logo.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
