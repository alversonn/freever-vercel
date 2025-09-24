// src/app/(dashboard)/layout.tsx
"use client";
import Layout from "@/components/Layout"; // perhatikan 'L' besar

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
