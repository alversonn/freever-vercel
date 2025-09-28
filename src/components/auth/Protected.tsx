"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Kalau belum login, lempar ke /login dengan callback untuk kembali ke halaman semula setelah login
    if (status === "unauthenticated") {
      const cb = encodeURIComponent(pathname || "/assessment");
      router.replace(`/login?callbackUrl=${cb}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Biar tidak flicker isi halaman sebelum redirect
    return null;
  }

  return <>{children}</>;
}
