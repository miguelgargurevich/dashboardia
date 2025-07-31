"use client";
import React from "react";
import { FaEdit, FaTrash, FaEye, FaDownload } from "react-icons/fa";
import type { Recurso, Tema } from '../../lib/types';

interface DetalleRecursoPanelProps {
  recurso: Recurso | null;
  temas: Tema[];
  getTipoRecursoLabel: (tipo: string, tipoArchivo?: string) => string;
  formatFileSize: (bytes: number) => string;
  onEdit?: (recurso: Recurso) => void;
  onDelete?: (id: string) => void;
}

const DetalleRecursoPanel: React.FC<DetalleRecursoPanelProps> = ({
  recurso,
  getTipoRecursoLabel,
  formatFileSize,
  onEdit,
}) => {
  return (
    <div className="bg-secondary rounded-lg p-6 h-full">
      {recurso ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="bg-primary/40 rounded-lg p-3 border border-yellow-400/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  {/* Puedes agregar un icono de recurso aquí si lo tienes */}
                </span>
                <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {recurso.titulo}</h5>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(recurso?.url || recurso?.filePath, '_blank')}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                  title="Descargar recurso"
                >
                  <FaDownload /> Descargar
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(recurso)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                    title="Editar recurso"
                  >
                    <FaEdit /> Editar
                  </button>
                )}
                {/* Botón eliminar oculto temporalmente */}
                <button
                  style={{ display: 'none' }}
                  className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                  title="Eliminar recurso"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
            {recurso.descripcion && (
              <p className="text-gray-300 text-xs mb-2 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {recurso.descripcion}</p>
            )}
            <div className="mb-4 text-xs">
              <span className="font-semibold text-accent">Tipo:</span> {getTipoRecursoLabel(recurso.tipo, recurso.tipoArchivo)}
              <span className="ml-4 font-semibold text-accent">Tamaño:</span> {formatFileSize(recurso.tamaño || 0)}
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              {recurso.tags?.length > 0 && (
                <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🏷️ <span className="font-bold">Etiquetas:</span> {recurso.tags.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <FaEye className="text-4xl mb-4 mx-auto" />
            <p>{'Selecciona un recurso para ver sus detalles'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleRecursoPanel;
