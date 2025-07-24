'use client';

import { useState, useEffect } from 'react';

interface DailyLineChartProps {
  token: string;
}

interface DataPoint {
  time: string;
  count: number;
}

export default function DailyLineChart({ token }: DailyLineChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Por ahora usamos datos simulados por horas del día
        const simulatedData: DataPoint[] = [
          { time: '08:00', count: 2 },
          { time: '09:00', count: 5 },
          { time: '10:00', count: 8 },
          { time: '11:00', count: 12 },
          { time: '12:00', count: 6 },
          { time: '13:00', count: 4 },
          { time: '14:00', count: 9 },
          { time: '15:00', count: 15 },
          { time: '16:00', count: 11 },
          { time: '17:00', count: 7 }
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
        <div className="text-gray-400">Cargando tendencia diaria...</div>
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
            stroke="#3b82f6"
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
                  fill="#3b82f6"
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
      
      {/* Leyenda de horas */}
      <div className="flex justify-between text-xs text-gray-400 px-5">
        {data.map((point, index) => (
          <span key={index} className={index % 2 === 0 ? '' : 'opacity-60'}>
            {point.time}
          </span>
        ))}
      </div>
      
      {/* Leyenda */}
      <div className="flex justify-center mt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-0.5 bg-blue-500"/>
          <span className="text-gray-300">Tickets creados por hora</span>
        </div>
      </div>
    </div>
  );
}
