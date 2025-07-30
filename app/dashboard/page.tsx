"use client";
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import DailyBarChart from '../components/dashboard/DailyBarChart';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import DailyLineChart from '../components/dashboard/DailyLineChart';
import WeeklyLineChart from '../components/dashboard/WeeklyLineChart';
import DailyPieChart from '../components/dashboard/DailyPieChart';
import WeeklyPieChart from '../components/dashboard/WeeklyPieChart';
import { FaChartBar, FaChartLine, FaChartPie, FaCalendarDay, FaCalendarWeek } from "react-icons/fa";
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
      <div className="min-h-screen bg-primary text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-accent mb-2">Dashboard Estadístico</h1>
            <p className="text-gray-400">Análisis detallado de métricas diarias y semanales del equipo de soporte</p>
          </div>

          {/* Encabezados de columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCalendarDay className="text-accent text-xl" />
                <h2 className="text-2xl font-bold text-gray-200">Métricas Diarias</h2>
              </div>
              <p className="text-gray-400 text-sm">Datos de hoy y tendencias recientes</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCalendarWeek className="text-accent text-xl" />
                <h2 className="text-2xl font-bold text-gray-200">Métricas Semanales</h2>
              </div>
              <p className="text-gray-400 text-sm">Datos de esta semana y comparativa</p>
            </div>
          </div>

          {/* Primera fila: Gráficos de barras */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Tickets por Prioridad - Diario</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <DailyPieChart token={token || ''} />
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Tickets por Prioridad - Semanal</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <WeeklyBarChart token={token || ''} />
              </div>
            </div>
          </div>

          {/* Segunda fila: Gráficos de líneas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Tendencia de Tickets - Diario</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <DailyLineChart token={token || ''} />
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartLine className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Tendencia de Tickets - Semanal</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <WeeklyLineChart token={token || ''} />
              </div>
            </div>
          </div>

          {/* Tercera fila: Gráficos de pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartPie className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Distribución por Estado - Diario</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <div className="flex justify-center items-center">
                  <div className="w-80 h-80">
                    <DailyPieChart token={token || ''} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaChartPie className="text-accent text-xl" />
                <h3 className="text-xl font-bold text-gray-200">Distribución por Estado - Semanal</h3>
              </div>
              <div className="bg-primary rounded-lg p-4">
                <div className="flex justify-center items-center">
                  <div className="w-80 h-80">
                    <WeeklyPieChart token={token || ''} />
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
