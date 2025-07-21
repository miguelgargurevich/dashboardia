"use client";
import './globals.css'; // IGNORE
import type { ReactNode } from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaBars, FaHome, FaChartBar, FaCalendarAlt, FaBook, FaSignOutAlt } from "react-icons/fa";

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
  return (
    <>
      {/* Sidebar siempre visible con solo iconos */}
      <aside className="fixed top-0 left-0 h-full bg-secondary shadow-lg z-40 w-16 flex flex-col items-center pt-20">
        <a href="/" className="mb-6 group">
          <FaHome className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </a>
        <a href="/dashboard" className="mb-6 group">
          <FaChartBar className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </a>
        <a href="/dashboard" className="mb-6 group">
          <FaCalendarAlt className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </a>
        <a href="/dashboard" className="mb-6 group">
          <FaBook className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </a>
        <div className="mt-auto mb-8 flex items-center justify-center w-full">
          <a href="/login" className="group">
            <FaSignOutAlt className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
          </a>
        </div>
      </aside>
      {/* Modal flotante con menú completo */}
      {!collapsed && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 backdrop-blur-sm opacity-100 pointer-events-auto"
            onClick={() => setCollapsed(true)}
          />
          <aside className="fixed top-0 left-0 h-full bg-secondary shadow-2xl z-50 w-56">
            <div className="flex items-center h-14 border-b border-accent/20" style={{height:'56px'}}>
              <button
                type="button"
                className="flex items-center justify-center w-16 h-14 bg-secondary border-none outline-none hover:bg-accent/10 transition-colors duration-200"
                onClick={() => setCollapsed(true)}
              >
                <FaBars className="text-accent text-xl" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-2 items-center">
              <a href="/" className="flex items-center justify-center w-16 h-14 text-accent hover:bg-accent/10 rounded transition-colors">
                <FaHome className="text-xl" />
              </a>
              <a href="/dashboard" className="flex items-center justify-center w-16 h-14 text-accent hover:bg-accent/10 rounded transition-colors">
                <FaChartBar className="text-xl" />
              </a>
              <a href="/dashboard" className="flex items-center justify-center w-16 h-14 text-accent hover:bg-accent/10 rounded transition-colors">
                <FaCalendarAlt className="text-xl" />
              </a>
              <a href="/dashboard" className="flex items-center justify-center w-16 h-14 text-accent hover:bg-accent/10 rounded transition-colors">
                <FaBook className="text-xl" />
              </a>
              <a href="/login" className="flex items-center justify-center w-16 h-14 text-accent hover:bg-accent/10 rounded transition-colors mt-8">
                <FaSignOutAlt className="text-xl" />
              </a>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

function Header({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
  return (
    <header className={`w-full left-0 bg-secondary border-b border-accent/20 px-0 flex items-center fixed top-0 z-[60] transition-all duration-300`} style={{height:'56px'}}>
      <div className="flex items-center justify-between w-full">
        {/* Botón alineado y con mismo estilo que los iconos del sidebar */}
        {/* comentado para mejorar el ejcto de la ventana flotante */}
        {/* <button
          type="button"
          className="mr-2 p-2 rounded group hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={() => setCollapsed(false)}
          style={{ zIndex: 30 }}
        >
          <FaBars className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </button> */}
        <span className="text-accent font-bold text-lg ml-4"></span>
        <span className="text-gray-400 text-sm mr-8">Bienvenido</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-secondary border-t border-accent/20 py-3 px-6 text-center text-xs text-gray-400 sticky bottom-0 left-0 z-20">
      &copy; {new Date().getFullYear()} Dashboard IA Soporte. Todos los derechos reservados.
    </footer>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <html lang="es">
      <body className="bg-primary text-white min-h-screen">
        {!isLogin && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
        {!isLogin && <Header collapsed={collapsed} setCollapsed={setCollapsed} />}
        <main className={`${!isLogin ? `pt-20 pb-10 transition-all duration-300 ml-16` : ''}`}>
          {children}
        </main>
        {/* {!isLogin && <Footer />} */}
      </body>
    </html>
  );
}
