"use client";
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, Filler, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(Filler);
Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Stat {
  createdAt?: string;
  _count: { id: number };
}

interface Props {
  token: string;
}

const TicketsLineChart: React.FC<Props> = ({ token }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/tickets/stats?groupBy=fecha`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    fetchStats();
  }, [token]);

  // Agrupar por fecha (YYYY-MM-DD)
  const labels = stats.map(s => s.createdAt ? s.createdAt.slice(0, 10) : 'Sin fecha');
  const values = stats.map(s => s._count.id);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tickets por fecha',
        data: values,
          borderColor: 'rgba(255,0,0,1)', // Rojo puro
          backgroundColor: 'rgba(255,0,0,0.2)', // Rojo traslúcido
          fill: true,
      },
    ],
  };

  return (
       <div className="bg-primary rounded-lg p-4 shadow-md">
         <h3 className="text-lg font-bold mb-2 text-accent">Tickets por fecha</h3>
         {loading ? <div>Cargando...</div> : <Line data={chartData} />}
       </div>
  );
};

export default TicketsLineChart;
