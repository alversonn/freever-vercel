// app/records/page.tsx

"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2, Eye } from 'lucide-react';

// Pastikan interface ini mencakup semua data yang ingin ditampilkan
interface PatientRecord {
  id: number;
  name: string;
  age: number; // <-- Pastikan 'age' ada di sini
  diagnosis: string;
  createdAt: string; // <-- 'createdAt' untuk kolom "Date"
  dateOfBirth?: string;
 
}

export default function RecordsPage() {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi handleDelete yang sudah ada sebelumnya
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      // Panggil fetchRecords lagi untuk memperbarui tabel setelah delete
      fetchRecords(); 
    } catch (error) {
        console.error("Failed to delete record:", error);
        alert("Error deleting record.");
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading patient records...</div>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Patient Records</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            {/* PASTIKAN HEADER SESUAI URUTAN INI (7 KOLOM) */}
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Date of Birth</th>
              <th scope="col" className="px-6 py-3">Age</th>

              <th scope="col" className="px-6 py-3">Diagnosis</th>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center px-6 py-4 text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                  {/* PASTIKAN DATA CELL (<td>) JUMLAH DAN URUTANNYA SAMA (7 KOLOM) */}
                  <td className="px-6 py-4 font-medium text-gray-900">{record.name}</td>
                  <td className="px-6 py-4">{record.dateOfBirth ? new Date(record.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4">{record.age}</td>

                  <td className="px-6 py-4">{record.diagnosis}</td>
                  <td className="px-6 py-4">{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/records/${record.id}`} className="text-blue-600 hover:text-blue-900">
                        <Eye size={18} />
                      </Link>
                      <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-900">
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