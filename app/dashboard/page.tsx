"use client";

import AssistantBubble from '../components/AssistantBubble';
import TicketsLineChart from '../components/dashboard/TicketsLineChart';
import TicketsBarChart from '../components/dashboard/TicketsBarChart';
import TicketsPieChart from '../components/dashboard/TicketsPieChart';
import EventsCalendar from '../components/dashboard/EventsCalendar';
import RecentResources from '../components/dashboard/RecentResources';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Dashboard() {
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
      <div className="min-h-screen bg-primary text-white flex flex-col items-center px-2 py-8">
        <h1 className="text-4xl font-bold mb-8 text-accent">Dashboard IA Soporte</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl">
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent flex items-center gap-2">
              <span aria-label="Eventos" role="img">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="#f7b787" strokeWidth="2" fill="#fff"/>
                  <rect x="7" y="2" width="2" height="4" rx="1" fill="#f7b787"/>
                  <rect x="15" y="2" width="2" height="4" rx="1" fill="#f7b787"/>
                </svg>
              </span>
              Eventos
            </h2>
            <EventsCalendar token={token || ''} />
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent flex items-center gap-2">
              <span aria-label="Gráficos" role="img">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="12" width="3" height="8" rx="1" fill="#f7b787"/>
                  <rect x="10" y="8" width="3" height="12" rx="1" fill="#f7b787"/>
                  <rect x="16" y="4" width="3" height="16" rx="1" fill="#f7b787"/>
                </svg>
              </span>
              Gráficos de Tickets
            </h2>
            <div className="bg-primary rounded-lg p-4 mb-4">
              <TicketsBarChart token={token || ''} />
            </div>
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent flex items-center gap-2">
              <span aria-label="Próximos Eventos" role="img">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#f7b787" strokeWidth="2" fill="#fff"/>
                  <path d="M12 6v6l4 2" stroke="#f7b787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Próximos Eventos
            </h2>
            <UpcomingEvents token={token || ''} />
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent flex items-center gap-2">
              <span aria-label="Recursos" role="img">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="#f7b787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#fff"/>
                </svg>
              </span>
              Recursos recientes
            </h2>
            <RecentResources token={token || ''} />
          </div>
        </div>
        <button
          className="mt-8 px-6 py-2 rounded-lg bg-accent text-primary font-bold font-poppins hover:bg-[#f7b787] transition-colors shadow-md"
          onClick={() => {
            localStorage.removeItem('token');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('close-assistant-bubble'));
            }
            setIsLoggedIn(false);
            setTimeout(() => {
              router.push('/login');
            }, 120);
          }}
        >
          Cerrar sesión
        </button>
      </div>
      {mounted && isLoggedIn && <AssistantBubble />}
    </>
  );
}
