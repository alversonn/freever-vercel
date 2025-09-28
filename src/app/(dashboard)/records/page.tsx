"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye } from "lucide-react";
import Protected from "@/components/auth/Protected";

interface PatientRecord {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
  createdAt: string;
  dateOfBirth?: string;
}

function RecordsContent() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data: PatientRecord[] = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchRecords();
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Error deleting record.");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading patient records...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Patient Records</h1>
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
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center px-6 py-4 text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{record.name}</td>
                  <td className="px-6 py-4">
                    {record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4">{record.age}</td>
                  <td className="px-6 py-4">{record.diagnosis}</td>
                  <td className="px-6 py-4">{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/records/${record.id}`} className="text-blue-600 hover:text-blue-900" aria-label="View detail">
                        <Eye size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
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

/** Default export: dibungkus proteksi */
export default function Page() {
  return (
    <Protected>
      <RecordsContent />
    </Protected>
  );
}
