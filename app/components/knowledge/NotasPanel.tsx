import type { Tema } from '../../lib/types';
import React from 'react';
import { FaSearch } from 'react-icons/fa';
import DetalleNotaPanel from './DetalleNotaPanel';

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface NotasPanelProps {
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponiblesNotas: string[];
  filtroEtiquetaNota: string;
  setFiltroEtiquetaNota: (v: string) => void;
  cargando: boolean;
  notasFiltradas: any[];
  temas: any[];
  tiposNotas: TipoNota[];
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
  renderizarContenidoMarkdown,
  tiposNotas
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
              const tipoNota = (tiposNotas && Array.isArray(tiposNotas)) ? tiposNotas.find((t: any) => t.id === nota.tipo) || tiposNotas[0] : { color: 'bg-accent/20 text-accent', nombre: nota.tipo };
              const [bgColor, textColor] = tipoNota.color.split(' ');
              const isSelected = notaSeleccionada?.nombre === nota.nombre;
              return (
                <button
                  key={index}
                  onClick={() => setNotaSeleccionada(nota)}
                  className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-900/20 text-yellow-300 shadow-lg shadow-current/20 border-yellow-400/40'
                      : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-yellow-900/10 hover:to-accent/5 border border-gray-700/50 hover:border-yellow-400/30 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-900/20 text-yellow-300">
                      <div className={`w-4 h-4 rounded-full ${bgColor}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-base truncate flex-1">{nota.nombre}</h3>
                      <div className="text-xs text-yellow-300 mb-1">
                        {tipoNota.nombre}
                      </div>
                      {nota.etiquetas && nota.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {nota.etiquetas.slice(0, 3).map((etiqueta: string, etIndex: number) => (
                            <span
                              key={etIndex}
                              className="px-1.5 py-0.5 rounded text-xs bg-yellow-900/20 text-yellow-300"
                            >
                              {etiqueta}
                            </span>
                          ))}
                          {nota.etiquetas.length > 3 && (
                            <span className="text-xs text-gray-400">+{nota.etiquetas.length - 3}</span>
                          )}
                        </div>
                      )}
                      {nota.contenido && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-1">{nota.contenido.slice(0, 100)}...</p>}
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
      <DetalleNotaPanel
        notaSeleccionada={notaSeleccionada}
        temas={temas}
        descargarNota={descargarNota}
        eliminarNota={eliminarNota}
        renderizarContenidoMarkdown={renderizarContenidoMarkdown}
      />
    </div>
  </div>
);

export default NotasPanel;
