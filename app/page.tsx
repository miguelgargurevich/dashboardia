"use client";
import AssistantBubble from './components/AsisstantIA/AssistantBubble';
import EventsCalendar from './components/dashboard/EventsCalendar';
import ProximosEventosCard from './components/dashboard/ProximosEventosCard';
import { FaRegCalendarAlt } from "react-icons/fa";
// ...existing code...
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Estados compartidos para comunicación entre calendarios
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [triggerDateSelection, setTriggerDateSelection] = useState<number>(0);

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
                <EventsCalendar 
                  token={token || ''} 
                  selectedDate={selectedDate}
                  triggerDateSelection={triggerDateSelection}
                  onDateChange={setSelectedDate}
                  onTodayClick={() => {
                    setTriggerDateSelection(0);
                  }}
                />
              </div>
            </div>
            {/* Columna Derecha: Próximos eventos (panel más alto, sin gráfico) */}
            <div className="flex flex-col gap-6">
              <div>
                <ProximosEventosCard
                  token={token || ''}
                  onEventClick={(date: string) => {
                    setSelectedDate(date);
                    setTriggerDateSelection(prev => prev + 1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {mounted && isLoggedIn && <AssistantBubble />}
    </>
  );
}
