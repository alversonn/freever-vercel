import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ========= Helpers (tanpa any) ========= */
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
/** number|null|undefined → untuk field nullable opsional (crpLevel) */
function toNullableNumber(v: unknown): number | null | undefined {
  if (v === undefined) return undefined; // property di-skip
  if (v === null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  throw new Error("Invalid number");
}
/** optional boolean/float (kalau invalid, di-skip) */
function optBool(v: unknown): boolean | undefined {
  try {
    return v === undefined ? undefined : mustBool(v, "bool");
  } catch {
    return undefined;
  }
}
function optFloat(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isNaN(n) ? undefined : n;
}

/** ========= Handlers ========= */

/** GET /api/patients */
export async function GET() {
  try {
    const records = await prisma.patientRecord.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API GET ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/patients */
export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as unknown;
    if (!isRecord(raw)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ===== REQUIRED (harus cocok dengan schema kamu) =====
    const name = mustString(raw.name, "name");
    const age = mustInt(raw.age, "age"); // non-nullable
    const gender = mustString(raw.gender, "gender");
    const dateOfBirth = mustDate(raw.dateOfBirth, "dateOfBirth");

    const pulseWeak = mustBool(raw.pulseWeak, "pulseWeak");
    const consciousnessPoor = mustBool(raw.consciousnessPoor, "consciousnessPoor");
    const oxygenSaturation = mustFloat(raw.oxygenSaturation, "oxygenSaturation");
    const leukocyteCount = mustFloat(raw.leukocyteCount, "leukocyteCount");
    const neutrophilCount = mustFloat(raw.neutrophilCount, "neutrophilCount");
    const lymphocyteCount = mustFloat(raw.lymphocyteCount, "lymphocyteCount");
    const feverDuration = mustInt(raw.feverDuration, "feverDuration");
    const nlcrResult = mustFloat(raw.nlcrResult, "nlcrResult");

    const diagnosis = mustString(raw.diagnosis, "diagnosis");
    const recommendation = mustString(raw.recommendation, "recommendation");

    // ===== OPTIONAL =====
    const crp = toNullableNumber(raw.crpLevel); // number | null | undefined
    const nausea = optBool(raw.nausea);
    const vomiting = optBool(raw.vomiting);
    const lossOfAppetite = optBool(raw.lossOfAppetite);
    const severeBleeding = optBool(raw.severeBleeding);
    const respiratoryProblems = optBool(raw.respiratoryProblems);
    const seizure = optBool(raw.seizure);
    const severeDehydration = optBool(raw.severeDehydration);
    const shockSign = optBool(raw.shockSign);

    const sensitivity = optFloat(raw.sensitivity);   // default(0) → boleh omit
    const specificity = optFloat(raw.specificity);   // default(0) → boleh omit

    // objek data final — pakai const (fix prefer-const)
    const data = {
      name,
      age,
      gender,
      dateOfBirth,
      pulseWeak,
      consciousnessPoor,
      oxygenSaturation,
      leukocyteCount,
      neutrophilCount,
      lymphocyteCount,
      feverDuration,
      nlcrResult,
      diagnosis,
      recommendation,
      // set opsional hanya bila ada → tidak pernah kirim `undefined`
      ...(crp !== undefined ? { crpLevel: crp } : {}),
      ...(nausea !== undefined ? { nausea } : {}),
      ...(vomiting !== undefined ? { vomiting } : {}),
      ...(lossOfAppetite !== undefined ? { lossOfAppetite } : {}),
      ...(severeBleeding !== undefined ? { severeBleeding } : {}),
      ...(respiratoryProblems !== undefined ? { respiratoryProblems } : {}),
      ...(seizure !== undefined ? { seizure } : {}),
      ...(severeDehydration !== undefined ? { severeDehydration } : {}),
      ...(shockSign !== undefined ? { shockSign } : {}),
      ...(sensitivity !== undefined ? { sensitivity } : {}),
      ...(specificity !== undefined ? { specificity } : {}),
    } satisfies Parameters<typeof prisma.patientRecord.create>[0]["data"];

    const created = await prisma.patientRecord.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("API POST ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
