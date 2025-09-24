"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, PlusSquare, List } from 'lucide-react';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ===== SIDEBAR (untuk Desktop) - Tidak berubah ===== */}
      <aside className="hidden md:block bg-white shadow-lg text-gray-800 w-64">
        {/* ... (Isi sidebar desktop tetap sama) ... */}
        <div className="p-4 flex items-center h-16 border-b">
          <h1 className="font-bold text-xl text-blue-600 whitespace-nowrap">Dashboard</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2">
              <Link href="/assessment" className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-50">
                <PlusSquare size={20} />
                <span>New Assessment</span>
              </Link>
            </li>
            <li className="px-4 py-2">
              <Link href="/records" className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-50">
                <List size={20} />
                <span>Patient Records</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ===== SIDEBAR OVERLAY (untuk Mobile) - DIPERBAIKI ===== */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg text-gray-800 w-64 transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Kontainer flex vertikal untuk mengatur jarak */}
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="p-4 flex items-center justify-between h-16 border-b">
            <h1 className="font-bold text-xl text-blue-600">Dashboard</h1>
            <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>
          
          {/* Menu Navigasi */}
          <nav className="mt-4">
            <ul>
              <li className="px-4 py-2">
                <Link href="/assessment" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-50">
                  <PlusSquare size={20} />
                  <span>New Assessment</span>
                </Link>
              </li>
              <li className="px-4 py-2">
                <Link href="/records" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-4 p-2 rounded-md hover:bg-blue-50">
                  <List size={20} />
                  <span>Patient Records</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Bagian Profil Pengguna (didorong ke bawah dengan mt-auto) */}
          {/* <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold">
                N
              </div>
              <span className="font-semibold">Freever</span>
            </div>
          </div> */}
        </div>
      </aside>

      {/* Backdrop Overlay (tidak berubah) */}
      {isSidebarOpen && <div 
  className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-20 md:hidden"
  onClick={() => setIsSidebarOpen(false)}
></div>}

      {/* ===== KONTEN UTAMA (tidak berubah) ===== */}
      <div className="flex-1 flex flex-col relative z-0 bg-gray-100">
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-10 flex items-center p-4 h-16">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-4">
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-lg">Freever App</h2>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}