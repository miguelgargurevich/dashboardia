// Definición de Tema para tipado de temas
interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}
"use client";
import React, { useState, useEffect } from 'react';


import { FaCog, FaLayerGroup, FaCalendarAlt, FaChevronRight, FaFolderOpen, FaStickyNote } from 'react-icons/fa';
import TemasConfigPanel from './TemasConfigPanel';
import RecursosConfigPanel from './RecursosConfigPanel';
import TiposNotasConfigPanel from './TiposNotasConfigPanel';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';


const ConfiguracionPage: React.FC = () => {
  const [panel, setPanel] = useState<'temas' | 'recursos' | 'tiposNotas' | 'otros'>('temas');
  // Eliminado: tiposNotas y su useEffect, ahora en TiposNotasConfigPanel

  // EventosConfigPanel maneja su propio estado
  const [temas, setTemas] = useState<Tema[]>([]);
  const [tiposRecursos, setTiposRecursos] = useState<any[]>([]);

  // Cargar temas y tipos de recursos desde los JSON centralizados al montar
  useEffect(() => {
    fetch('/temas.json')
      .then(res => res.json())
      .then((data) => {
        setTemas(data);
      });
    fetch('/tiposRecursos.json')
      .then(res => res.json())
      .then((data) => {
        setTiposRecursos(data);
      });
  }, []);
  // const [token, setToken] = useState<string | null>(null); // Ya no se usa

  // Form state con todos los campos relevantes
  // Eliminado: formData y lógica de eventos, ahora en EventosConfigPanel

  useEffect(() => {
    // const t = localStorage.getItem('token'); // Ya no se usa
    // setToken(t); // Ya no se usa
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
            className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors text-left ${panel === 'otros' ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-accent/10 text-gray-300'}`}
            onClick={() => setPanel('otros')}
          >
            <FaCog /> Otras Configuraciones
            {panel === 'otros' && <FaChevronRight className="ml-auto" />}
          </button>
        </aside>
        {/* Panel de contenido */}
        <section className="flex-1">
          {panel === 'temas' && (
            <TemasConfigPanel temas={temas} onChange={setTemas} />
          )}
          {panel === 'recursos' && (
            <RecursosConfigPanel tiposRecursos={tiposRecursos} onChange={setTiposRecursos} />
          )}
          {panel === 'tiposNotas' && (
            <TiposNotasConfigPanel />
          )}
          {panel === 'otros' && (
            <div className="mt-4">
              <h2 className="text-xl font-bold text-accent mb-2">Otras Configuraciones</h2>
              <p className="text-gray-400">Aquí podrás agregar y administrar otros parámetros y catálogos del sistema próximamente.</p>
            </div>
          )}
        </section>
      </div>
      <AssistantBubble />
    </div>
  );
};

export default ConfiguracionPage;
