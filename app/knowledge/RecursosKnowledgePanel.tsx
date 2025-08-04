"use client";
import React, { useState, useCallback } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useRecursosConfig } from '../lib/useConfig';
import type { Recurso } from '../lib/types';
import DetalleRecursoPanel from '../components/resources/DetalleRecursoPanel';
import Modal from '../components/Modal';
import RecursoForm from '../components/resources/RecursoForm';

interface RecursosKnowledgePanelProps {
  token: string | null;
}

interface RecursoFormValues {
  titulo: string;
  descripcion?: string;
  tipo: string;
  archivo?: File | null;
  url?: string;
  etiquetas?: string[];
}

const RecursosKnowledgePanel: React.FC<RecursosKnowledgePanelProps> = ({ token }) => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormularioRecurso, setMostrarFormularioRecurso] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [busqueda, setBusqueda] = useState('');
  // Eliminamos los estados de sección y tipo seleccionado ya que solo tendremos vista de lista
  
  // Hook de configuración para recursos
  const { getRecursoConfig, loading: configLoading, items: tiposRecursos } = useRecursosConfig();

  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Función para cargar recursos
  const cargarRecursos = useCallback(async () => {
    if (!token) return;
    
    setCargando(true);
    try {
      const response = await fetch('/api/resources', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecursos(data.resources || []);
      }
    } catch (error) {
      console.error('Error cargando recursos:', error);
    } finally {
      setCargando(false);
    }
  }, [token]);

  // Effect para cargar recursos al montar el componente
  React.useEffect(() => {
    if (token) {
      cargarRecursos();
    }
  }, [token, cargarRecursos]);

  // Función para manejar submit del formulario
  const handleGuardarRecurso = async (values: RecursoFormValues) => {
    if (!token) return;

    try {
      const url = recursoEditando ? `/api/resources/${recursoEditando.id}` : '/api/resources';
      const method = recursoEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        await cargarRecursos();
        setMostrarFormularioRecurso(false);
        setRecursoEditando(null);
      } else {
        console.error('Error guardando recurso');
      }
    } catch (error) {
      console.error('Error guardando recurso:', error);
    }
  };

  // Función para editar recurso
  const handleEdit = (recurso: Recurso) => {
    setRecursoEditando(recurso);
    setMostrarFormularioRecurso(true);
  };

  // Función para eliminar recurso
  const handleDelete = async (recurso: Recurso) => {
    if (!token || !confirm('¿Estás seguro de que quieres eliminar este recurso?')) return;

    try {
      const response = await fetch(`/api/resources/${recurso.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await cargarRecursos();
        setRecursoSeleccionado(null);
      } else {
        console.error('Error eliminando recurso');
      }
    } catch (error) {
      console.error('Error eliminando recurso:', error);
    }
  };

  // Función para eliminar recurso - ajustada para la interfaz
  const handleDeleteById = async (id: string) => {
    const recurso = recursos.find(r => r.id === id);
    if (recurso) {
      await handleDelete(recurso);
    }
  };

  // Filtrar recursos según búsqueda
  const recursosFiltrados = recursos.filter(recurso => 
    recurso.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    recurso.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    recurso.tags.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Extraer etiquetas disponibles
  const etiquetasDisponibles = Array.from(new Set(
    recursos.flatMap(recurso => recurso.tags)
  )).sort();

  if (configLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-accent">Gestión de Recursos</h2>
        <button
          onClick={() => {
            setRecursoEditando(null);
            setMostrarFormularioRecurso(true);
          }}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus />
          Nuevo Recurso
        </button>
      </div>

      {/* Navegación de secciones eliminada - solo vista de lista */}

      {/* Buscador */}
      <div className="bg-secondary rounded-lg p-4">
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <FaSearch className="text-accent" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="flex-1 input-std"
            />
          </div>
        </div>
      </div>

      {/* Vista Lista - Todos los recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de recursos */}
        <div className="lg:col-span-1">
          <div className="bg-secondary rounded-lg p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-accent">
              Recursos ({recursosFiltrados.length})
            </h3>
            {cargando ? (
              <div className="text-center text-gray-400">Cargando...</div>
            ) : (
              <div className="space-y-3">
                {recursosFiltrados.map((recurso) => {
                  const config = getRecursoConfig(recurso.tipo);
                  const isSelected = recursoSeleccionado?.id === recurso.id;
                  return (
                    <button
                      key={recurso.id}
                      onClick={() => setRecursoSeleccionado(recurso)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'bg-accent/20 text-accent shadow-lg shadow-current/20 border-accent/40'
                          : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-accent/20 text-accent">
                          {React.createElement(config.IconComponent as React.ComponentType<{ className?: string }>, { className: "text-sm" })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {recurso.titulo}
                          </h4>
                          <p className="text-xs text-accent mt-1">
                            {config.nombre}
                          </p>
                          {recurso.tamaño && (
                            <p className="text-xs text-gray-400">
                              {formatFileSize(recurso.tamaño)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Panel de detalle */}
        <div className="lg:col-span-2">
          <DetalleRecursoPanel
            recurso={recursoSeleccionado}
            getTipoRecursoLabel={(tipo: string) => getRecursoConfig(tipo).nombre}
            getRecursoConfig={getRecursoConfig}
            formatFileSize={formatFileSize}
            onEdit={handleEdit}
            onDelete={handleDeleteById}
          />
        </div>
      </div>

      {/* Modal para formulario de recurso */}
      {mostrarFormularioRecurso && (
        <Modal 
          open={mostrarFormularioRecurso} 
          onClose={() => { setMostrarFormularioRecurso(false); setRecursoEditando(null); }} 
          title={recursoEditando ? 'Editar Recurso' : 'Nuevo Recurso'} 
          maxWidth="max-w-2xl"
        >
                    <RecursoForm
            initialValues={recursoEditando || undefined}
            tiposRecursos={tiposRecursos.map(item => ({
              id: item.id,
              nombre: item.nombre,
              descripcion: item.descripcion || '',
              color: item.color || ''
            }))}
            etiquetasDisponibles={etiquetasDisponibles}
            onSubmit={handleGuardarRecurso}
            onCancel={() => { setMostrarFormularioRecurso(false); setRecursoEditando(null); }}
            submitLabel={recursoEditando ? 'Actualizar' : 'Crear'}
          />
        </Modal>
      )}
    </div>
  );
};

export default RecursosKnowledgePanel;
