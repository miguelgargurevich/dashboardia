"use client";
import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFileAlt, FaListUl, FaLayerGroup } from 'react-icons/fa';
import { useConfig, getIconComponent } from '../lib/useConfig';

interface RecursosKnowledgePanelProps {
  token: string | null;
}

const RecursosKnowledgePanel: React.FC<RecursosKnowledgePanelProps> = ({ token }) => {
  const [seccionActiva, setSeccionActiva] = useState<'lista' | 'tipos'>('lista');
  
  // Hook de configuración para recursos
  const recursosConfig = useConfig('recursos');
  const temasConfig = useConfig('temas');

  if (recursosConfig.loading || temasConfig.loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-gray-400">Cargando configuración de recursos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-accent">Gestión de Recursos</h2>
        <button
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus />
          Nuevo Recurso
        </button>
      </div>

      {/* Navegación de secciones */}
      <div className="flex space-x-1 mb-6 bg-secondary/50 p-1 rounded-lg">
        <button
          onClick={() => setSeccionActiva('lista')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'lista'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaListUl className="text-sm" />
          Lista de Recursos
        </button>
        <button
          onClick={() => setSeccionActiva('tipos')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'tipos'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaLayerGroup className="text-sm" />
          Por Tipo
        </button>
      </div>

      {/* Contenido temporal - será reemplazado con funcionalidad completa */}
      <div className="bg-secondary rounded-lg p-6">
        <div className="text-center text-gray-400">
          <FaFileAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">Panel de Recursos en Desarrollo</p>
          <p className="text-sm">Sección activa: {seccionActiva}</p>
          <p className="text-sm">Total de tipos configurados: {recursosConfig.items.length}</p>
        </div>
      </div>
    </div>
  );
};

export default RecursosKnowledgePanel;
