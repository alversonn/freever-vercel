// src/app/(dashboard)/records/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye, FileDown } from "lucide-react";
import Protected from "@/components/auth/Protected";
import { Button } from "@/components/ui/button";

import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/** ====== Types ====== */
interface PatientRecord {
  id: number;
  createdAt: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth?: string;

  pulseWeak?: boolean;
  consciousnessPoor?: boolean;
  oxygenSaturation?: number;

  leukocyteCount?: number;
  neutrophilCount?: number;
  lymphocyteCount?: number;
  crpLevel?: number | null;
  feverDuration?: number;
  nlcrResult?: number;

  nausea?: boolean;
  vomiting?: boolean;
  lossOfAppetite?: boolean;
  severeBleeding?: boolean;
  respiratoryProblems?: boolean;
  seizure?: boolean;
  severeDehydration?: boolean;
  shockSign?: boolean;

  diagnosis?: string;
  recommendation?: string;
  sensitivity?: number;
  specificity?: number;

  authorId?: string | null;
  userId?: string | null;
}

/** ====== Content ====== */
function RecordsContent() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data: PatientRecord[] = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isClient) fetchRecords();
  }, [isClient, fetchRecords]);

  /** ====== Delete ====== */
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchRecords();
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert("Error deleting record.");
    }
  };

  /** ====== Export CSV ====== */
  const handleExportCSV = () => {
    if (records.length === 0) return alert("No data to export.");
    const csv = Papa.unparse(records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "patient_records.csv");
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** ====== Export Excel ====== */
  const handleExportExcel = () => {
    if (records.length === 0) return alert("No data to export.");
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient Records");
    XLSX.writeFile(workbook, "patient_records.xlsx");
  };

  /** ====== Export PDF (VERTICAL / TRANSPOSE 1 record per page) ====== */
  const handleExportPDF = () => {
    if (records.length === 0) return alert("No data to export.");

    const ORDER: string[] = [
      "id",
      "createdAt",
      "name",
      "age",
      "gender",
      "dateOfBirth",
      "pulseWeak",
      "consciousnessPoor",
      "oxygenSaturation",
      "leukocyteCount",
      "neutrophilCount",
      "lymphocyteCount",
      "crpLevel",
      "feverDuration",
      "nlcrResult",
      "nausea",
      "vomiting",
      "lossOfAppetite",
      "severeBleeding",
      "respiratoryProblems",
      "seizure",
      "severeDehydration",
      "shockSign",
      "diagnosis",
      "recommendation",
      "sensitivity",
      "specificity",
      "authorId",
      "userId",
    ];

    const LABELS: Record<string, string> = {
      id: "ID",
      createdAt: "Created At",
      name: "Name",
      age: "Age",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      pulseWeak: "Weak pulse",
      consciousnessPoor: "Poor consciousness",
      oxygenSaturation: "Oxygen saturation (%)",
      leukocyteCount: "Leukocytes (cells/µL)",
      neutrophilCount: "Neutrophils (cells/µL)",
      lymphocyteCount: "Lymphocytes (cells/µL)",
      crpLevel: "CRP (mg/L)",
      feverDuration: "Fever duration (days)",
      nlcrResult: "NLCR",
      nausea: "Nausea",
      vomiting: "Vomiting",
      lossOfAppetite: "No appetite",
      severeBleeding: "Severe bleeding",
      respiratoryProblems: "Severe respiratory problems",
      seizure: "Seizures",
      severeDehydration: "Severe dehydration",
      shockSign: "Shock signs",
      diagnosis: "Diagnosis",
      recommendation: "Recommendation",
      sensitivity: "Sensitivity (%)",
      specificity: "Specificity (%)",
      authorId: "Author Id",
      userId: "User Id",
    };

    const fmt = (k: string, v: unknown): string => {
      if (v === null || v === undefined || v === "") return "—";
      if (typeof v === "boolean") return v ? "Yes" : "No";
      if (typeof v === "number") return String(v);
      if (typeof v === "string") {
        if (k.toLowerCase().includes("date")) {
          const d = new Date(v);
          return isNaN(d.getTime()) ? v : d.toLocaleString();
        }
        return v;
      }
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    };

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const keyCol = 180;
    const valCol = pageW - margin * 2 - keyCol;

    let startY = margin;

    records.forEach((rec: any, idx: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      // doc.text(`Record #${rec.id ?? idx + 1}`, margin, startY);
      // startY += 8;

      const rows: string[][] = [];
      ORDER.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(rec, k)) {
          rows.push([LABELS[k] ?? k, fmt(k, rec[k])]);
        }
      });

      autoTable(doc, {
        startY: startY + 6,
        head: [["Field", "Value"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak", valign: "middle" },
        headStyles: {
          fontStyle: "bold",
          fillColor: [30, 136, 229],
          textColor: 255,
          halign: "left",
        },
        columnStyles: { 0: { cellWidth: keyCol }, 1: { cellWidth: valCol, halign: "left" } },
        margin: { left: margin, right: margin },
      });

      // @ts-ignore
      startY = (doc.lastAutoTable?.finalY ?? startY) + 16;

      if (idx < records.length - 1 && startY > pageH - margin - 60) {
        doc.addPage();
        startY = margin;
      }
    });

    doc.save("patient_records.pdf");
  };

  if (!isClient || loading) {
    return <div className="p-6 text-center">Loading patient records...</div>;
  }

  const rows = records;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Patient Records</h1>

        {/* Ganti dropdown dengan tiga tombol yang sederhana & stabil */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Date of Birth</th>
              <th className="px-6 py-3">Age</th>
              <th className="px-6 py-3">Diagnosis</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center px-6 py-4 text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                  <td className="px-6 py-4">
                    {r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4">{r.age}</td>
                  <td className="px-6 py-4">{r.diagnosis ?? "—"}</td>
                  <td className="px-6 py-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/records/${r.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        aria-label="View detail"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="Delete record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ====== Protected wrapper ====== */
export default function Page() {
  return (
    <Protected>
      <RecordsContent />
    </Protected>
  );
}
