"use client";
import React from "react";
import { FaSearch, FaFileAlt, FaBook, FaVideo, FaEye, FaEdit } from "react-icons/fa";

interface Nota {
  id?: string;
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
  tema: string;
  priority?: string;
  date?: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface NotasDocumentosPanelProps {
  notas: Nota[];
  temas: Tema[];
  notaSeleccionada: Nota | null;
  setNotaSeleccionada: (nota: Nota) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (v: string) => void;
  cargando: boolean;
  descargarNota: (nota: Nota) => void;
  eliminarNota: (nota: Nota) => void;
  onEditarNota?: (nota: Nota) => void;
}

const NotasDocumentosPanel: React.FC<NotasDocumentosPanelProps> = ({
  notas,
  temas,
  notaSeleccionada,
  setNotaSeleccionada,
  busqueda,
  setBusqueda,
  etiquetasDisponibles,
  filtroEtiqueta,
  setFiltroEtiqueta,
  cargando,
  descargarNota,
  eliminarNota,
  onEditarNota
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de notas */}
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
          </div>
          {cargando ? (
            <div className="text-center py-8">
              <div className="text-accent">Cargando notas...</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notas.map((nota, index) => {
                // Unificar iconos y colores como en TodoConocimientoPanel
                let icono = <FaFileAlt className={`text-accent`} />;
                let color = 'bg-accent/20 text-accent';
                let nombreTipo = 'Nota';
                if (nota.tipo === 'nota') {
                  icono = <FaFileAlt className="text-accent" />;
                  color = 'bg-accent/20 text-accent';
                  nombreTipo = 'Nota';
                } else if (nota.tipo === 'documento') {
                  icono = <FaBook className="text-green-300" />;
                  color = 'bg-green-900/20 text-green-300';
                  nombreTipo = 'Documento';
                } else if (nota.tipo === 'video') {
                  icono = <FaVideo className="text-yellow-300" />;
                  color = 'bg-yellow-900/20 text-yellow-300';
                  nombreTipo = 'Video';
                } else if (['incidente','mantenimiento','reunion','capacitacion','otro'].includes(nota.tipo)) {
                  icono = <FaFileAlt className="text-accent" />;
                  color = 'bg-accent/20 text-accent';
                  nombreTipo = nota.tipo.charAt(0).toUpperCase() + nota.tipo.slice(1);
                }
                const isSelected = notaSeleccionada?.nombre === nota.nombre;
                return (
                  <button
                    key={index}
                    onClick={() => setNotaSeleccionada(nota)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border ${
                      isSelected
                        ? `${color} shadow-lg shadow-current/20`
                        : `bg-gradient-to-r from-primary to-secondary/50 hover:${color.replace('text-', 'from-').replace('border-', 'from-').split(' ')[0]?.replace('900/20', '400/10') || 'from-accent/10'} hover:to-accent/5 border border-gray-700/50 hover:border-current/30 shadow-md hover:shadow-lg`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/30') || 'bg-accent/30'
                          : color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/20') || 'bg-accent/20'
                      }`}>
                        {icono}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{nota.nombre}</h3>
                        <p className={`text-xs mb-1 font-medium ${color.split(' ')[1] || 'text-accent'}`}>{nombreTipo}</p>
                        {nota.etiquetas && nota.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {nota.etiquetas.slice(0, 3).map((etiqueta, etIndex) => (
                              <span
                                key={etIndex}
                                className={`px-1.5 py-0.5 rounded text-xs ${color.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('900/20', '500/20') || 'bg-accent/20'} ${color.split(' ')[1] || 'text-accent'}`}
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
                    {temas.find(t => t.id === notaSeleccionada.tema)?.nombre}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEditarNota && notaSeleccionada && onEditarNota(notaSeleccionada)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    disabled={!onEditarNota}
                  >
                    <FaEdit className="text-sm" />
                    Editar
                  </button>
                  <button 
                    onClick={() => descargarNota(notaSeleccionada)}
                    className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                  >
                    <FaFileAlt className="text-sm" />
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
                    <FaEye className="text-sm" />
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                {notaSeleccionada.contenido}
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
};

export default NotasDocumentosPanel;
