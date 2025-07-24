'use client';

import { useState, useEffect } from 'react';

interface WeeklyPieChartProps {
  token: string;
}

interface PieData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export default function WeeklyPieChart({ token }: WeeklyPieChartProps) {
  const [data, setData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Por ahora usamos datos simulados semanales
        const rawData = [
          { status: 'Abierto', count: 45, color: '#ef4444' },
          { status: 'En Progreso', count: 78, color: '#f59e0b' },
          { status: 'Pendiente', count: 32, color: '#eab308' },
          { status: 'Resuelto', count: 124, color: '#22c55e' }
        ];
        
        const total = rawData.reduce((sum, item) => sum + item.count, 0);
        const pieData = rawData.map(item => ({
          ...item,
          percentage: (item.count / total) * 100
        }));
        
        setData(pieData);
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
      <div className="flex items-center justify-center h-80">
        <div className="text-gray-400">Cargando distribución semanal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // Calcular ángulos para cada segmento
  let cumulativePercentage = 0;
  const segments = data.map(item => {
    const startAngle = cumulativePercentage * 3.6; // 360 degrees / 100
    const endAngle = (cumulativePercentage + item.percentage) * 3.6;
    cumulativePercentage += item.percentage;
    return { ...item, startAngle, endAngle };
  });

  // Función para crear path SVG del arco
  const createArcPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="w-full h-80 flex flex-col items-center">
      <div className="relative mb-4">
        <svg width="240" height="240" viewBox="0 0 240 240">
          {segments.map((segment, index) => (
            <path
              key={index}
              d={createArcPath(120, 120, 100, segment.startAngle, segment.endAngle)}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity duration-200"
            />
          ))}
          
          {/* Texto central */}
          <text x="120" y="115" textAnchor="middle" className="text-sm fill-gray-300 font-medium">
            Total Semanal
          </text>
          <text x="120" y="135" textAnchor="middle" className="text-lg fill-white font-bold">
            {data.reduce((sum, item) => sum + item.count, 0)}
          </text>
        </svg>
      </div>
      
      {/* Leyenda */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-300 text-xs">
              {item.status}: {item.count} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
