// src/app/(dashboard)/records/[id]/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Trash2, Edit, X, ChevronLeft, Printer } from "lucide-react";

// Jika tidak pakai shadcn, ganti impor2 ini dengan elemen HTML biasa.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* ===== Types ===== */

interface PatientRecord {
  id: number;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string; // ISO string
  pulseWeak: boolean;
  consciousnessPoor: boolean;
  oxygenSaturation: number;
  leukocyteCount: number;
  neutrophilCount: number;
  lymphocyteCount: number;
  crpLevel: number | null; // optional
  feverDuration: number;
  nlcrResult: number;
  // warning signs (boolean columns exist di schema)
  nausea: boolean;
  vomiting: boolean;
  lossOfAppetite: boolean;
  severeBleeding: boolean;
  respiratoryProblems: boolean;
  seizure: boolean;
  severeDehydration: boolean;
  shockSign: boolean;

  diagnosis: string;
  recommendation: string;
  sensitivity: number;
  specificity: number;

  createdAt: string;
}

type WarningKey =
  | "nausea"
  | "vomiting"
  | "lossOfAppetite"
  | "severeBleeding"
  | "respiratoryProblems"
  | "seizure"
  | "severeDehydration"
  | "shockSign";

const WARNING_KEYS: WarningKey[] = [
  "nausea",
  "vomiting",
  "lossOfAppetite",
  "severeBleeding",
  "respiratoryProblems",
  "seizure",
  "severeDehydration",
  "shockSign",
];

// Nilai form kita simpan sebagai string utk field number agar mudah kontrol input.
// Boolean tetap boolean.
interface FormValues {
  name: string;
  gender: "Male" | "Female";
  dateOfBirth: string; // yyyy-mm-dd (wajib)

  age: string; // read-only, dihitung dari DOB

  pulseWeak: boolean;
  consciousnessPoor: boolean;

  oxygenSaturation: string;
  leukocyteCount: string;
  neutrophilCount: string;
  lymphocyteCount: string;
  crpLevel: string; // "" artinya null
  feverDuration: string;
  nlcrResult: string; // dihitung di logic

  // warning signs
  nausea: boolean;
  vomiting: boolean;
  lossOfAppetite: boolean;
  severeBleeding: boolean;
  respiratoryProblems: boolean;
  seizure: boolean;
  severeDehydration: boolean;
  shockSign: boolean;

  diagnosis: string;
  recommendation: string;

  sensitivity: string;
  specificity: string;
}

/* ===== Helpers ===== */

function toNumber(s: string, fallback = 0): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(s: string): number | null {
  if (s === "" || s === undefined) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isoToYmd(iso: string): string {
  // "2025-09-19T00:00:00.000Z" -> "2025-09-19"
  return iso.slice(0, 10);
}

function calcAgeFromYmd(ymd: string): number {
  const d = new Date(ymd);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age < 0 ? 0 : age;
}

/** logika diagnosis seperti acuan:
 *  - Emergency jika: pulseWeak || consciousnessPoor || oxygen <= 94 || ada warning sign
 *  - Jika emergency: diagnosis "Emergency Referral", recommendation hospital, nolkan lab & nlcr, crp 0, feverDuration 0
 *  - Jika tidak emergency:
 *      nlcr = neutrophil/lymphocyte (jika lymphocyte != 0)
 *      Jika leukocyte > 10000 atau nlcr > 3.53 atau crp > 40 -> "Bacterial Infection"
 *      else "Viral Infection"
 */
function applyDiagnosisLogic(payload: {
  pulseWeak: boolean;
  consciousnessPoor: boolean;
  oxygenSaturation: number;
  leukocyteCount: number;
  neutrophilCount: number;
  lymphocyteCount: number;
  crpLevel: number | null;
  feverDuration: number;
  nlcrResult: number;
  warning: Record<WarningKey, boolean>;
  diagnosis: string;
  recommendation: string;
}): {
  diagnosis: string;
  recommendation: string;
  leukocyteCount: number;
  neutrophilCount: number;
  lymphocyteCount: number;
  crpLevel: number | null;
  feverDuration: number;
  nlcrResult: number;
} {
  const hasWarning = Object.values(payload.warning).some(Boolean);
  const emergency =
    payload.pulseWeak ||
    payload.consciousnessPoor ||
    payload.oxygenSaturation <= 94 ||
    hasWarning;

  if (emergency) {
    return {
      diagnosis: "Emergency Referral",
      recommendation: "Patient shows signs requiring immediate hospital care.",
      leukocyteCount: 0,
      neutrophilCount: 0,
      lymphocyteCount: 0,
      crpLevel: 0,
      feverDuration: 0,
      nlcrResult: 0,
    };
  }

  let nlcr = 0;
  if (payload.lymphocyteCount !== 0) {
    nlcr = Number((payload.neutrophilCount / payload.lymphocyteCount).toFixed(2));
  }

  const crp = payload.crpLevel ?? 0;
  const leuk = payload.leukocyteCount;

  if (leuk > 10000 || nlcr > 3.53 || crp > 40) {
    return {
      diagnosis: "Bacterial Infection",
      recommendation:
        "Consider antibiotic treatment with appropriate dosage based on patient weight and condition.",
      leukocyteCount: leuk,
      neutrophilCount: payload.neutrophilCount,
      lymphocyteCount: payload.lymphocyteCount,
      crpLevel: payload.crpLevel,
      feverDuration: payload.feverDuration,
      nlcrResult: nlcr,
    };
  }

  return {
    diagnosis: "Viral Infection",
    recommendation:
      "Recommend symptomatic treatment (paracetamol, etc.) and supplements. Avoid antibiotics.",
    leukocyteCount: leuk,
    neutrophilCount: payload.neutrophilCount,
    lymphocyteCount: payload.lymphocyteCount,
    crpLevel: payload.crpLevel,
    feverDuration: payload.feverDuration,
    nlcrResult: nlcr,
  };
}

/* ===== Page ===== */

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idNum = Number(params.id);

  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [form, setForm] = useState<FormValues | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  // fetch detail
  useEffect(() => {
    if (!Number.isInteger(idNum) || idNum <= 0) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patients/${idNum}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch record");
        const data = (await res.json()) as PatientRecord;
        setRecord(data);

        const ymd = isoToYmd(data.dateOfBirth);
        setForm({
          name: data.name,
          gender: data.gender === "Female" ? "Female" : "Male",
          dateOfBirth: ymd,
          age: String(calcAgeFromYmd(ymd)),

          pulseWeak: data.pulseWeak,
          consciousnessPoor: data.consciousnessPoor,

          oxygenSaturation: String(data.oxygenSaturation),
          leukocyteCount: String(data.leukocyteCount),
          neutrophilCount: String(data.neutrophilCount),
          lymphocyteCount: String(data.lymphocyteCount),
          crpLevel: data.crpLevel === null ? "" : String(data.crpLevel),
          feverDuration: String(data.feverDuration),
          nlcrResult: String(data.nlcrResult),

          nausea: data.nausea,
          vomiting: data.vomiting,
          lossOfAppetite: data.lossOfAppetite,
          severeBleeding: data.severeBleeding,
          respiratoryProblems: data.respiratoryProblems,
          seizure: data.seizure,
          severeDehydration: data.severeDehydration,
          shockSign: data.shockSign,

          diagnosis: data.diagnosis,
          recommendation: data.recommendation,
          sensitivity: String(data.sensitivity),
          specificity: String(data.specificity),
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [idNum]);

  // auto-hitung age saat DOB diubah
  useEffect(() => {
    if (!form) return;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            age: String(calcAgeFromYmd(prev.dateOfBirth)),
          }
        : prev
    );
  }, [form?.dateOfBirth]);

  const hasAnyWarningSign = useMemo(
    () => (form ? WARNING_KEYS.some((k) => form[k]) : false),
    [form]
  );

  const isEmergencyCase = useMemo(() => {
    if (!form) return false;
    const o2 = toNumber(form.oxygenSaturation, 0);
    return form.pulseWeak || form.consciousnessPoor || o2 <= 94 || hasAnyWarningSign;
  }, [form, hasAnyWarningSign]);

  const setField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((s) => (s ? { ...s, [key]: value } : s));
  }, []);

  async function handleDelete() {
    if (!record) return;
    if (!confirm("Are you sure you want to delete this record permanently?")) return;
    const res = await fetch(`/api/patients/${record.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete record.");
      return;
    }
    router.push("/records");
  }

  async function handleSave() {
    if (!form || !record) return;

    // bentuk payload sesuai API
    const basePayload = {
      name: form.name.trim(),
      age: calcAgeFromYmd(form.dateOfBirth), // auto dari DOB
      gender: form.gender,
      dateOfBirth: new Date(form.dateOfBirth),

      pulseWeak: form.pulseWeak,
      consciousnessPoor: form.consciousnessPoor,

      oxygenSaturation: toNumber(form.oxygenSaturation, 0),
      leukocyteCount: toNumber(form.leukocyteCount, 0),
      neutrophilCount: toNumber(form.neutrophilCount, 0),
      lymphocyteCount: toNumber(form.lymphocyteCount, 0),
      crpLevel: toNullableNumber(form.crpLevel),
      feverDuration: toNumber(form.feverDuration, 0),
      nlcrResult: toNumber(form.nlcrResult, 0),

      // warning signs
      nausea: form.nausea,
      vomiting: form.vomiting,
      lossOfAppetite: form.lossOfAppetite,
      severeBleeding: form.severeBleeding,
      respiratoryProblems: form.respiratoryProblems,
      seizure: form.seizure,
      severeDehydration: form.severeDehydration,
      shockSign: form.shockSign,

      diagnosis: form.diagnosis.trim(),
      recommendation: form.recommendation.trim(),

      sensitivity: toNumber(form.sensitivity, 0),
      specificity: toNumber(form.specificity, 0),
    };

    // terapkan aturan diagnosis
    const diag = applyDiagnosisLogic({
      pulseWeak: basePayload.pulseWeak,
      consciousnessPoor: basePayload.consciousnessPoor,
      oxygenSaturation: basePayload.oxygenSaturation,
      leukocyteCount: basePayload.leukocyteCount,
      neutrophilCount: basePayload.neutrophilCount,
      lymphocyteCount: basePayload.lymphocyteCount,
      crpLevel: basePayload.crpLevel,
      feverDuration: basePayload.feverDuration,
      nlcrResult: basePayload.nlcrResult,
      warning: {
        nausea: basePayload.nausea,
        vomiting: basePayload.vomiting,
        lossOfAppetite: basePayload.lossOfAppetite,
        severeBleeding: basePayload.severeBleeding,
        respiratoryProblems: basePayload.respiratoryProblems,
        seizure: basePayload.seizure,
        severeDehydration: basePayload.severeDehydration,
        shockSign: basePayload.shockSign,
      },
      diagnosis: basePayload.diagnosis,
      recommendation: basePayload.recommendation,
    });

    const payload = {
      ...basePayload,
      diagnosis: diag.diagnosis,
      recommendation: diag.recommendation,
      leukocyteCount: diag.leukocyteCount,
      neutrophilCount: diag.neutrophilCount,
      lymphocyteCount: diag.lymphocyteCount,
      crpLevel: diag.crpLevel,
      feverDuration: diag.feverDuration,
      nlcrResult: diag.nlcrResult,
    };

    startTransition(async () => {
      const res = await fetch(`/api/patients/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Failed to update record: ${j.error ?? res.statusText}`);
        return;
      }
      const updated = (await res.json()) as PatientRecord;
      setRecord(updated);
      // sinkronkan form kembali ke data server
      const ymd = isoToYmd(updated.dateOfBirth);
      setForm({
        ...form,
        age: String(calcAgeFromYmd(ymd)),
        dateOfBirth: ymd,
        diagnosis: updated.diagnosis,
        recommendation: updated.recommendation,
        nlcrResult: String(updated.nlcrResult),
      });
      setIsEditing(false);
      router.refresh();
    });
  }

  if (loading) return <p>Loading record...</p>;
  if (!record || !form) return <p>Record not found.</p>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/records" className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Records
        </Link>
        <div className="flex gap-2">
        <Button onClick={() => window.print()} size="sm" variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm" disabled={pending}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
              <Button onClick={() => setIsEditing(false)} size="sm" variant="outline" disabled={pending}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>
      <div id="print-area">
      <Card>
        <CardHeader>
          <CardTitle>Patient Record Details</CardTitle>
          <CardDescription>
            View and edit patient data for: {record.name} — Created:{" "}
            {new Date(record.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Info */}
          <section>
            <h3 className="mb-2 border-b pb-2 text-lg font-bold">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Patient Name"
                editing={isEditing}
                input={<Input value={form.name} onChange={(e) => setField("name", e.target.value)} />}
                display={record.name}
              />
              <Field
                label="Age"
                editing={false} // read-only
                input={null}
                display={form.age}
              />
              <Field
                label="Date of Birth"
                editing={isEditing}
                input={
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setField("dateOfBirth", e.target.value)}
                  />
                }
                display={new Date(record.dateOfBirth).toLocaleDateString()}
              />
              <div>
                <Label className="text-sm font-semibold">Gender</Label>
                {isEditing ? (
                  <div className="mt-2">
                    <RadioGroup
                      value={form.gender}
                      onValueChange={(v) => setField("gender", v as "Male" | "Female")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="Female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>
                ) : (
                  <p className="mt-1 rounded-md bg-gray-100 p-2">{record.gender}</p>
                )}
              </div>
            </div>
          </section>

          {/* Clinical Assessment */}
          <section>
            <h3 className="mb-2 border-b pb-2 text-lg font-bold">Clinical Assessment</h3>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <YesNo
                label="Weak Pulse?"
                value={form.pulseWeak}
                onChange={(v) => setField("pulseWeak", v)}
                editing={isEditing}
              />
              <YesNo
                label="Poor Consciousness?"
                value={form.consciousnessPoor}
                onChange={(v) => setField("consciousnessPoor", v)}
                editing={isEditing}
              />
              <Field
                label="Oxygen Saturation (%)"
                editing={isEditing}
                input={
                  <Input
                    type="number"
                    value={form.oxygenSaturation}
                    onChange={(e) => setField("oxygenSaturation", e.target.value)}
                  />
                }
                display={String(record.oxygenSaturation)}
              />
            </div>

            <div className="mb-6 space-y-2">
              <Label className="text-sm font-semibold text-red-600">Warning Signs</Label>
              {isEditing ? (
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
                  {WARNING_KEYS.map((k) => (
                    <label key={k} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form[k]}
                        onChange={(e) => setField(k, e.target.checked)}
                      />
                      <span className="capitalize">
                        {k === "lossOfAppetite"
                          ? "Loss of Appetite"
                          : k === "severeBleeding"
                          ? "Severe Bleeding"
                          : k === "respiratoryProblems"
                          ? "Resp. Problems"
                          : k === "severeDehydration"
                          ? "Dehydration"
                          : k === "shockSign"
                          ? "Shock Sign"
                          : k}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-1 rounded-md bg-gray-100 p-2 text-sm">
                  {WARNING_KEYS.some((k) => record[k])
                    ? "Warning signs present."
                    : "No warning signs were recorded for this diagnosis."}
                </p>
              )}
            </div>

            <fieldset className="disabled:cursor-not-allowed disabled:opacity-50">
              <h4 className="mb-2 font-semibold text-gray-800">Blood Test Results</h4>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Field
                  label="Leukocyte"
                  editing={isEditing}
                  input={
                    <Input
                      type="number"
                      value={form.leukocyteCount}
                      onChange={(e) => setField("leukocyteCount", e.target.value)}
                    />
                  }
                  display={String(record.leukocyteCount)}
                />
                <Field
                  label="Neutrophil"
                  editing={isEditing}
                  input={
                    <Input
                      type="number"
                      value={form.neutrophilCount}
                      onChange={(e) => setField("neutrophilCount", e.target.value)}
                    />
                  }
                  display={String(record.neutrophilCount)}
                />
                <Field
                  label="Lymphocyte"
                  editing={isEditing}
                  input={
                    <Input
                      type="number"
                      value={form.lymphocyteCount}
                      onChange={(e) => setField("lymphocyteCount", e.target.value)}
                    />
                  }
                  display={String(record.lymphocyteCount)}
                />
                <Field
                  label="NLCR"
                  editing={false}
                  input={null}
                  display={form.nlcrResult}
                />
                <Field
                  label="CRP Level"
                  editing={isEditing}
                  input={
                    <Input
                      type="number"
                      value={form.crpLevel}
                      onChange={(e) => setField("crpLevel", e.target.value)}
                      placeholder="leave empty if unknown"
                    />
                  }
                  display={record.crpLevel === null ? "—" : String(record.crpLevel)}
                />
                <Field
                  label="Fever Duration (days)"
                  editing={isEditing}
                  input={
                    <Input
                      type="number"
                      value={form.feverDuration}
                      onChange={(e) => setField("feverDuration", e.target.value)}
                    />
                  }
                  display={String(record.feverDuration)}
                />
              </div>
            </fieldset>
          </section>

          {/* Diagnosis */}
          <section>
            <h3 className="mb-2 border-b pb-2 text-lg font-bold">Diagnosis & Recommendation</h3>
            <div className={`rounded-lg p-4 ${record.diagnosis === "Emergency Referral" ? "bg-red-100" : "bg-blue-100"}`}>
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold">Diagnosis</Label>
                    <Input value={form.diagnosis} onChange={(e) => setField("diagnosis", e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Recommendation</Label>
                    <Textarea value={form.recommendation} onChange={(e) => setField("recommendation", e.target.value)} />
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-bold">Diagnosis: {record.diagnosis}</h4>
                  <p>Recommendation: {record.recommendation}</p>
                </>
              )}
            </div>
          </section>

          <section className="border-t pt-4">
            <div className="flex justify-end">
              <Button onClick={handleDelete} variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete This Record
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

/* ===== Komponen kecil ===== */

function Field({
  label,
  editing,
  input,
  display,
}: {
  label: string;
  editing: boolean;
  input: React.ReactNode;
  display: string;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      {editing ? <div className="mt-1">{input}</div> : <p className="mt-1 min-h-[40px] rounded-md bg-gray-100 p-2">{display}</p>}
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
  editing,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  editing: boolean;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      {editing ? (
        <div className="mt-2">
          <RadioGroup value={value ? "yes" : "no"} onValueChange={(v) => onChange(v === "yes")} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id={`${label}-yes`} />
              <Label htmlFor={`${label}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id={`${label}-no`} />
              <Label htmlFor={`${label}-no`}>No</Label>
            </div>
          </RadioGroup>
        </div>
      ) : (
        <p className="mt-1 rounded-md bg-gray-100 p-2">{value ? "Yes" : "No"}</p>
      )}
    </div>
  );
}
