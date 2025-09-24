import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========= Helpers ========= */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function parseId(idParam: string): number | null {
  const n = Number(idParam);
  return Number.isInteger(n) && n > 0 ? n : null;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
  }
  return undefined;
}
function int(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : undefined;
}
function floatNum(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? undefined : n;
}
function dateVal(v: unknown): Date | undefined {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}
function nullableFloat(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? undefined : n;
}

/* ========= Handlers ========= */

/** GET /api/patients/:id */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = parseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const record = await prisma.patientRecord.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    return NextResponse.json(record);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API GET(SINGLE) ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** PUT /api/patients/:id */
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = parseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const raw = (await req.json()) as unknown;
    if (!isRecord(raw)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // Konstruksi data update hanya untuk field yang ada & valid
    const base: Record<string, unknown> = {};

    // --- Nama: dukung alias 'patientName'
    const name =
      str(raw.name) ??
      ("patientName" in raw ? str((raw as Record<string, unknown>).patientName) : undefined);
    if (name !== undefined) base.name = name;

    // --- Gender
    const gender = str(raw.gender);
    if (gender !== undefined) base.gender = gender;

    // --- Age (non-nullable): set hanya jika ada angka valid
    const age = int(raw.age);
    if (age !== undefined) base.age = age;

    // --- Tanggal lahir: dukung alias 'dob'
    const dateOfBirth =
      dateVal(raw.dateOfBirth) ??
      ("dob" in raw ? dateVal((raw as Record<string, unknown>).dob) : undefined);
    if (dateOfBirth !== undefined) base.dateOfBirth = dateOfBirth;

    // --- Klinis
    const pulseWeak = bool(raw.pulseWeak);
    if (pulseWeak !== undefined) base.pulseWeak = pulseWeak;

    const consciousnessPoor = bool(raw.consciousnessPoor);
    if (consciousnessPoor !== undefined) base.consciousnessPoor = consciousnessPoor;

    const oxygenSaturation = floatNum(raw.oxygenSaturation);
    if (oxygenSaturation !== undefined) base.oxygenSaturation = oxygenSaturation;

    const leukocyteCount = floatNum(raw.leukocyteCount);
    if (leukocyteCount !== undefined) base.leukocyteCount = leukocyteCount;

    const neutrophilCount = floatNum(raw.neutrophilCount);
    if (neutrophilCount !== undefined) base.neutrophilCount = neutrophilCount;

    const lymphocyteCount = floatNum(raw.lymphocyteCount);
    if (lymphocyteCount !== undefined) base.lymphocyteCount = lymphocyteCount;

    const crpLevel = nullableFloat(raw.crpLevel); // opsional/nullable (Float?)
    if (crpLevel !== undefined) base.crpLevel = crpLevel;

    const feverDuration = int(raw.feverDuration);
    if (feverDuration !== undefined) base.feverDuration = feverDuration;

    const nlcrResult = floatNum(raw.nlcrResult);
    if (nlcrResult !== undefined) base.nlcrResult = nlcrResult;

    // --- Gejala tambahan (boolean)
    const nausea = bool(raw.nausea);
    if (nausea !== undefined) base.nausea = nausea;

    const vomiting = bool(raw.vomiting);
    if (vomiting !== undefined) base.vomiting = vomiting;

    const lossOfAppetite = bool(raw.lossOfAppetite);
    if (lossOfAppetite !== undefined) base.lossOfAppetite = lossOfAppetite;

    const severeBleeding = bool(raw.severeBleeding);
    if (severeBleeding !== undefined) base.severeBleeding = severeBleeding;

    const respiratoryProblems = bool(raw.respiratoryProblems);
    if (respiratoryProblems !== undefined) base.respiratoryProblems = respiratoryProblems;

    const seizure = bool(raw.seizure);
    if (seizure !== undefined) base.seizure = seizure;

    const severeDehydration = bool(raw.severeDehydration);
    if (severeDehydration !== undefined) base.severeDehydration = severeDehydration;

    const shockSign = bool(raw.shockSign);
    if (shockSign !== undefined) base.shockSign = shockSign;

    // --- Diagnosa & rekomendasi
    const diagnosis = str(raw.diagnosis);
    if (diagnosis !== undefined) base.diagnosis = diagnosis;

    const recommendation = str(raw.recommendation);
    if (recommendation !== undefined) base.recommendation = recommendation;

    // --- Metrics (float opsional)
    const sensitivity = floatNum(raw.sensitivity);
    if (sensitivity !== undefined) base.sensitivity = sensitivity;

    const specificity = floatNum(raw.specificity);
    if (specificity !== undefined) base.specificity = specificity;

    // Final typed object
    const data = base as Parameters<typeof prisma.patientRecord.update>[0]["data"];

    const updated = await prisma.patientRecord.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API PUT ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/patients/:id */
export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = parseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await prisma.patientRecord.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API DELETE ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
