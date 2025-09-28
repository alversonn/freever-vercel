// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";        // <— WAJIB: biar bcrypt jalan
export const dynamic = "force-dynamic"; // <— jangan di-prerender

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
