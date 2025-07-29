import type { Tema } from '../../lib/types';
import React from 'react';
import { FaSearch, FaFileAlt, FaBook, FaVideo, FaDownload, FaTrash, FaEye } from 'react-icons/fa';

interface NotasPanelProps {
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponiblesNotas: string[];
  filtroEtiquetaNota: string;
  setFiltroEtiquetaNota: (v: string) => void;
  cargando: boolean;
  notasFiltradas: any[];
  temas: any[];
  notaSeleccionada: any;
  setNotaSeleccionada: (n: any) => void;
  descargarNota: (n: any) => void;
  eliminarNota: (n: any) => void;
  renderizarContenidoMarkdown: (c: string) => React.ReactNode;
}

const NotasPanel: React.FC<NotasPanelProps> = ({
  busqueda,
  setBusqueda,
  etiquetasDisponiblesNotas,
  filtroEtiquetaNota,
  setFiltroEtiquetaNota,
  cargando,
  notasFiltradas,
  temas,
  notaSeleccionada,
  setNotaSeleccionada,
  descargarNota,
  eliminarNota,
  renderizarContenidoMarkdown
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-1">
      <div className="bg-secondary rounded-lg p-4">
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-2">
            <FaSearch className="text-accent" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 input-std"
            />
          </div>
          {etiquetasDisponiblesNotas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
              <select
                value={filtroEtiquetaNota}
                onChange={(e) => setFiltroEtiquetaNota(e.target.value)}
                className="w-full input-std"
              >
                <option value="">Todas las etiquetas</option>
                {etiquetasDisponiblesNotas.map(etiqueta => (
                  <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                ))}
              </select>
            </div>
          )}
          {(busqueda || filtroEtiquetaNota) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroEtiquetaNota('');
              }}
              className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {cargando ? (
          <div className="text-center py-8">
            <div className="text-accent">Cargando notas...</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notasFiltradas.map((nota, index) => {
              const temaInfo = temas.find((t: any) => t.id === nota.tema);
              const isSelected = notaSeleccionada?.nombre === nota.nombre;
              return (
                <button
                  key={index}
                  onClick={() => setNotaSeleccionada(nota)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                    isSelected
                      ? `${temaInfo?.color} shadow-lg shadow-current/20`
                      : `bg-gradient-to-r from-primary to-secondary/50 hover:${temaInfo?.color?.replace('text-', 'from-').replace('border-', 'from-').split(' ')[1]?.replace('400', '400/10') || 'from-accent/10'} hover:to-accent/5 border border-gray-700/50 hover:border-current/30 shadow-md hover:shadow-lg`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected
                        ? `${temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/30') || 'bg-accent/30'}`
                        : `${temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/20') || 'bg-accent/20'}`
                    }`}>
                      {nota.tipo === 'nota' ? <FaFileAlt className={`text-sm ${temaInfo?.color?.split(' ')[1] || 'text-accent'}`} /> :
                        nota.tipo === 'documento' ? <FaBook className={`text-sm ${temaInfo?.color?.split(' ')[1] || 'text-accent'}`} /> :
                          <FaVideo className={`text-sm ${temaInfo?.color?.split(' ')[1] || 'text-accent'}`} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{nota.nombre}</h3>
                      <p className={`text-xs mb-1 font-medium ${temaInfo?.color?.split(' ')[1] || 'text-accent'}`}>{temaInfo?.nombre}</p>
                      {nota.etiquetas && nota.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {nota.etiquetas.slice(0, 3).map((etiqueta: string, etIndex: number) => (
                            <span
                              key={etIndex}
                              className={`px-1.5 py-0.5 rounded text-xs ${
                                temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/20') || 'bg-accent/20'
                              } ${temaInfo?.color?.split(' ')[1] || 'text-accent'}`}
                            >
                              {etiqueta}
                            </span>
                          ))}
                          {nota.etiquetas.length > 3 && (
                            <span className="text-xs text-gray-400">+{nota.etiquetas.length - 3}</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {nota.contenido.slice(0, 100)}...
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
    {/* Panel de detalles */}
    <div className="lg:col-span-2">
      <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
        {notaSeleccionada ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-accent">{notaSeleccionada.nombre}</h2>
                <p className="text-sm text-gray-400">
                  {temas.find((t: any) => t.id === notaSeleccionada.tema)?.nombre}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => descargarNota(notaSeleccionada)}
                  className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                >
                  <FaDownload className="text-sm" />
                  Descargar
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta nota?')) {
                      eliminarNota(notaSeleccionada);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  <FaTrash className="text-sm" />
                  Eliminar
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              {renderizarContenidoMarkdown(notaSeleccionada.contenido)}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FaEye className="text-4xl mb-4 mx-auto" />
              <p>Selecciona un documento para visualizar su contenido</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default NotasPanel;
