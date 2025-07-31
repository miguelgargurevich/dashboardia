"use client";


import React, { useState } from "react";
import { FaSearch, FaEye, FaEdit, FaTrash, FaPlus, FaLayerGroup } from "react-icons/fa";
import RecursoForm from "../components/resources/RecursoForm";

// Tipos auxiliares
interface Recurso {
  id: string;
  tipo: string;
  tipoArchivo?: string;
  titulo: string;
  tema?: string;
  tamaño?: number;
  url?: string;
  filePath?: string;
  nombreOriginal?: string;
  descripcion?: string;
  tags?: string[];
  fechaCarga?: string;
}

// Importar los tipos correctos de RecursoForm
import type { Tema, TipoRecurso } from "../components/resources/RecursoForm";

interface RecursosArchivosPanelProps {
  recursos: Recurso[];
  cargando?: boolean;
  recursoSeleccionado: Recurso | null;
  setRecursoSeleccionado: (recurso: Recurso | null) => void;
  // setRecursoEditando: (recurso: Recurso) => void;
  // setMostrarFormularioRecurso: (mostrar: boolean) => void;
  // eliminarRecurso: (id: string) => void;
  busqueda: string;
  setBusqueda: (valor: string) => void;
  filtroTipo: string;
  setFiltroTipo: (valor: string) => void;
  tiposRecursos: TipoRecurso[];
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (valor: string) => void;
  temas: Tema[];
  getIconoTipoRecurso: (tipo: string, tipoArchivo?: string) => React.ReactNode;
  getTipoRecursoLabel: (tipo: string, tipoArchivo?: string) => string;
  formatFileSize: (size: number) => string;
}

const RecursosArchivosPanel: React.FC<RecursosArchivosPanelProps> = ({
  recursos = [],
  cargando = false,
  recursoSeleccionado,
  setRecursoSeleccionado,
  busqueda,
  setBusqueda,
  filtroTipo,
  setFiltroTipo,
  tiposRecursos = [],
  etiquetasDisponibles = [],
  filtroEtiqueta,
  setFiltroEtiqueta,

  temas,
  // getIconoTipoRecurso,
  getTipoRecursoLabel,
  formatFileSize,
}) => {
  // Estado para formulario y edición
  const [showRecursoForm, setShowRecursoForm] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  const [modoForm, setModoForm] = useState<'crear' | 'editar'>('crear');
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  const [recursosState] = useState<Recurso[]>(recursos);

  // Handlers para nuevo, editar, guardar, cancelar
  const handleNuevoRecurso = () => {
    setModoForm('crear');
    setRecursoEditando(null);
    setShowRecursoForm(true);
  };
  const handleEditarRecurso = (recurso: Recurso) => {
    setModoForm('editar');
    setRecursoEditando(recurso);
    setShowRecursoForm(true);
  };
  const handleGuardarRecurso = async (values: any) => {
    let res;
    try {
      setLoadingRecursos(true);
      if (modoForm === 'editar' && recursoEditando) {
        res = await fetch(`/api/resources/${recursoEditando.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
          },
          body: JSON.stringify(values)
        });
      } else {
        // Crear nuevo recurso
        const formData = new FormData();
        formData.append('titulo', values.titulo);
        formData.append('descripcion', values.descripcion || '');
        formData.append('tipo', values.tipo);
        formData.append('tema', values.tema);
        if (values.archivo) formData.append('file', values.archivo);
        if (values.url) formData.append('url', values.url);
        if (values.etiquetas) formData.append('tags', JSON.stringify(values.etiquetas));
        res = await fetch('/api/resources/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
          },
          body: formData
        });
      }
      if (!res.ok) throw new Error('Error al guardar el recurso');
      setShowRecursoForm(false);
      setRecursoEditando(null);
      // Aquí deberías recargar los recursos desde la API si es necesario
    } catch (err) {
      alert('Ocurrió un error al guardar el recurso.');
    } finally {
      setLoadingRecursos(false);
    }
  };
  const handleCancelar = () => {
    setShowRecursoForm(false);
    setRecursoEditando(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista y filtros */}
      <div className="lg:col-span-1">
        {/* Botón para nuevo recurso */}
        <div className="flex justify-end mb-2">
          <button
            className="btn btn-accent btn-sm"
            onClick={handleNuevoRecurso}
            type="button"
          >
            <FaPlus className="mr-1" /> Nuevo recurso
          </button>
        </div>
        <div className="bg-secondary rounded-lg p-4">
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <FaSearch className="text-accent" />
              <input
                type="text"
                placeholder="Buscar recursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 input-std"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full input-std"
              >
                <option value="">Todos los tipos</option>
                {tiposRecursos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                ))}
              </select>
            </div>
            {etiquetasDisponibles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
                <select
                  value={filtroEtiqueta}
                  onChange={(e) => setFiltroEtiqueta(e.target.value)}
                  className="w-full input-std"
                >
                  <option value="">Todas las etiquetas</option>
                  {etiquetasDisponibles.map((etiqueta) => (
                    <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {loadingRecursos ? (
            <div className="text-center py-8">
              <div className="text-accent">Cargando recursos...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recursosState.map((recurso) => (
                <button
                  key={recurso.id}
                  onClick={() => setRecursoSeleccionado(recurso)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 cursor-pointer
                    ${recursoSeleccionado?.id === recurso.id
                      ? 'bg-accent/30 text-accent shadow-lg shadow-current/20 border-accent'
                      : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'}
                  `}
                >
                  <div className="flex-shrink-0 p-3 rounded-lg flex items-center justify-center bg-accent/20 text-accent">
                    {/* Icono de recurso */}
                    <FaLayerGroup className="text-2xl text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-base truncate flex-1">{recurso.titulo}</h3>
                      {recurso.tamaño && (
                        <span className="text-xs text-gray-400">{formatFileSize(recurso.tamaño)}</span>
                      )}
                    </div>
                    <p className="text-xs text-accent mb-2 font-medium">
                      {temas.find(t => t.id === recurso.tema)?.nombre} · {getTipoRecursoLabel(recurso.tipo, recurso.tipoArchivo)}
                    </p>
                    {recurso.tags && recurso.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {recurso.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent"
                          >
                            #{tag}
                          </span>
                        ))}
                        {recurso.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{recurso.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                    {recurso.descripcion && (
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {recurso.descripcion.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Panel lateral de detalle */}
      <div className="lg:col-span-2">
        <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
          {recursoSeleccionado ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaLayerGroup className="text-accent text-2xl" />
                <h2 className="text-xl font-bold text-accent flex-1 truncate">{recursoSeleccionado.titulo}</h2>
              </div>
              {recursoSeleccionado.url && (
                <a
                  href={recursoSeleccionado.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all mb-2 block"
                >
                  {recursoSeleccionado.url}
                </a>
              )}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleEditarRecurso(recursoSeleccionado)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  <FaEdit className="text-xs" />
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Estás seguro de eliminar este recurso?')) {
                      try {
                        const res = await fetch(`/api/resources/${recursoSeleccionado.id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
                          }
                        });
                        if (!res.ok) throw new Error('Error al eliminar el recurso');
                        setRecursoEditando(null);
                        setShowRecursoForm(false);
                        setModoForm('crear');
                        setRecursoSeleccionado(null);
                        // Aquí deberías recargar los recursos desde la API si es necesario
                      } catch (err) {
                        alert('Ocurrió un error al eliminar el recurso.');
                      }
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  <FaTrash className="text-xs" />
                  Eliminar
                </button>
                <button
                  onClick={() => setRecursoSeleccionado(null)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600/20 text-gray-300 rounded hover:bg-gray-700/30 transition-colors"
                >
                  Cerrar
                </button>
              </div>
              <div className="space-y-4">
                {recursoSeleccionado.descripcion && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                    <p className="text-gray-400">{recursoSeleccionado.descripcion}</p>
                  </div>
                )}
                {recursoSeleccionado.tags && recursoSeleccionado.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {recursoSeleccionado.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent/20 text-accent rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Subido: {new Date(recursoSeleccionado.fechaCarga || 0).toLocaleDateString()}</p>
                  {recursoSeleccionado.nombreOriginal && (
                    <p>Archivo original: {recursoSeleccionado.nombreOriginal}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FaEye className="text-4xl mb-4 mx-auto" />
                <p>Selecciona un recurso para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Formulario de edición/creación de recurso reutilizable */}
      {showRecursoForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-secondary rounded-lg p-6 w-full max-w-lg shadow-lg relative">
            <RecursoForm
              initialValues={modoForm === 'editar' ? recursoEditando || undefined : undefined}
              temas={temas}
              tiposRecursos={tiposRecursos}
              etiquetasDisponibles={etiquetasDisponibles}
              onSubmit={handleGuardarRecurso}
              onCancel={handleCancelar}
              submitLabel={modoForm === 'editar' ? 'Guardar cambios' : 'Crear recurso'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosArchivosPanel;
