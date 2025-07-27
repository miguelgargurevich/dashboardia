"use client";
import './globals.css'; // IGNORE
import type { ReactNode } from 'react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBars, FaHome, FaChartBar, FaCalendarAlt, FaBook, FaSignOutAlt, FaCog } from "react-icons/fa";

// Componente Tooltip
function Tooltip({ children, text }: { children: ReactNode, text: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 delay-200 group-hover:delay-300 pointer-events-none whitespace-nowrap shadow-xl border border-gray-600 backdrop-blur-sm">
        {text}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-gray-900"></div>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (c: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };
  
  const getLinkClasses = (path: string) => {
    const isActive = pathname === path || (path === '/dashboard' && pathname.startsWith('/dashboard'));
    return `group flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-accent/20 ring-2 ring-accent/50' 
        : 'hover:bg-accent/10'
    }`;
  };

  const getIconClasses = (path: string) => {
    const isActive = pathname === path || (path === '/dashboard' && pathname.startsWith('/dashboard'));
    return `text-lg transition-colors duration-200 ${
      isActive 
        ? 'text-white' 
        : 'text-accent group-hover:text-white'
    }`;
  };

  return (
    <>
      {/* Sidebar siempre visible con solo iconos */}
      <aside className="fixed top-0 left-0 h-full bg-secondary shadow-lg w-16 flex flex-col items-center pt-20 z-40">
        <div className="flex flex-col items-center space-y-3 flex-1">
          <Tooltip text="Inicio">
            <Link href="/" className={getLinkClasses('/')}> 
              <FaHome className={getIconClasses('/')} />
            </Link>
          </Tooltip>
         
          <Tooltip text="Calendario">
            <Link href="/calendar" className={getLinkClasses('/calendar')}>
              <FaCalendarAlt className={getIconClasses('/calendar')} />
            </Link>
          </Tooltip>
          <Tooltip text="Base de Conocimiento">
            <Link href="/knowledge" className={getLinkClasses('/knowledge')}>
              <FaBook className={getIconClasses('/knowledge')} />
            </Link>
          </Tooltip>
           <Tooltip text="Dashboard">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
              <FaChartBar className={getIconClasses('/dashboard')} />
            </Link>
          </Tooltip>
          <Tooltip text="Configuración">
            <Link href="/configuracion" className={getLinkClasses('/configuracion')}>
              <FaCog className={getIconClasses('/configuracion')} />
            </Link>
          </Tooltip>
        </div>
        <div className="mb-8">
          <Tooltip text="Cerrar Sesión">
            <button 
              onClick={handleLogout}
              className="group flex items-center justify-center w-12 h-12 rounded-lg hover:bg-red-500/10 transition-all duration-200"
            >
              <FaSignOutAlt className="text-red-400 text-lg group-hover:text-red-300 transition-colors duration-200" />
            </button>
          </Tooltip>
        </div>
      </aside>
      {/* Modal flotante con menú completo */}
      {!collapsed && (
        <>
          <div
            className="fixed inset-0 bg-black/40 transition-opacity duration-300 backdrop-blur-sm opacity-100 pointer-events-auto"
            onClick={() => setCollapsed(true)}
          />
          <aside className="fixed top-0 left-0 h-full bg-secondary shadow-2xl w-56 z-50">
            <div className="flex items-center h-14 border-b border-accent/20" style={{height:'56px'}}>
              <button
                type="button"
                className="flex items-center justify-center w-16 h-14 bg-secondary border-none outline-none hover:bg-accent/10 transition-colors duration-200"
                onClick={() => setCollapsed(true)}
              >
                <FaBars className="text-accent text-xl" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col items-center space-y-3">
              <Link href="/" className="flex items-center justify-center w-12 h-12 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Inicio">
                <FaHome className="text-lg" />
              </Link>
              <Link href="/calendar" className="flex items-center justify-center w-12 h-12 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Calendario">
                <FaCalendarAlt className="text-lg" />
              </Link>
              <Link href="/knowledge" className="flex items-center justify-center w-12 h-12 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Base de Conocimiento">
                <FaBook className="text-lg" />
              </Link>
              <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Dashboard">
                <FaChartBar className="text-lg" />
              </Link>
              <Link href="/configuracion" className="flex items-center justify-center w-12 h-12 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Configuración">
                <FaCog className="text-lg" />
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-12 h-12 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-6" 
                title="Cerrar Sesión"
              >
                <FaSignOutAlt className="text-lg" />
              </button>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

function Header() {
  return (
    <header className={`w-full left-0 border-b border-accent/20 px-0 flex items-center fixed top-0 z-50 transition-all duration-300`} style={{height:'56px', backgroundColor: '#111827'}}>
      <div className="flex items-center justify-between w-full">
        {/* Botón alineado y con mismo estilo que los iconos del sidebar */}
        {/* comentado para mejorar el ejcto de la ventana flotante */}
        {/* <button
          type="button"
          className="mr-2 p-2 rounded group hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
          onClick={() => setCollapsed(false)}
        >
          <FaBars className="text-accent text-xl group-hover:text-white transition-colors duration-200" />
        </button> */}
        <span className="text-accent font-bold text-lg ml-4"></span>
        <span className="text-gray-400 text-sm mr-8">Bienvenido</span>
      </div>
    </header>
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
        {!isLogin && <Header />}
        <main className={`${!isLogin ? `pt-20 pb-10 transition-all duration-300 ml-16` : ''}`}>
          {children}
        </main>
        {/* {!isLogin && <Footer />} */}
      </body>
    </html>
  );
}
