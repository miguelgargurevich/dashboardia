"use client";
import { useState, useEffect } from 'react';
import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
import { useRecursosConfig } from '../../lib/useConfig';

interface Resource {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  filePath?: string;
  url?: string;
  fechaCarga: string;
}

interface Props {
  token: string;
  limit?: number;
}

const RecentResources: React.FC<Props> = ({ token, limit = 6 }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { getRecursoConfig } = useRecursosConfig();

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/resources/recent?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResources(data);
      setLoading(false);
    }
    fetchResources();
  }, [token, limit]);

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md">
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => {
            // Usar configuración de tipos de recursos desde el hook
            const recursoConfig = getRecursoConfig(resource.tipo);
            const IconComponent = recursoConfig.IconComponent as React.ComponentType<{ className?: string }>;
            
            return (
              <div key={resource.id} className="bg-accent/10 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
                <span className="font-bold text-accent flex items-center gap-2">
                  <IconComponent className="text-accent" />
                  {recursoConfig.nombre}
                </span>
                <span className="font-semibold">{resource.titulo}</span>
                <span className="text-sm text-gray-300">{resource.descripcion}</span>
                <span className="text-xs text-gray-400">{formatFechaDDMMYYYY(resource.fechaCarga)}</span>
                {resource.filePath && <a href={resource.filePath} className="text-xs text-blue-400 underline">Descargar</a>}
                {resource.url && <a href={resource.url} className="text-xs text-blue-400 underline">Ver recurso</a>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentResources;
