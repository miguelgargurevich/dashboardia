"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';
import { getIconComponent } from '../lib/useConfig';
import EventosKnowledgePanel from "./EventosKnowledgePanel";
import NotasKnowledgePanel from "./NotasKnowledgePanel";
import RecursosKnowledgePanel from "./RecursosKnowledgePanel";

const KnowledgePage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [seccionActiva, setSeccionActiva] = useState('notas');

  // Efecto para inicializar autenticación
  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('token');
    setIsLoggedIn(!!t);
    setToken(t);
    if (!t) {
      router.push('/login');
    }
  }, [router]);

  // Protección de autenticación
  if (!mounted || isLoggedIn === null) {
    return null; // Espera a montar y verificar
  }

  if (!isLoggedIn) {
    return null; // Ya redirigió al login
  }

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">Base de Conocimiento</h1>
          <p className="text-gray-400">Documentación organizada por temas y actividades del equipo de soporte</p>
        </div>

        {/* Navegación por secciones */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setSeccionActiva('notas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'notas'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            {(() => {
              const IconComponent = getIconComponent('fa-book') as React.ComponentType<{ className?: string }>;
              return <IconComponent />;
            })()}
            Notas y Documentos
          </button>
          <button
            onClick={() => setSeccionActiva('recursos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'recursos'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            {(() => {
              const IconComponent = getIconComponent('fa-layer-group') as React.ComponentType<{ className?: string }>;
              return <IconComponent />;
            })()}
            Recursos y Archivos
          </button>
          <button
            onClick={() => setSeccionActiva('eventos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'eventos'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            {(() => {
              const IconComponent = getIconComponent('fa-clock') as React.ComponentType<{ className?: string }>;
              return <IconComponent />;
            })()}
            Eventos del Equipo
          </button>
        </div>

        {/* Contenido de las secciones */}
        {/* Panel de notas de conocimiento */}
        {seccionActiva === 'notas' && (
          <div>
            <NotasKnowledgePanel token={token} />
          </div>
        )}

        {/* Panel de recursos de conocimiento */}
        {seccionActiva === 'recursos' && (
          <div>
            <RecursosKnowledgePanel token={token} />
          </div>
        )}

        {/* Panel de eventos de conocimiento */}
        {seccionActiva === 'eventos' && (
          <div>
            <EventosKnowledgePanel token={token} />
          </div>
        )}
      </div>
      
      {/* Chat de IA flotante */}
      <AssistantBubble />
    </div>
  );
};

export default KnowledgePage;