// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Deklarasikan variabel global untuk menyimpan instance prisma
declare global {
  var prisma: PrismaClient | undefined
}

// Buat satu instance PrismaClient. 
// Di lingkungan pengembangan, kita menyimpannya di variabel global 
// agar tidak dibuat ulang setiap kali ada hot-reload.
const client = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.prisma = client

export default client