"use client";
import React, { useEffect, useState } from 'react';
import { FaFileAlt, FaVideo, FaStickyNote, FaLink } from "react-icons/fa";

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

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      const res = await fetch(`/api/resources/recent?limit=${limit}`, {
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
      {/* <h3 className="text-lg font-bold mb-4 text-accent">Recursos recientes</h3> */}
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="bg-accent/10 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
              <span className="font-bold text-accent flex items-center gap-2">
                {resource.tipo === 'archivo' && <FaFileAlt className="text-accent" />}
                {resource.tipo === 'video' && <FaVideo className="text-accent" />}
                {resource.tipo === 'nota' && <FaStickyNote className="text-accent" />}
                {resource.tipo === 'enlace' && <FaLink className="text-accent" />}
                {resource.tipo}
              </span>
              <span className="font-semibold">{resource.titulo}</span>
              <span className="text-sm text-gray-300">{resource.descripcion}</span>
              <span className="text-xs text-gray-400">{new Date(resource.fechaCarga).toLocaleString()}</span>
              {resource.filePath && <a href={resource.filePath} className="text-xs text-blue-400 underline">Descargar</a>}
              {resource.url && <a href={resource.url} className="text-xs text-blue-400 underline">Ver recurso</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentResources;
