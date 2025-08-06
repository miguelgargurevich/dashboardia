"use client";

import { useEffect, useState } from 'react';
import { FaChartBar } from 'react-icons/fa';

interface TicketData {
  mes: string;
  resueltos: number;
  pendientes: number;
  en_proceso: number;
}

interface TicketsBarChart2Props {
  token: string;
}

export default function TicketsBarChart2({ token }: TicketsBarChart2Props) {
  const [data, setData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketsData();
  }, [token]);

  const fetchTicketsData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL + '/api';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/tickets/estadisticas-mensuales`, {
        headers,
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        // Datos de ejemplo mientras se implementa el endpoint real
        setData([
          { mes: 'Ene', resueltos: 45, pendientes: 12, en_proceso: 8 },
          { mes: 'Feb', resueltos: 52, pendientes: 15, en_proceso: 6 },
          { mes: 'Mar', resueltos: 38, pendientes: 18, en_proceso: 11 },
          { mes: 'Abr', resueltos: 61, pendientes: 9, en_proceso: 7 },
          { mes: 'May', resueltos: 43, pendientes: 14, en_proceso: 9 },
          { mes: 'Jun', resueltos: 56, pendientes: 11, en_proceso: 5 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching tickets data:', error);
      // Datos de ejemplo en caso de error
      setData([
        { mes: 'Ene', resueltos: 45, pendientes: 12, en_proceso: 8 },
        { mes: 'Feb', resueltos: 52, pendientes: 15, en_proceso: 6 },
        { mes: 'Mar', resueltos: 38, pendientes: 18, en_proceso: 11 },
        { mes: 'Abr', resueltos: 61, pendientes: 9, en_proceso: 7 },
        { mes: 'May', resueltos: 43, pendientes: 14, en_proceso: 9 },
        { mes: 'Jun', resueltos: 56, pendientes: 11, en_proceso: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '350px' }}>
        <div className="text-accent">Cargando estadísticas...</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.resueltos + d.pendientes + d.en_proceso));

  return (
    <div style={{ height: '350px' }}>
      <div className="flex items-end justify-center gap-12 h-64 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex flex-col w-16 gap-1 justify-end" style={{ height: '200px' }}>
              {/* Resueltos */}
              <div
                className="bg-green-500 rounded-t-lg transition-all duration-300 hover:bg-green-400 relative group"
                style={{ 
                  height: `${(item.resueltos / maxValue) * 180}px`,
                  minHeight: item.resueltos > 0 ? '4px' : '0px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Resueltos: {item.resueltos}
                </div>
              </div>
              
              {/* En proceso */}
              <div
                className="bg-yellow-500 transition-all duration-300 hover:bg-yellow-400 relative group"
                style={{ 
                  height: `${(item.en_proceso / maxValue) * 180}px`,
                  minHeight: item.en_proceso > 0 ? '4px' : '0px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  En proceso: {item.en_proceso}
                </div>
              </div>
              
              {/* Pendientes */}
              <div
                className="bg-red-500 rounded-b-lg transition-all duration-300 hover:bg-red-400 relative group"
                style={{ 
                  height: `${(item.pendientes / maxValue) * 180}px`,
                  minHeight: item.pendientes > 0 ? '4px' : '0px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Pendientes: {item.pendientes}
                </div>
              </div>
            </div>
            
            <span className="text-sm text-gray-400 mt-3 text-center">{item.mes}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-400">Resueltos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-400">En Proceso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-400">Pendientes</span>
        </div>
      </div>
    </div>
  );
}
