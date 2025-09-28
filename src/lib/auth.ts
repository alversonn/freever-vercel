import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Phone/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { identifier, password } = credentials as Record<string, string>;
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }, { username: identifier }],
          },
        });
        if (!user) return null;

        const ok = await compare(password, user.hashedPassword);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email ?? undefined, username: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Hormati URL relatif seperti "/login" atau "/assessment"
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Izinkan URL yang sama origin
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {}
      // Default fallback (mis. setelah login tanpa spesifik URL)
      return `${baseUrl}/assessment`;
    },
  },
};
