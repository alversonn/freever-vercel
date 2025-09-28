// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Jika user sudah login dan mencoba mengakses halaman login/signup, arahkan mereka
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      if (token.username === 'admin') {
        return NextResponse.redirect(new URL("/records", req.url));
      }
      return NextResponse.redirect(new URL("/assessment", req.url));
    }

    // Jika user adalah admin dan mencoba mengakses rute non-admin (seperti assessment)
    if (token?.username === 'admin' && pathname.startsWith('/assessment')) {
      return NextResponse.redirect(new URL('/records', req.url));
    }

    // Jika user biasa mencoba mengakses rute admin (jika ada)
    if (token?.username !== 'admin' && pathname.startsWith('/admin')) { // Ganti '/admin' jika perlu
        return NextResponse.redirect(new URL('/assessment', req.url));
    }
  },
  {
    callbacks: {
      // Callback 'authorized' akan berjalan sebelum 'middleware'.
      // Jika mengembalikan false, middleware tidak akan pernah dijalankan.
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Izinkan akses ke halaman login dan signup bahkan jika belum terotentikasi
        if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
            return true;
        }
        // Untuk halaman lain, user harus punya token (sudah login)
        return !!token;
      },
    },
  }
);

export const config = {
  // Lindungi semua rute kecuali rute statis dan API tertentu
  matcher: [
    "/assessment/:path*",
    "/records/:path*",
    "/login",
    "/signup",
    // Tambahkan rute admin lain jika ada
  ],
};