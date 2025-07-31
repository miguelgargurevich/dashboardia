"use client";
import React from "react";
import { FaEdit, FaTrash, FaEyeSlash } from "react-icons/fa";
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
  temas,
  getTipoRecursoLabel,
  formatFileSize,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
      {recurso ? (
        <div>
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-accent mb-2">{recurso.titulo}</h2>
              {recurso.url && (
                <a
                  href={recurso.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  {recurso.url}
                </a>
              )}
              {recurso.filePath && (
                <a
                  href={recurso.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  {recurso.nombreOriginal || recurso.filePath}
                </a>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-400">
                  {temas.find(t => t.id === recurso.tema)?.nombre}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {getTipoRecursoLabel(recurso.tipo, recurso.tipoArchivo)}
                </span>
                {recurso.tamaño && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-gray-400">
                      {formatFileSize(recurso.tamaño)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(recurso)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  <FaEdit className="text-xs" />
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(recurso.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  <FaTrash className="text-xs" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {recurso.descripcion && (
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                <p className="text-gray-400">{recurso.descripcion}</p>
              </div>
            )}
            {recurso.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                  {recurso.tags.map((tag, index) => (
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
              <p>Subido: {recurso.fechaCarga ? new Date(recurso.fechaCarga).toLocaleDateString() : ''}</p>
              {recurso.nombreOriginal && (
                <p>Archivo original: {recurso.nombreOriginal}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <FaEyeSlash className="text-4xl mb-4 mx-auto" />
            <p>Selecciona un recurso para ver sus detalles</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleRecursoPanel;
