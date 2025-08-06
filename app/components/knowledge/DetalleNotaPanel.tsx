"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FaTrash, FaEye, FaFileAlt, FaEdit } from 'react-icons/fa';

const RecursosViewerModal = dynamic(() => import("../resources/RecursosViewerModal"), { ssr: false });

interface Nota {
  id: string;
  title: string;
  content: string;
  tipo: string;
  date?: string;
  descripcion?: string;
  tags?: string[];
  status?: string;
  priority?: string;
  relatedResources?: string[];
}

interface NotaConfig {
  icono: string;
  color: string;
  IconComponent: React.ComponentType<{ className?: string }>;

  hexColor: string;
  nombre: string;
}

interface DetalleNotaPanelProps {
  notaSeleccionada: Nota | null;
  eliminarNota: (nota: Nota) => void;
  renderizarContenidoMarkdown: (content: string) => React.ReactNode;
  onEdit?: (nota: Nota) => void;
  notaConfig?: NotaConfig;
}

const DetalleNotaPanel: React.FC<DetalleNotaPanelProps> = ({
  notaSeleccionada,
  eliminarNota, // eslint-disable-line @typescript-eslint/no-unused-vars
  renderizarContenidoMarkdown,
  onEdit,
  notaConfig,
}) => {
    const [modalRecursosOpen, setModalRecursosOpen] = useState(false);
    return (
      <div className="bg-secondary rounded-lg p-6 h-full">
        {notaSeleccionada ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className={`bg-primary/40 rounded-lg p-3 border-2 ${notaConfig?.color ? (notaConfig.color.split(' ').find(c => c.includes('border-')) || 'border-yellow-400') : 'border-yellow-400'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={notaConfig?.color?.split(' ').find(c=>c.startsWith('text-')) || 'text-yellow-400'}>
                    {notaConfig?.IconComponent ? React.createElement(notaConfig.IconComponent, { className: "text-lg" }) : <FaFileAlt />}
                  </span>
                  <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {notaSeleccionada.title}</h5>
                </div>
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(notaSeleccionada)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                      title="Editar nota"
                    >
                      <FaEdit /> Editar
                    </button>
                  )}
                  {eliminarNota && (
                    <button
                      onClick={() => eliminarNota(notaSeleccionada)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                      title="Eliminar nota"
                    >
                      <FaTrash /> Eliminar
                    </button>
                  )}
                </div>
              </div>
              {notaSeleccionada.descripcion && (
                <p className="text-gray-300 text-xs mb-2 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {notaSeleccionada.descripcion}</p>
              )}
              <div className="mb-4">
                {renderizarContenidoMarkdown(notaSeleccionada.content || '')}
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-2">
                {notaSeleccionada.tags && notaSeleccionada.tags.length > 0 && (
                  <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🏷️ <span className="font-bold">Etiquetas:</span> {notaSeleccionada.tags.join(', ')}</span>
                )}
                {notaSeleccionada.date && (
                  <span className="px-2 py-1 rounded bg-blue-400/20 text-blue-400">📅 <span className="font-bold">Fecha:</span> {notaSeleccionada.date}</span>
                )}
              </div>
              {/* Línea divisoria y sección de recursos relacionados, siempre visible */}
              <div className="border-t border-gray-600/30 pt-2 flex items-center gap-2 justify-end mt-2">
                {notaSeleccionada.relatedResources && notaSeleccionada.relatedResources.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 hover:text-indigo-200 font-bold transition border border-indigo-400/30 cursor-pointer"
                      onClick={() => setModalRecursosOpen(true)}
                      title="Ver recursos relacionados"
                    >
                      <span className="font-bold mr-1">📎 Recursos:</span> {notaSeleccionada.relatedResources.length}
                    </button>
                    {modalRecursosOpen && (
                      <RecursosViewerModal
                        open={modalRecursosOpen}
                        onClose={() => setModalRecursosOpen(false)}
                        recursoIds={notaSeleccionada.relatedResources}
                        token={typeof window !== 'undefined' ? (window.localStorage.getItem('token') || undefined) : undefined}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-gray-600/20 text-gray-400">
                    📎 Recursos: 0
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FaEye className="text-4xl mb-4 mx-auto" />
              <p>{'Selecciona una nota para ver sus detalles'}</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default DetalleNotaPanel;
