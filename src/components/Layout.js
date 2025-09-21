"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, PlusSquare, List } from 'lucide-react';

export default function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 md:gap-4">
      <aside className={`bg-white shadow-lg text-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className={`p-4 flex items-center h-16 border-b ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <h1 className={`font-bold text-xl text-blue-600 whitespace-nowrap ${!isSidebarOpen && "hidden"}`}>Dashboard</h1>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2">
              <Link href="/" className={`flex items-center gap-4 p-2 rounded-md hover:bg-blue-50 ${!isSidebarOpen && "justify-center"}`}>
                <PlusSquare size={20} />
                <span className={`whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>New Assessment</span>
              </Link>
            </li>
            <li className="px-4 py-2">
              <Link href="/records" className={`flex items-center gap-4 p-2 rounded-md hover:bg-blue-50 ${!isSidebarOpen && "justify-center"}`}>
                <List size={20} />
                <span className={`whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Patient Records</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="h-full">
            {children}
        </div>
      </main>
    </div>
  );
}