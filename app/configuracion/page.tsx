// Definición de interfaces para tipado
interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TipoEvento {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

"use client";
import React, { useState, useEffect } from 'react';
import { FaCog, FaLayerGroup, FaCalendarAlt, FaChevronRight, FaFolderOpen, FaStickyNote } from 'react-icons/fa';
import TemasConfigPanel from './TemasConfigPanel';
import RecursosConfigPanel from './RecursosConfigPanel';
import TiposNotasConfigPanel from './TiposNotasConfigPanel';
import TiposEventosConfigPanel from './TiposEventosConfigPanel';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

const ConfiguracionPage: React.FC = () => {
  const [panel, setPanel] = useState<'temas' | 'recursos' | 'tiposNotas' | 'tiposEventos' | 'otros'>('temas');
  
  // Estados para los datos de configuración (ahora desde base de datos)
  const [temas, setTemas] = useState<Tema[]>([]);
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  const [tiposEventos, setTiposEventos] = useState<TipoEvento[]>([]);
  const [tiposNotas, setTiposNotas] = useState<TipoNota[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde las APIs de configuración
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setLoading(true);
        
        // Cargar todas las configuraciones en paralelo
        const [temasRes, tiposRecursosRes, tiposEventosRes, tiposNotasRes] = await Promise.all([
          fetch('/api/config/temas'),
          fetch('/api/config/tipos-recursos'),
          fetch('/api/config/tipos-eventos'),
          fetch('/api/config/tipos-notas')
        ]);

        if (temasRes.ok) {
          const temasData = await temasRes.json();
          setTemas(temasData);
        }

        if (tiposRecursosRes.ok) {
          const recursosData = await tiposRecursosRes.json();
          setTiposRecursos(recursosData);
        }

        if (tiposEventosRes.ok) {
          const eventosData = await tiposEventosRes.json();
          setTiposEventos(eventosData);
        }

        if (tiposNotasRes.ok) {
          const notasData = await tiposNotasRes.json();
          setTiposNotas(notasData);
        }

      } catch (error) {
        console.error('Error cargando configuraciones:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarConfiguraciones();
  }, []);




  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Panel lateral de navegación */}
        <aside className="w-56 min-w-[12rem] bg-secondary rounded-xl shadow-lg p-4 flex flex-col gap-2 h-fit sticky top-8">
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'temas' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('temas')}
          >
            <FaLayerGroup /> Temas
            {panel === 'temas' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'recursos' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('recursos')}
          >
            <FaFolderOpen /> Tipos de Recursos
            {panel === 'recursos' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'tiposNotas' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('tiposNotas')}
          >
            <FaStickyNote /> Tipos de Notas
            {panel === 'tiposNotas' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'tiposEventos' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('tiposEventos')}
          >
            <FaCalendarAlt /> Tipos de Eventos
            {panel === 'tiposEventos' && <FaChevronRight className="ml-auto" />}
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'otros' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('otros')}
          >
            <FaCog /> Otras Configuraciones
            {panel === 'otros' && <FaChevronRight className="ml-auto" />}
          </button>
        </aside>
        {/* Panel de contenido */}
        <section className="flex-1">
          {loading ? (
            <div className="bg-secondary rounded-xl shadow-lg p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                <p className="mt-2 text-gray-400">Cargando configuraciones...</p>
              </div>
            </div>
          ) : (
            <>
              {panel === 'temas' && (
                <TemasConfigPanel temas={temas} onChange={setTemas} />
              )}
              {panel === 'recursos' && (
                <RecursosConfigPanel tiposRecursos={tiposRecursos} onChange={setTiposRecursos} />
              )}
              {panel === 'tiposNotas' && (
                <TiposNotasConfigPanel tiposNotas={tiposNotas} onChange={setTiposNotas} />
              )}
              {panel === 'tiposEventos' && (
                <TiposEventosConfigPanel tiposEventos={tiposEventos} onChange={setTiposEventos} />
              )}
              {panel === 'otros' && (
                <div className="bg-secondary rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-accent mb-2">Otras Configuraciones</h2>
                  <p className="text-gray-400">Aquí podrás agregar y administrar otros parámetros y catálogos del sistema próximamente.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <AssistantBubble />
    </div>
  );
};

export default ConfiguracionPage;
