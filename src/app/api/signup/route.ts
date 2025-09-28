// src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ===== Helpers sederhana (tanpa aturan rumit) ===== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function mustNonEmptyString(v: unknown, name: string): string {
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  throw new Error(`${name} is required`);
}
function parseDateLoose(v: unknown, name: string): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error(`${name} is invalid`);
}
function normalizeGender(v: unknown): "Male" | "Female" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (["male", "m"].includes(s)) return "Male";
  if (["female", "f"].includes(s)) return "Female";
  throw new Error("Gender is required");
}

/** ===== Handler ===== */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Semua REQUIRED sesuai permintaan:
    const name         = mustNonEmptyString(body.name, "Name");
    const username     = mustNonEmptyString(body.username, "Username");
    const email        = mustNonEmptyString(body.email, "Email");       // wajib
    const phone        = mustNonEmptyString(body.phone, "Phone");       // wajib
    const birthPlace   = mustNonEmptyString(body.birthPlace, "Birth place");
    const institution  = mustNonEmptyString(body.institution, "Institution");
    const dateOfBirth  = parseDateLoose(body.dateOfBirth, "Date of birth");
    const gender       = normalizeGender(body.gender);

    // Password WAJIB, tanpa aturan khusus (nggak perlu angka/simbol, dsb)
    const password         = mustNonEmptyString(body.password, "Password");
    const confirmPassword  = mustNonEmptyString(body.confirmPassword, "Confirm password");
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // Cek unik (username/email/phone)
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: email.toLowerCase() }, { phone }],
      },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Username, email, or phone already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        username,
        email: email.toLowerCase(),
        phone,
        birthPlace,
        dateOfBirth,
        gender,
        institution,
        hashedPassword,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Account created. Please sign in." },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to register user";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
