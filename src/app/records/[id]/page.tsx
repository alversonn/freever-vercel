// src/app/records/[id]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // hindari cache, biar data fresh

type PageProps = {
  params: { id: string };
};

function formatDate(d: Date): string {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

export default async function RecordDetailPage({ params }: PageProps) {
  // validasi id
  const idNum = Number(params.id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    notFound();
  }

  // query langsung ke Prisma (Server Component)
  const record = await prisma.patientRecord.findUnique({ where: { id: idNum } });
  if (!record) {
    notFound();
  }

  // UI sederhana — silakan sesuaikan stylingnya
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patient Record #{record.id}</h1>
        <span className="text-sm text-gray-500">
          Created: {formatDate(record.createdAt)}
        </span>
      </header>

      {/* Data Diri */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Patient Info</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Name</div>
            <div className="font-medium">{record.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Age</div>
            <div className="font-medium">{record.age}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Gender</div>
            <div className="font-medium">{record.gender}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Date of Birth</div>
            <div className="font-medium">{formatDate(record.dateOfBirth)}</div>
          </div>
        </div>
      </section>

      {/* Data Klinis */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Clinical Data</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Metric label="Pulse Weak" value={record.pulseWeak ? "Yes" : "No"} />
          <Metric label="Consciousness Poor" value={record.consciousnessPoor ? "Yes" : "No"} />
          <Metric label="Oxygen Saturation" value={record.oxygenSaturation.toString()} />
          <Metric label="Leukocyte Count" value={record.leukocyteCount.toString()} />
          <Metric label="Neutrophil Count" value={record.neutrophilCount.toString()} />
          <Metric label="Lymphocyte Count" value={record.lymphocyteCount.toString()} />
          <Metric label="CRP Level" value={record.crpLevel === null ? "—" : record.crpLevel.toString()} />
          <Metric label="Fever Duration (days)" value={record.feverDuration.toString()} />
          <Metric label="NLCR Result" value={record.nlcrResult.toString()} />
        </div>
      </section>

      {/* Gejala Tambahan */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Additional Symptoms</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Badge label="Nausea" on={record.nausea} />
          <Badge label="Vomiting" on={record.vomiting} />
          <Badge label="Loss of Appetite" on={record.lossOfAppetite} />
          <Badge label="Severe Bleeding" on={record.severeBleeding} />
          <Badge label="Respiratory Problems" on={record.respiratoryProblems} />
          <Badge label="Seizure" on={record.seizure} />
          <Badge label="Severe Dehydration" on={record.severeDehydration} />
          <Badge label="Shock Sign" on={record.shockSign} />
        </div>
      </section>

      {/* Hasil & Rekomendasi */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">Diagnosis & Recommendation</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Diagnosis</div>
            <div className="font-medium">{record.diagnosis}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Recommendation</div>
            <div className="font-medium">{record.recommendation}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Sensitivity</div>
            <div className="font-medium">{record.sensitivity}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Specificity</div>
            <div className="font-medium">{record.specificity}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Sub-komponen kecil (tanpa any) */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Badge({ label, on }: { label: string; on: boolean }) {
  return (
    <div
      className={[
        "inline-flex items-center justify-center rounded-md px-2 py-1 text-sm",
        on ? "bg-green-100 text-green-700 border border-green-200"
           : "bg-gray-100 text-gray-600 border border-gray-200",
      ].join(" ")}
    >
      {label}: {on ? "Yes" : "No"}
    </div>
  );
}
