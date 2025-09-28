import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function mustString(v: unknown, name: string): string {
  if (typeof v === "string" && v.trim() !== "") return v;
  throw new Error(`Invalid or missing "${name}"`);
}
function mustInt(v: unknown, name: string): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (Number.isInteger(n)) return n;
  throw new Error(`Invalid integer "${name}"`);
}
function mustFloat(v: unknown, name: string): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isNaN(n)) return n;
  throw new Error(`Invalid number "${name}"`);
}
function mustBool(v: unknown, name: string): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
  }
  throw new Error(`Invalid boolean "${name}"`);
}
function mustDate(v: unknown, name: string): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error(`Invalid date "${name}"`);
}
function toNullableNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? undefined : n;
}
function optBool(v: unknown): boolean | undefined {
  try {
    if (v === undefined) return undefined;
    return mustBool(v, "bool");
  } catch {
    return undefined;
  }
}
function optFloat(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? undefined : n;
}

/** GET /api/patients (login required) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    
    // --- LOGIKA ADMIN UNTUK MELIHAT SEMUA DATA ---
    if (user.username === "admin") {
      const records = await prisma.patientRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(records);
    }
    // ---------------------------------------------

    // Logika untuk user biasa (hanya melihat data sendiri)
    const records = await prisma.patientRecord.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("API GET RECORDS ERROR:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/patients (login required) */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Hapus data yang tidak relevan dengan skema PatientRecord
    delete body.userId; 

    const createdRecord = await prisma.patientRecord.create({
      data: {
        ...body,
        // --- PERBAIKAN UTAMA DI SINI ---
        // Hubungkan record ini ke user yang sedang login
        // menggunakan 'connect' berdasarkan 'id' user.
        author: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return NextResponse.json(createdRecord, { status: 201 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API POST ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
