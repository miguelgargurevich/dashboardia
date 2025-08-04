'use client';

import { useState, useEffect } from 'react';

interface TicketData {
  priority: string;
  count: number;
  color: string;
}

export default function DailyBarChart() {
  const [data, setData] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Por ahora usamos datos simulados, luego conectaremos con la API
        const simulatedData: TicketData[] = [
          { priority: 'Crítica', count: 5, color: '#ef4444' },
          { priority: 'Alta', count: 12, color: '#f97316' },
          { priority: 'Media', count: 25, color: '#eab308' },
          { priority: 'Baja', count: 8, color: '#22c55e' }
        ];
        
        setData(simulatedData);
        setLoading(false);
      } catch {
        setError('Error al cargar datos');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando datos diarios...</div>
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

  return (
    <div className="w-full h-64">
      <div className="flex items-end justify-center h-48 gap-4 mb-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div className="text-sm text-gray-300 font-medium">
              {item.count}
            </div>
            <div
              className="w-12 rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(item.count / maxCount) * 160}px`,
                backgroundColor: item.color,
                minHeight: '8px'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Leyenda */}
      <div className="flex justify-center gap-4 text-xs">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-300">{item.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
