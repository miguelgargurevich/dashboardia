"use client";
import React, { useEffect, useState } from 'react';

interface Stat {
  tipo?: string;
  estado?: string;
  sistema?: string;
  cantidad?: number;
  _count?: { id: number };
}

interface Props {
  groupBy?: 'tipo' | 'estado' | 'sistema';
  token: string;
}

const TicketsPieChart: React.FC<Props> = ({ groupBy = 'tipo', token }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL + '/api';
        const res = await fetch(`${apiUrl}/tickets/distribucion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else if (res.status === 401) {
          // Token expirado o inválido, redirigir al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        } else {
          // Fallback a datos de ejemplo
          setStats([
            { tipo: 'Soporte Técnico', cantidad: 45 },
            { tipo: 'Configuración', cantidad: 32 },
            { tipo: 'Bug Report', cantidad: 28 },
            { tipo: 'Consulta', cantidad: 15 },
            { tipo: 'Otro', cantidad: 8 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback a datos de ejemplo
        setStats([
          { tipo: 'Soporte Técnico', cantidad: 45 },
          { tipo: 'Configuración', cantidad: 32 },
          { tipo: 'Bug Report', cantidad: 28 },
          { tipo: 'Consulta', cantidad: 15 },
          { tipo: 'Otro', cantidad: 8 }
        ]);
      }
      setLoading(false);
    }
    fetchStats();
  }, [groupBy, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '350px' }}>
        <div className="text-accent">Cargando...</div>
      </div>
    );
  }

  const colors = ['#009688', '#FF5722', '#FF3D00', '#FFD500', '#2979FF', '#FF00FF', '#00E5FF'];
  const total = stats.reduce((sum, stat) => sum + (stat.cantidad || 0), 0);

  let accumulatedAngle = 0;

  return (
    <div style={{ height: '350px' }}>
      <div className="flex justify-center items-center h-64">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {stats.map((stat, index) => {
            const value = stat.cantidad || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const angle = (percentage / 100) * 360;
            
            const x1 = 100 + 80 * Math.cos((accumulatedAngle * Math.PI) / 180);
            const y1 = 100 + 80 * Math.sin((accumulatedAngle * Math.PI) / 180);
            const x2 = 100 + 80 * Math.cos(((accumulatedAngle + angle) * Math.PI) / 180);
            const y2 = 100 + 80 * Math.sin(((accumulatedAngle + angle) * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = `
              M 100 100
              L ${x1} ${y1}
              A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            const result = (
              <g key={index}>
                <path
                  d={pathData}
                  fill={colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
                <title>{`${stat.tipo || `Categoría ${index + 1}`}: ${value} (${percentage.toFixed(1)}%)`}</title>
              </g>
            );
            
            accumulatedAngle += angle;
            return result;
          })}
          
          {/* Círculo central para efecto donut */}
          <circle cx="100" cy="100" r="30" fill="#1a2636" />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="bold">
            {total}
          </text>
          <text x="100" y="115" textAnchor="middle" dominantBaseline="central" fill="#gray-400" fontSize="10">
            Total
          </text>
        </svg>
      </div>
      
      <div className="flex justify-center flex-wrap gap-4 mt-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="text-xs text-gray-400">
              {stat.tipo || `Categoría ${index + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketsPieChart;
