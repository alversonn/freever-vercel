import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("__Secure-next-auth.session-token")?.value ??
    req.cookies.get("next-auth.session-token")?.value;

  const { pathname } = req.nextUrl;
  const protectedPath =
    pathname.startsWith("/assessment") || pathname.startsWith("/records");

  if (protectedPath && !token) {
    const loginUrl = new URL("/login", req.url);
    // optional: bawa info from=
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // tambah header no-cache untuk halaman protected
  if (protectedPath) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/assessment/:path*", "/records/:path*"],
};
