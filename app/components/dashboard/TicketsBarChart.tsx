"use client";
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Stat {
  usuario?: string;
  _count: { id: number };
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      // Consulta al backend para agrupar por usuario de soporte
      const res = await fetch(`${apiUrl}/tickets/stats?groupBy=usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      setStats(result);
      setLoading(false);
    }
    fetchStats();
  }, [token]);

  const labels = stats.map(s => s.usuario || 'Sin usuario');
  const values = stats.map(s => s._count.id);

  const colorPalette = [
    'rgba(41,121,255,0.7)', // Azul intenso
    'rgba(0,200,83,0.7)',  // Verde brillante
    'rgba(255,213,0,0.7)', // Amarillo intenso
    'rgba(255,0,255,0.7)', // Magenta
    'rgba(0,229,255,0.7)', // Celeste
    'rgba(255,87,34,0.7)', // Naranja fuerte
    'rgba(156,39,176,0.7)',// Violeta
    'rgba(0,150,136,0.7)', // Verde azulado
    'rgba(233,30,99,0.7)', // Rosa,
    'rgba(255,61,0,0.7)'  // Rojo intenso
  ];
  const backgroundColors = labels.map((_, i) => colorPalette[i % colorPalette.length]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tickets por persona',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-bold mb-2 text-accent">Tickets por persona</h3>
      {loading ? <div>Cargando...</div> : <Bar data={chartData} />}
    </div>
  );
};

export default TicketsBarChart;
