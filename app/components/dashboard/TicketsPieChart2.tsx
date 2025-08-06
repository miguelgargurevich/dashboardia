"use client";
import React, { useEffect, useState } from 'react';
import { FaChartPie } from 'react-icons/fa';

interface TicketData {
  estado: string;
  cantidad: number;
  color: string;
}

const TicketsPieChart2: React.FC = () => {
  const [data, setData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/tickets/stats/estados');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        // Datos de ejemplo si la API no está disponible
        setData([
          { estado: 'Abierto', cantidad: 15, color: '#ef4444' },
          { estado: 'En Proceso', cantidad: 8, color: '#f59e0b' },
          { estado: 'Resuelto', cantidad: 32, color: '#10b981' },
          { estado: 'Cerrado', cantidad: 45, color: '#6b7280' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching tickets data:', error);
      // Datos de ejemplo en caso de error
      setData([
        { estado: 'Abierto', cantidad: 15, color: '#ef4444' },
        { estado: 'En Proceso', cantidad: 8, color: '#f59e0b' },
        { estado: 'Resuelto', cantidad: 32, color: '#10b981' },
        { estado: 'Cerrado', cantidad: 45, color: '#6b7280' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const total = data.reduce((sum, item) => sum + item.cantidad, 0);

  // Calcular ángulos para el gráfico de pastel
  const calculateAngles = () => {
    let currentAngle = 0;
    return data.map(item => {
      const percentage = (item.cantidad / total) * 100;
      const angle = (item.cantidad / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...item,
        percentage,
        angle,
        startAngle,
        endAngle: currentAngle
      };
    });
  };

  const dataWithAngles = calculateAngles();

  // Generar path SVG para cada segmento
  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  if (loading) {
    return (
      <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaChartPie className="text-accent text-xl" />
          <h3 className="text-lg font-semibold text-white">Estados de Tickets</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary border border-accent/20 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaChartPie className="text-accent text-xl" />
        <h3 className="text-lg font-semibold text-white">Estados de Tickets</h3>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Gráfico de pastel SVG */}
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {dataWithAngles.map((item, index) => (
              <path
                key={index}
                d={createPath(100, 100, 80, item.startAngle, item.endAngle)}
                fill={item.color}
                stroke="#1f2937"
                strokeWidth="2"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
          
          {/* Centro del gráfico */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-3">
          {dataWithAngles.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-primary/40 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-white font-medium">{item.estado}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">{item.cantidad}</div>
                <div className="text-sm text-gray-400">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de estadísticas */}
      <div className="mt-6 pt-4 border-t border-accent/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {dataWithAngles.map((item, index) => (
            <div key={index} className="p-3 bg-primary/20 rounded-lg">
              <div className="text-lg font-bold" style={{ color: item.color }}>
                {item.cantidad}
              </div>
              <div className="text-xs text-gray-400">{item.estado}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketsPieChart2;
