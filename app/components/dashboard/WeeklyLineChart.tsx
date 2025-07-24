'use client';

import { useState, useEffect } from 'react';

interface WeeklyLineChartProps {
  token: string;
}

interface DataPoint {
  day: string;
  count: number;
}

export default function WeeklyLineChart({ token }: WeeklyLineChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Por ahora usamos datos simulados por días de la semana
        const simulatedData: DataPoint[] = [
          { day: 'Lun', count: 35 },
          { day: 'Mar', count: 42 },
          { day: 'Mié', count: 28 },
          { day: 'Jue', count: 51 },
          { day: 'Vie', count: 38 },
          { day: 'Sáb', count: 15 },
          { day: 'Dom', count: 8 }
        ];
        
        setData(simulatedData);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar datos');
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando tendencia semanal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));
  const minCount = Math.min(...data.map(d => d.count));

  // Crear puntos SVG para la línea
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 280 + 20; // 20px margen
    const y = 160 - ((point.count - minCount) / (maxCount - minCount)) * 120 + 20; // 20px margen
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-64">
      <div className="relative h-48 mb-4">
        <svg className="w-full h-full" viewBox="0 0 320 200">
          {/* Línea de tendencia */}
          <polyline
            points={points}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          
          {/* Puntos de datos */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 280 + 20;
            const y = 160 - ((point.count - minCount) / (maxCount - minCount)) * 120 + 20;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#10b981"
                  className="drop-shadow-sm"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-300"
                >
                  {point.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Leyenda de días */}
      <div className="flex justify-between text-xs text-gray-400 px-5">
        {data.map((point, index) => (
          <span key={index}>
            {point.day}
          </span>
        ))}
      </div>
      
      {/* Leyenda */}
      <div className="flex justify-center mt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-0.5 bg-emerald-500"/>
          <span className="text-gray-300">Tickets creados por día</span>
        </div>
      </div>
    </div>
  );
}
