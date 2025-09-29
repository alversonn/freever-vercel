// src/components/Layout.js
"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, PlusSquare, List, LogOut, User2 } from "lucide-react";

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const displayName = session?.user?.name || session?.user?.username || "User";
  const initials = useMemo(() => {
    const s = displayName.trim();
    const parts = s.split(" ");
    const take = (str) => (str ? str[0].toUpperCase() : "");
    return (take(parts[0]) + take(parts[1] || "")).slice(0, 2) || "U";
  }, [displayName]);

  const NavLink = ({ href, children }) => {
    const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
          active ? "bg-blue-100 text-blue-700" : "hover:bg-blue-50"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      >
        {children}
      </Link>
    );
  };

  const handleLogout = async () => {
    // logout tanpa redirect otomatis NextAuth
    await signOut({ redirect: false });
    // ganti history ke /login supaya Back tidak mengembalikan ke /assessment
    router.replace("/login");
  };

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between h-16 border-b">
        <h1 className="font-bold text-xl text-blue-600">Dashboard</h1>
        <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-4">
        <ul className="space-y-1 px-3">
          <li>
            <NavLink href="/assessment">
              <PlusSquare size={20} />
              <span>New Assessment</span>
            </NavLink>
          </li>
          <li>
            <NavLink href="/records">
              <List size={20} />
              <span>Patient Records</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Footer: user + logout */}
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email || session?.user?.username || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:block bg-white shadow-lg text-gray-800 w-64">
        <SidebarInner />
      </aside>

      {/* Sidebar mobile (slide in) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg text-gray-800 w-64 transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarInner />
      </aside>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col relative z-0 bg-gray-100">
        <header className="bg-white shadow-sm md:hidden sticky top-0 z-10 flex items-center p-4 h-16">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-4">
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <User2 size={18} className="text-blue-600" />
            Freever App
          </h2>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
