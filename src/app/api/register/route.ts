// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Helpers ---------- */
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
function pickFirstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v;
  }
  return undefined;
}
/** Baca body baik JSON maupun FormData */
async function readBody(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json();
    return isRecord(j) ? j : {};
  }
  if (ct.includes("form")) {
    const fd = await req.formData();
    const out: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      out[k] = typeof v === "string" ? v : v.name; // file tidak dipakai di sini
    });
    return out;
  }
  // fallback coba JSON
  try {
    const j = await req.json();
    return isRecord(j) ? j : {};
  } catch {
    return {};
  }
}

/* ---------- Handler ---------- */
export async function POST(req: Request) {
  try {
    const body = await readBody(req);
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Wajib (tanpa aturan panjang/karakter khusus)
    const name = mustNonEmptyString(body.name, "Name");
    const username = mustNonEmptyString(body.username ?? body.userName ?? body.uname, "Username");

    // Email atau Phone (salah satu wajib)
    const epRaw = body.emailOrPhone ?? body.email ?? body.phone ?? body.identifier;
    if (typeof epRaw !== "string" || epRaw.trim() === "") {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }
    const ep = epRaw.trim();
    const isEmail = ep.includes("@");
    const email = isEmail ? ep.toLowerCase() : null;
    const phone = isEmail ? null : ep;

    // Birth place & Institution wajib
    const birthPlace = mustNonEmptyString(
      body.birthPlace ?? body.birth_place ?? body.placeOfBirth,
      "Birth place"
    );
    const institution = mustNonEmptyString(
      body.institution ?? body.org ?? body.organization,
      "Institution"
    );

    // Tanggal lahir & gender
    const dateOfBirth = parseDateLoose(body.dateOfBirth ?? body.dob, "Date of birth");
    const gender = normalizeGender(body.gender);

    // Password bebas (boleh kosong) tapi HARUS sama dengan konfirmasi (alias ditangani)
    const password = pickFirstString(body, ["password", "pass", "pwd"]) ?? "";
    const confirmPassword =
      pickFirstString(body, [
        "confirmPassword",
        "passwordConfirm",
        "password_confirmation",
        "confirm_password",
        "confirm",
        "password2",
      ]) ?? undefined;

    if (confirmPassword === undefined) {
      return NextResponse.json({ error: "Confirm password is required" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // Cek unik username/email/phone
    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Username, email, or phone already in use" },
        { status: 409 }
      );
    }

    // Hash password (string kosong juga boleh)
    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        username,
        email: email ?? undefined,
        phone: phone ?? undefined,
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
