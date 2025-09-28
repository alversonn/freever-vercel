import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function must(v: unknown, name: string): string {
  if (typeof v === "string" && v.trim() !== "") return v.trim();
  throw new Error(`${name} is required`);
}
function parseDate(v: unknown): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  throw new Error("Date of birth is invalid");
}
function parseGender(v: unknown): "Male" | "Female" {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s.startsWith("m")) return "Male";
  if (s.startsWith("f")) return "Female";
  throw new Error("Gender is required");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // Semua WAJIB, termasuk email & phone, dan password + confirmPassword
    const name = must(body.name, "Name");
    const username = must(body.username, "Username");
    const email = must(body.email, "Email");
    const phone = must(body.phone, "Phone");
    const birthPlace = must(body.birthPlace, "Birth place");
    const institution = must(body.institution, "Institution");
    const dateOfBirth = parseDate(body.dateOfBirth);
    const gender = parseGender(body.gender);
    const password = must(body.password, "Password");
    const confirmPassword = must(body.confirmPassword, "Confirm password");
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }, { phone }] },
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
        name, username, email, phone,
        birthPlace, institution, dateOfBirth, gender,
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
