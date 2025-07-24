"use client";
import React, { useEffect, useState } from 'react';

interface Stat {
  usuario?: string;
  prioridad?: string;
  cantidad?: number;
  _count?: { id: number };
}

interface Props {
  token?: string;
}

const TicketsBarChart: React.FC<Props> = ({ token }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // URL base del backend
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        
        const response = await fetch(`${apiUrl}/api/tickets/por-prioridad`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setStats(result);
        } else {
          // Fallback a datos de ejemplo
          setStats([
            { prioridad: 'Alta', cantidad: 25 },
            { prioridad: 'Media', cantidad: 45 },
            { prioridad: 'Baja', cantidad: 30 },
            { prioridad: 'Sin prioridad', cantidad: 12 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback a datos de ejemplo
        setStats([
          { prioridad: 'Alta', cantidad: 25 },
          { prioridad: 'Media', cantidad: 45 },
          { prioridad: 'Baja', cantidad: 30 },
          { prioridad: 'Sin prioridad', cantidad: 12 },
        ]);
      }
      setLoading(false);
    }
    fetchStats();
  }, [token]);

  const labels = stats.map(s => s.prioridad || s.usuario || 'Sin categoría');
  const values = stats.map(s => s.cantidad || s._count?.id || 0);
  const maxValue = Math.max(...values, 1);

  const colorPalette = [
    '#2979ff', // Azul intenso
    '#00c853', // Verde brillante
    '#ffd500', // Amarillo intenso
    '#ff00ff', // Magenta
    '#00e5ff', // Celeste
    '#ff5722', // Naranja fuerte
    '#9c27b0', // Violeta
    '#009688', // Verde azulado
    '#e91e63', // Rosa
    '#ff3d00'  // Rojo intenso
  ];

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold mb-2 text-accent">Tickets por prioridad</h3>
      {loading ? (
        <div className="text-center text-accent">Cargando...</div>
      ) : (
        <div className="h-64 flex items-end justify-around space-x-2 mt-4">
          {labels.map((label, index) => {
            const value = values[index];
            const height = (value / maxValue) * 100;
            const color = colorPalette[index % colorPalette.length];
            
            return (
              <div key={label} className="flex flex-col items-center flex-1">
                <div
                  className="w-8 transition-all duration-300 hover:opacity-80 rounded-t"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: value > 0 ? '4px' : '0px'
                  }}
                  title={`${label}: ${value}`}
                />
                <span className="text-xs text-accent mt-2 text-center break-words">
                  {label}
                </span>
                <span className="text-xs text-accent-dark font-semibold">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketsBarChart;
