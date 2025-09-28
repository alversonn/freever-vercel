// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

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

        // --- LOGIKA KHUSUS ADMIN ---
        if (identifier === 'admin' && password === 'admin') {
          // Kembalikan objek user "palsu" untuk admin tanpa perlu cek database
          // ID sengaja dibuat unik agar tidak bentrok dengan ID dari database (cuid)
          return { id: 'admin-user-01', name: 'Administrator', username: 'admin' };
        }
        // --- AKHIR LOGIKA ADMIN ---

        // Logika untuk user biasa dari database
        if (!identifier || !password) return null;
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }, { username: identifier }],
          },
        });
        if (!user || !user.hashedPassword) return null;

        const isPasswordCorrect = await compare(password, user.hashedPassword);
        if (!isPasswordCorrect) return null;

        return { id: user.id, name: user.name, email: user.email ?? undefined, username: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = token.username as string;
      }
      return session;
    },
  },
};