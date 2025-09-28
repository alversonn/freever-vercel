// src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// helper ringkas
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function reqStr(v: unknown, name: string): string {
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  throw new Error(`${name} is required`);
}
function parseDOB(v: unknown): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error("Invalid dateOfBirth");
}
function genderNormalize(v: unknown): "Male" | "Female" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "male" || s === "m") return "Male";
  if (s === "female" || s === "f") return "Female";
  throw new Error("Gender is required");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // SEMUA WAJIB (email & phone dua2nya wajib, password bebas aturannya tapi WAJIB diisi)
    const name = reqStr(body.name, "Name");
    const username = reqStr(body.username, "Username");
    const email = reqStr(body.email, "Email").toLowerCase();
    const phone = reqStr(body.phone, "Phone");
    const birthPlace = reqStr(body.birthPlace, "Birth place");
    const institution = reqStr(body.institution, "Institution");
    const dateOfBirth = parseDOB(body.dateOfBirth);
    const gender = genderNormalize(body.gender);
    const password = reqStr(body.password, "Password");
    const confirmPassword = reqStr(body.confirmPassword, "Confirm password");
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // cek unik
    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }, { phone }],
      },
      select: { id: true },
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
        email,
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
    const msg = err instanceof Error ? err.message : "Failed to sign up";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
