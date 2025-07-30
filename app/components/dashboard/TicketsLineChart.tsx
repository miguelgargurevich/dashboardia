"use client";
import React, { useEffect, useState } from 'react';

interface Stat {
  createdAt?: string;
  semana?: string;
  tickets?: number;
  _count?: { id: number };
}

interface Props {
  token?: string;
  data?: any;
}

const TicketsLineChart: React.FC<Props> = ({ token, data }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      setLoading(false);
      return;
    }
    async function fetchStats() {
      setLoading(true);
      try {
        // URL base del backend para tendencia semanal
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        
        const response = await fetch(`${apiUrl}/api/tickets/tendencia-semanal`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setStats(result);
        } else {
          // Fallback a datos de ejemplo
          setStats([
            { semana: 'S1', tickets: 15 },
            { semana: 'S2', tickets: 23 },
            { semana: 'S3', tickets: 18 },
            { semana: 'S4', tickets: 29 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback a datos de ejemplo
        setStats([
          { semana: 'S1', tickets: 15 },
          { semana: 'S2', tickets: 23 },
          { semana: 'S3', tickets: 18 },
          { semana: 'S4', tickets: 29 },
        ]);
      }
      setLoading(false);
    }
    fetchStats();
  }, [token, data]);

  let labels: string[];
  let values: number[];

  if (data) {
    labels = data.labels || [];
    values = data.datasets?.[0]?.data || [];
  } else {
    labels = stats.map(s => s.semana || s.createdAt?.slice(0, 10) || 'Sin fecha');
    values = stats.map(s => s.tickets || s._count?.id || 0);
  }

  const maxValue = Math.max(...values, 1);

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold mb-2 text-accent">Tendencia Semanal de Tickets</h3>
      {loading ? (
        <div className="text-center text-accent">Cargando...</div>
      ) : (
        <div className="h-64 p-4">
          <svg className="w-full h-full">
            {/* Líneas de la grilla */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1="40"
                y1={`${percent}%`}
                x2="100%"
                y2={`${percent}%`}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Línea del gráfico */}
            <polyline
              fill="none"
              stroke="#ff3d00"
              strokeWidth="3"
              points={values.map((value, index) => {
                const x = 40 + (index * (260 / Math.max(labels.length - 1, 1)));
                const y = 240 - (value / maxValue) * 200;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Puntos en la línea */}
            {values.map((value, index) => {
              const x = 40 + (index * (260 / Math.max(labels.length - 1, 1)));
              const y = 240 - (value / maxValue) * 200;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ff3d00"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>{`${labels[index]}: ${value}`}</title>
                </circle>
              );
            })}
            
            {/* Etiquetas del eje X */}
            {labels.map((label, index) => {
              const x = 40 + (index * (260 / Math.max(labels.length - 1, 1)));
              return (
                <text
                  key={index}
                  x={x}
                  y="260"
                  textAnchor="middle"
                  className="text-xs fill-current text-accent"
                >
                  {label}
                </text>
              );
            })}
            
            {/* Etiquetas del eje Y */}
            {[0, 25, 50, 75, 100].map((percent) => {
              const value = Math.round((percent / 100) * maxValue);
              return (
                <text
                  key={percent}
                  x="35"
                  y={`${100 - percent}%`}
                  textAnchor="end"
                  className="text-xs fill-current text-accent"
                  dy="4"
                >
                  {value}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default TicketsLineChart;
