"use client";


import React, { useState } from "react";
import { FaSearch, FaEye, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
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
  // cargando = false,
  recursoSeleccionado,
  setRecursoSeleccionado,
  // setRecursoEditando,
  // setMostrarFormularioRecurso,
  // eliminarRecurso,
  busqueda,
  setBusqueda,
  filtroTipo,
  setFiltroTipo,
  tiposRecursos = [],
  etiquetasDisponibles = [],
  filtroEtiqueta,
  setFiltroEtiqueta,
  temas = [],
  getIconoTipoRecurso,
  getTipoRecursoLabel,
  formatFileSize
}) => {
  // Estado para mostrar el formulario de edición/creación
  const [showRecursoForm, setShowRecursoForm] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  const [modoForm, setModoForm] = useState<'crear' | 'editar'>('crear');
  const [loadingRecursos, setLoadingRecursos] = useState(false);
  const [recursosState, setRecursosState] = useState<Recurso[]>(recursos);

  // Refrescar recursos
  const fetchRecursos = async () => {
    setLoadingRecursos(true);
    try {
      const res = await fetch('/api/resources');
      if (!res.ok) throw new Error('Error al cargar recursos');
      const data = await res.json();
      setRecursosState(Array.isArray(data) ? data : []);
    } catch {
      setRecursosState([]);
    } finally {
      setLoadingRecursos(false);
    }
  };

  // Handler para abrir el formulario de edición
  const handleEditarRecurso = (recurso: Recurso) => {
    setRecursoEditando(recurso);
    setModoForm('editar');
    setShowRecursoForm(true);
  };

  // Handler para abrir el formulario de nuevo recurso
  const handleNuevoRecurso = () => {
    setRecursoEditando(null);
    setModoForm('crear');
    setShowRecursoForm(true);
  };

  // Handler para guardar el recurso (creación o edición real)
  const handleGuardarRecurso = async (values: any) => {
    try {
      let res;
      if (modoForm === 'editar' && recursoEditando?.id) {
        // Actualizar recurso existente
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
      await fetchRecursos();
    } catch (err) {
      alert('Ocurrió un error al guardar el recurso.');
    }
  };

  // Handler para cancelar
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
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                    recursoSeleccionado?.id === recurso.id
                      ? 'bg-accent/30 text-accent shadow-lg shadow-current/20 border-accent'
                      : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-accent/20 text-accent`}>
                      {getIconoTipoRecurso(recurso.tipo, recurso.tipoArchivo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate mb-1">{recurso.titulo}</h3>
                      <p className="text-xs text-accent mb-2 font-medium">
                        {temas.find(t => t.id === recurso.tema)?.nombre} • {getTipoRecursoLabel(recurso.tipo, recurso.tipoArchivo)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {recurso.tamaño && (
                          <span className="text-xs text-gray-400">
                            {formatFileSize(recurso.tamaño)}
                          </span>
                        )}
                      </div>
                    </div>
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
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-accent mb-2">{recursoSeleccionado.titulo}</h2>
                  {recursoSeleccionado.url && (
                    <a
                      href={recursoSeleccionado.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {recursoSeleccionado.url}
                    </a>
                  )}
                  {recursoSeleccionado.filePath && (
                    <a
                      href={recursoSeleccionado.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {recursoSeleccionado.nombreOriginal || recursoSeleccionado.filePath}
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-400">
                      {temas.find(t => t.id === recursoSeleccionado.tema)?.nombre}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">
                      {getTipoRecursoLabel(recursoSeleccionado.tipo, recursoSeleccionado.tipoArchivo)}
                    </span>
                    {recursoSeleccionado.tamaño && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-sm text-gray-400">
                          {formatFileSize(recursoSeleccionado.tamaño)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
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
                          await fetchRecursos();
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
              </div>
              <div className="space-y-4">
                {recursoSeleccionado.descripcion && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                    <p className="text-gray-400">{recursoSeleccionado.descripcion}</p>
                  </div>
                )}
                {recursoSeleccionado.url && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Enlace</h4>
                    <a
                      href={recursoSeleccionado.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm break-all"
                    >
                      {recursoSeleccionado.url}
                    </a>
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
