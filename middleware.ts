// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Jika user sudah login dan mencoba mengakses halaman login/signup/utama, arahkan
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/')) {
      if (token.username === 'admin') {
        return NextResponse.redirect(new URL("/records", req.url));
      }
      return NextResponse.redirect(new URL("/assessment", req.url));
    }
    const response = NextResponse.next();
    // Atur header untuk mencegah browser menyimpan cache halaman ini
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // User harus login untuk mengakses halaman yang dilindungi
    },
  }
);

export const config = {
  matcher: [
    "/records/:path*",
    "/assessment/:path*",
    "/", // Lindungi halaman utama agar bisa redirect
  ], 
};