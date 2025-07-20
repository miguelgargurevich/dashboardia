"use client";
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, Filler, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(Filler, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Stat {
  tipo?: string;
  estado?: string;
  sistema?: string;
  createdAt?: string;
  _count: { id: number };
}

interface Props {
  groupBy?: 'tipo' | 'estado' | 'sistema' | 'fecha';
  token: string;
}

const TicketsBarChart: React.FC<Props> = ({ groupBy = 'estado', token }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/tickets/stats?groupBy=${groupBy}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    fetchStats();
  }, [groupBy, token]);

  const labels = stats.map(s => {
    if (groupBy === 'fecha') {
      // Usar createdAt y formatear como YYYY-MM-DD
      return s.createdAt ? s.createdAt.slice(0, 10) : 'Sin fecha';
    }
    return s[groupBy as keyof Stat] || 'Sin dato';
  });
  const values = stats.map(s => s._count.id);

  const chartData = {
    labels,
    datasets: [
      {
        label: `Tickets por ${groupBy}`,
        data: values,
        backgroundColor: [
          'rgba(255,0,0,0.7)',     // Rojo puro
          'rgba(0,255,0,0.7)',     // Verde puro
          'rgba(0,0,255,0.7)',     // Azul puro
          'rgba(255,255,0,0.7)',   // Amarillo puro
          'rgba(255,0,255,0.7)',   // Magenta
          'rgba(0,255,255,0.7)',   // Cyan
          'rgba(255,140,0,0.7)'    // Naranja fuerte
        ],
      },
    ],
  };

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold mb-2 text-accent">Tickets por {groupBy}</h3>
      {loading ? <div>Cargando...</div> : <Bar data={chartData} />}
    </div>
  );
};

export default TicketsBarChart;
