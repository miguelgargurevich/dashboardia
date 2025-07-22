"use client";

import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import TicketsLineChart from '../components/dashboard/TicketsLineChart';
import TicketsBarChart from '../components/dashboard/TicketsBarChart';
import TicketsPieChart from '../components/dashboard/TicketsPieChart';
import EventsCalendar from '../components/dashboard/EventsCalendar';
import RecentResources from '../components/dashboard/RecentResources';
import { FaRegCalendarAlt, FaChartBar, FaBook } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('token');
    setIsLoggedIn(!!t);
    setToken(t);
    if (!t) {
      router.push('/login');
    } else {
      // Simular tiempo de carga del dashboard
      setTimeout(() => {
        setCargando(false);
      }, 1500);
    }
  }, [router]);

  if (!mounted || isLoggedIn === null) {
    return null; // Espera a montar y verificar
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-primary text-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-accent mb-2">Cargando</h2>
          <p className="text-gray-400">Preparando la información...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-primary text-white flex flex-col items-center px-2 py-8">
        <h1 className="text-4xl font-bold mb-8 text-accent">Dashboard Soporte</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl">
          {/* Columna Izquierda: Eventos y Recursos recientes */}
          <div className="flex flex-col gap-6">
            <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaRegCalendarAlt className="text-accent" />
                Eventos
              </h2>
              <EventsCalendar token={token || ''} />
            </div>
            <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaBook className="text-accent" />
                Recursos recientes
              </h2>
              <div className="grid grid-cols-1 gap-4 w-full">
                <RecentResources token={token || ''} />
              </div>
            </div>
          </div>
          {/* Columna Derecha: Gráficos estadísticos */}
          <div className="flex flex-col gap-6">
            <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaChartBar className="text-accent" />
                Gráficos de Tickets
              </h2>
              <div className="bg-primary rounded-lg p-4 mb-4">
                <TicketsBarChart token={token || ''} />
              </div>
              <div className="bg-primary rounded-lg p-4 mb-4">
                <TicketsLineChart token={token || ''} />
              </div>
              <div className="bg-primary rounded-lg p-4">
                <div className="flex justify-left items-center">
                  <div className="w-80 h-80">
                    <TicketsPieChart token={token || ''} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {mounted && isLoggedIn && <AssistantBubble />}
    </>
  );
}
