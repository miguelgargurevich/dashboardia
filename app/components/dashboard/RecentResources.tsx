"use client";
import React, { useEffect, useState } from 'react';
import { FaFileAlt, FaVideo, FaStickyNote, FaLink, FaBrain, FaAddressBook, FaClipboardList, FaLayerGroup } from "react-icons/fa";
import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono?: React.ReactNode;
}

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
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);

  // Cargar tipos de recursos desde API o usar tipos por defecto
  useEffect(() => {
    // Intentar cargar desde API, si falla usar tipos por defecto
    fetch('/api/config/tipos-recursos')
      .then(res => res.json())
      .then((data) => {
        const iconMap: Record<string, React.ReactNode> = {
          'url': <FaLink className="text-accent" />,
          'archivo': <FaFileAlt className="text-accent" />,
          'video': <FaVideo className="text-accent" />,
          'ia-automatizacion': <FaBrain className="text-accent" />,
          'contactos-externos': <FaAddressBook className="text-accent" />,
          'plantillas-formularios': <FaClipboardList className="text-accent" />
        };
        setTiposRecursos(data.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-accent" /> })));
      })
      .catch(err => {
        console.error('Error cargando tipos de recursos, usando tipos por defecto:', err);
        // Tipos por defecto si falla la API
        const tiposDefault = [
          { id: 'url', nombre: 'URL', descripcion: 'Enlace web', color: 'text-blue-500' },
          { id: 'archivo', nombre: 'Archivo', descripcion: 'Documento', color: 'text-green-500' },
          { id: 'video', nombre: 'Video', descripcion: 'Archivo de video', color: 'text-red-500' }
        ];
        const iconMap: Record<string, React.ReactNode> = {
          'url': <FaLink className="text-accent" />,
          'archivo': <FaFileAlt className="text-accent" />,
          'video': <FaVideo className="text-accent" />
        };
        setTiposRecursos(tiposDefault.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-accent" /> })));
      });
  }, []);

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
      {/* <h3 className="text-lg font-bold mb-4 text-accent">Recursos recientes</h3> */}
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => {
            // Buscar tipo de recurso por id
            const tipo = tiposRecursos.find(t => t.id === resource.tipo);
            return (
              <div key={resource.id} className="bg-accent/10 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
                <span className="font-bold text-accent flex items-center gap-2">
                  {tipo?.icono || <FaLayerGroup className="text-accent" />} {tipo?.nombre || resource.tipo}
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
