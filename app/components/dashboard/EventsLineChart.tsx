"use client";

import { useEffect, useState } from 'react';

interface EventData {
  mes: string;
  eventos_creados: number;
  eventos_completados: number;
}

interface EventsLineChartProps {
  token: string;
}

export default function EventsLineChart({ token }: EventsLineChartProps) {
  const [data, setData] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventsData();
  }, [token]);

  const fetchEventsData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL + '/api';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/eventos/estadisticas-mensuales`, {
        headers,
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Datos de eventos recibidos:', result); // Para debug
        setData(result);
      } else {
        console.log('Error en la respuesta de eventos:', response.status, response.statusText);
        // Datos de ejemplo con valores más altos y variados para mejor visualización
        setData([
          { mes: 'Ene', eventos_creados: 32, eventos_completados: 26 },
          { mes: 'Feb', eventos_creados: 45, eventos_completados: 41 },
          { mes: 'Mar', eventos_creados: 36, eventos_completados: 33 },
          { mes: 'Abr', eventos_creados: 58, eventos_completados: 51 },
          { mes: 'May', eventos_creados: 46, eventos_completados: 40 },
          { mes: 'Jun', eventos_creados: 65, eventos_completados: 58 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching events data:', error);
      // Datos de ejemplo con valores más altos y variados para mejor visualización
      setData([
        { mes: 'Ene', eventos_creados: 32, eventos_completados: 26 },
        { mes: 'Feb', eventos_creados: 45, eventos_completados: 41 },
        { mes: 'Mar', eventos_creados: 36, eventos_completados: 33 },
        { mes: 'Abr', eventos_creados: 58, eventos_completados: 51 },
        { mes: 'May', eventos_creados: 46, eventos_completados: 40 },
        { mes: 'Jun', eventos_creados: 65, eventos_completados: 58 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '350px' }} className="flex items-center justify-center">
        <div className="text-accent">Cargando estadísticas de eventos...</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.eventos_creados, d.eventos_completados)), 1);

  console.log('EventsLineChart - data:', data); // Para debug
  console.log('EventsLineChart - maxValue:', maxValue); // Para debug

  return (
    <div style={{ height: '350px' }}>
      <div className="h-64 flex items-end">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((line) => (
            <line
              key={line}
              x1="0"
              y1={line * 40}
              x2="400"
              y2={line * 40}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Area bajo la línea para eventos creados */}
          <defs>
            <linearGradient id="creadosAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="completadosAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Area para eventos creados */}
          <path
            d={`M 0 200 ${data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((item.eventos_creados || 0) / maxValue) * 180;
              return `L ${x} ${y}`;
            }).join(' ')} L 400 200 Z`}
            fill="url(#creadosAreaGradient)"
          />
          
          {/* Línea eventos creados */}
          <path
            d={`M ${data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((item.eventos_creados || 0) / maxValue) * 180;
              return `${x} ${y}`;
            }).join(' L ')}`}
            stroke="rgb(59, 130, 246)"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Línea eventos completados */}
          <path
            d={`M ${data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 200 - ((item.eventos_completados || 0) / maxValue) * 180;
              return `${x} ${y}`;
            }).join(' L ')}`}
            stroke="rgb(16, 185, 129)"
            strokeWidth="3"
            fill="none"
          />
          
          {/* Puntos eventos creados */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 200 - ((item.eventos_creados || 0) / maxValue) * 180;
            return (
              <g key={`creados-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="rgb(59, 130, 246)"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-8 transition-all duration-200"
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  {item.eventos_creados || 0}
                </text>
              </g>
            );
          })}
          
          {/* Puntos eventos completados */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400;
            const y = 200 - ((item.eventos_completados || 0) / maxValue) * 180;
            return (
              <g key={`completados-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="rgb(16, 185, 129)"
                  stroke="white"
                  strokeWidth="2"
                  className="hover:r-8 transition-all duration-200"
                />
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  {item.eventos_completados || 0}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Etiquetas del eje X */}
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-gray-400">
            {item.mes}
          </span>
        ))}
      </div>
      
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-xs text-gray-400">Eventos Creados</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-400">Eventos Completados</span>
        </div>
      </div>
    </div>
  );
}
