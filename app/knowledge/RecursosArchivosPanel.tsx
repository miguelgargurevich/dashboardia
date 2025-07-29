"use client";
import React from "react";
import { FaSearch, FaVideo, FaLayerGroup, FaEye, FaEdit, FaTrash } from "react-icons/fa";

interface Recurso {
  id: string;
  tipo: string;
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  tags: string[];
  tema: string;
  fechaCarga: string;
  tipoArchivo?: string;
  tamaño?: number;
  nombreOriginal?: string;
}

interface Tema {
  id: string;
  nombre: string;
}

interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface RecursosArchivosPanelProps {
  recursos: Recurso[];
  temas: Tema[];
  tiposRecursos: TipoRecurso[];
  recursoSeleccionado: Recurso | null;
  setRecursoSeleccionado: (r: Recurso | null) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (v: string) => void;
  cargando: boolean;
  getIconoTipoRecurso: (tipo: string, tipoArchivo?: string) => React.ReactNode;
  getTipoRecursoLabel: (tipo: string, tipoArchivo?: string) => string;
  formatFileSize: (bytes: number) => string;
  eliminarRecurso: (id: string) => void;
  setRecursoEditando: (r: Recurso) => void;
  setMostrarFormularioRecurso: (v: boolean) => void;
}

const RecursosArchivosPanel: React.FC<RecursosArchivosPanelProps> = ({
  recursos,
  temas,
  tiposRecursos,
  recursoSeleccionado,
  setRecursoSeleccionado,
  busqueda,
  setBusqueda,
  filtroTipo,
  setFiltroTipo,
  etiquetasDisponibles,
  filtroEtiqueta,
  setFiltroEtiqueta,
  cargando,
  getIconoTipoRecurso,
  getTipoRecursoLabel,
  formatFileSize,
  eliminarRecurso,
  setRecursoEditando,
  setMostrarFormularioRecurso
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de filtros y lista */}
      <div className="lg:col-span-1">
        <div className="bg-secondary rounded-lg p-4">
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <FaSearch className="text-accent" />
              <input
                type="text"
                placeholder="Buscar recursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
              >
                <option value="">Todos los tipos</option>
                {tiposRecursos.map(tipo => (
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
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                >
                  <option value="">Todas las etiquetas</option>
                  {etiquetasDisponibles.map(etiqueta => (
                    <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {cargando ? (
            <div className="text-center py-8">
              <div className="text-accent">Cargando recursos...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recursos.map((recurso) => (
                <div
                  key={recurso.id}
                  onClick={() => setRecursoSeleccionado(recurso)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                    recursoSeleccionado?.id === recurso.id
                      ? 'bg-gradient-to-r from-accent/20 to-accent/10 border border-accent shadow-lg shadow-accent/20'
                      : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      recursoSeleccionado?.id === recurso.id 
                        ? 'bg-accent/30' 
                        : 'bg-accent/20'
                    }`}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Panel de detalles */}
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
                    onClick={() => {
                      setRecursoEditando(recursoSeleccionado);
                      setMostrarFormularioRecurso(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    <FaEdit className="text-xs" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este recurso?')) {
                        eliminarRecurso(recursoSeleccionado.id);
                        setRecursoSeleccionado(null);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                  >
                    <FaTrash className="text-xs" />
                    Eliminar
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
                {recursoSeleccionado.tags.length > 0 && (
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
                  <p>Subido: {new Date(recursoSeleccionado.fechaCarga).toLocaleDateString()}</p>
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
    </div>
  );
};

export default RecursosArchivosPanel;
