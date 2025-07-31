"use client";
import React from "react";
import { FaSearch } from "react-icons/fa";
import DetalleRecursoPanel from "./DetalleRecursoPanel";


import type { Recurso, Tema } from '../../lib/types';

interface RecursosArchivosPanelProps {
  recursos: import('../../lib/types').Recurso[];
  temas: import('../../lib/types').Tema[];
  recursoSeleccionado: import('../../lib/types').Recurso | null;
  setRecursoSeleccionado: React.Dispatch<React.SetStateAction<import('../../lib/types').Recurso | null>>;
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  cargando: boolean;
  getIconoTipoRecurso: (tipo: string, tipoArchivo?: string) => React.ReactNode;
  getTipoRecursoLabel: (tipo: string, tipoArchivo?: string) => string;
  formatFileSize: (bytes: number) => string;
  temaSeleccionado: string | null;
  setRecursoEditando?: React.Dispatch<React.SetStateAction<import('../../lib/types').Recurso | null>>;
  setMostrarFormularioRecurso: (v: boolean) => void;
  eliminarRecurso: (id: string) => void;
}

const RecursosArchivosPanel: React.FC<RecursosArchivosPanelProps> = ({
  recursos,
  temas,
  recursoSeleccionado,
  setRecursoSeleccionado,
  busqueda,
  setBusqueda,
  etiquetasDisponibles,
  filtroEtiqueta,
  setFiltroEtiqueta,
  filtroTipo,
  setFiltroTipo,
  cargando,
  getIconoTipoRecurso,
  getTipoRecursoLabel,
  formatFileSize,
  temaSeleccionado,
  setRecursoEditando,
  setMostrarFormularioRecurso,
  eliminarRecurso
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
                className="flex-1 input-std"
              />
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
                  {etiquetasDisponibles.map(etiqueta => (
                    <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                  ))}
                </select>
              </div>
            )}
            {(busqueda || filtroTipo || filtroEtiqueta) && (
              <button
                onClick={() => {
                  setBusqueda('');
                  setFiltroTipo('');
                  setFiltroEtiqueta('');
                }}
                className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          {cargando ? (
            <div className="text-center py-8">
              <div className="text-accent">Cargando recursos...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recursos.filter(recurso => {
                const matchBusqueda = recurso.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                  (recurso.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || false);
                const matchTipo = !filtroTipo || recurso.tipo === filtroTipo;
                const matchEtiqueta = !filtroEtiqueta || recurso.tags.includes(filtroEtiqueta);
                const matchTema = !temaSeleccionado || recurso.tema === temaSeleccionado;
                return matchBusqueda && matchTipo && matchEtiqueta && matchTema;
              }).map((recurso) => (
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
        <DetalleRecursoPanel
          recurso={recursoSeleccionado}
          temas={temas}
          getTipoRecursoLabel={getTipoRecursoLabel}
          formatFileSize={formatFileSize}
          onEdit={setRecursoEditando ? (r) => { setRecursoEditando(r); setMostrarFormularioRecurso(true); } : undefined}
          onDelete={recursoSeleccionado ? (id) => { if (confirm('¿Estás seguro de eliminar este recurso?')) { eliminarRecurso(id); setRecursoSeleccionado(null); } } : undefined}
        />
      </div>
    </div>
  );
};

export default RecursosArchivosPanel;
