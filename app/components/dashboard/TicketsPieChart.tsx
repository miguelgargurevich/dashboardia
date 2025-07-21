"use client";
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, Filler, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(Filler, ArcElement, Tooltip, Legend);

interface Stat {
  tipo?: string;
  estado?: string;
  sistema?: string;
  _count: { id: number };
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

  const labels = stats.map(s => s[groupBy] || 'Sin dato');
  const values = stats.map(s => s._count.id);

  const chartData = {
    labels,
    datasets: [
      {
        label: `Tickets por ${groupBy}`,
        data: values,
        backgroundColor: [
          'rgba(0,150,136,0.7)',    // Verde azulado
          'rgba(255,87,34,0.7)',    // Naranja fuerte
          'rgba(255,61,0,0.7)',    // Rojo intenso
          'rgba(255,213,0,0.7)',   // Amarillo intenso
          'rgba(41,121,255,0.7)',  // Azul intenso
          'rgba(255,0,255,0.7)',   // Magenta
          'rgba(0,229,255,0.7)'   // Celeste
        ],
      },
    ],
  };

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold mb-2 text-accent">Tickets por {groupBy}</h3>
      {loading ? <div>Cargando...</div> : <Pie data={chartData} />}
    </div>
  );
};

export default TicketsPieChart;
