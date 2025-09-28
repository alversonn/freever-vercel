// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Phone/Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const identifier = String(credentials.identifier ?? "").trim();
        const password = String(credentials.password ?? "");

        if (!identifier) return null;

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

        // tambahkan username ke object user agar bisa dipakai di token/session
        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          username: user.username,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore custom
        token.uid = (user as any).id;
        // @ts-ignore custom
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore custom
        session.user.id = token.uid as string;
        // @ts-ignore custom
        session.user.username = (token as any).username as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
