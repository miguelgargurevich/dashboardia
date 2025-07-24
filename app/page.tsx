"use client";

import AssistantBubble from './components/AsisstantIA/AssistantBubble';
import TicketsLineChart from './components/dashboard/TicketsLineChart';
import TicketsBarChart from './components/dashboard/TicketsBarChart';
import TicketsPieChart from './components/dashboard/TicketsPieChart';
import EventsCalendar from './components/dashboard/EventsCalendar';
import UpcomingEvents from './components/dashboard/UpcomingEvents';
import { FaRegCalendarAlt, FaChartBar, FaClock } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('token');
    setIsLoggedIn(!!t);
    setToken(t);
    if (!t) {
      router.push('/login');
    }
  }, [router]);

  if (!mounted || isLoggedIn === null) {
    return null; // Espera a montar y verificar
  }

  return (
    <>
      <div className="min-h-screen bg-primary text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-accent mb-2">Dashboard Soporte</h1>
            <p className="text-gray-400">Resumen de actividades y métricas del equipo de soporte</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda: Eventos */}
          <div className="flex flex-col gap-6">
            <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaRegCalendarAlt className="text-accent" />
                Eventos
              </h2>
              <EventsCalendar token={token || ''} />
            </div>
           
          </div>
          {/* Columna Derecha: Gráficos estadísticos y Proximos eventos */}
          <div className="flex flex-col gap-6">
             <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaClock className="text-accent" />
                Próximos Eventos
              </h2>
              <UpcomingEvents token={token || ''} />
            </div>
            <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2 text-gray-200 flex items-center gap-2">
                <FaChartBar className="text-accent" />
                Gráficos de Tickets
              </h2>

              <div className="bg-primary rounded-lg p-4">
                <div className="flex justify-center items-center">
                  <div className="w-80 h-80">
                    <TicketsPieChart token={token || ''} />
                  </div>
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
