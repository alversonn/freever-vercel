import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Phone/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds) return null;
        const { identifier, password } = creds as any;
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phone: identifier },
              { username: identifier },
            ],
          },
        });
        if (!user) return null;

        const ok = await compare(password, user.hashedPassword);
        if (!ok) return null;

        // return field minimal + id
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          username: user.username,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login", // kalau error 500/401 → balik ke /login
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        (token as any).username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).username = (token as any).username;
      }
      return session;
    },
  },
};
