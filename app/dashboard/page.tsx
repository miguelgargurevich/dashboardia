"use client";

import AssistantBubble from '../components/AssistantBubble';
import TicketsBarChart from '../components/dashboard/TicketsBarChart';
import TicketsLineChart from '../components/dashboard/TicketsLineChart';
import TicketsPieChart from '../components/dashboard/TicketsPieChart';
import EventsCalendar from '../components/dashboard/EventsCalendar';
import RecentResources from '../components/dashboard/RecentResources';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Carousel simple para mostrar los gráficos
function Carousel({ children }: { children: React.ReactNode[] }) {
  const [index, setIndex] = useState(0);
  const total = children.length;
  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-accent">{getChartTitle(index)}</h3>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 rounded bg-accent text-primary font-bold"
            onClick={() => setIndex((index - 1 + total) % total)}
          >
            {'<'}
          </button>
          <span className="text-accent font-bold">{index + 1} / {total}</span>
          <button
            className="px-2 py-1 rounded bg-accent text-primary font-bold"
            onClick={() => setIndex((index + 1) % total)}
          >
            {'>'}
          </button>
        </div>
      </div>
      <div>{children[index]}</div>
    </div>
  );
}

function getChartTitle(index: number) {
  switch (index) {
    case 0:
      return 'Tickets por estado';
    case 1:
      return 'Tickets por fecha';
    case 2:
      return 'Tickets por tipo';
    default:
      return '';
  }
}

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
            <h2 className="text-xl font-bold mb-2 text-accent">Eventos</h2>
            <EventsCalendar token={token || ''} />
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent">Gráficos de Tickets</h2>
            <div className="bg-primary rounded-lg p-4 mb-4">
              <TicketsBarChart token={token || ''} />
            </div>
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent">Próximos Eventos</h2>
            <UpcomingEvents token={token || ''} />
          </div>
          <div className="bg-secondary rounded-xl shadow-lg p-4 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-2 text-accent">Recursos recientes</h2>
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
