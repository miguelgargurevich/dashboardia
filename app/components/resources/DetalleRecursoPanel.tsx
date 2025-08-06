"use client";
import React from "react";
import { FaEdit, FaTrash, FaEye, FaDownload } from "react-icons/fa";
import type { Recurso } from '../../lib/types';

interface DetalleRecursoPanelProps {
  recurso: Recurso | null;
  getTipoRecursoLabel: (tipo: string, tipoArchivo?: string) => string;
  getRecursoConfig?: (tipo: string) => { IconComponent: React.ComponentType<{ className?: string }>; color: string; nombre: string };
  formatFileSize: (bytes: number) => string;
  onEdit?: (recurso: Recurso) => void;
  onDelete?: (id: string) => void;
}

const DetalleRecursoPanel: React.FC<DetalleRecursoPanelProps> = ({
  recurso,
  getTipoRecursoLabel,
  getRecursoConfig,
  formatFileSize,
  onEdit,
}) => {
  return (
    <div className="bg-secondary rounded-lg p-6 h-full">
      {recurso ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className={`bg-primary/40 rounded-lg p-3 border-2 ${getRecursoConfig && recurso.tipo ? (getRecursoConfig(recurso.tipo).color.split(' ').find(c => c.includes('border-')) || 'border-yellow-400') : 'border-yellow-400'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRecursoConfig && recurso.tipo && (() => {
                  const config = getRecursoConfig(recurso.tipo);
                  const textColor = config.color.split(' ').find(c => c.startsWith('text-')) || 'text-yellow-400';
                  const IconComponent = config.IconComponent;
                  return <span className={textColor}><IconComponent className="w-4 h-4" /></span>;
                })()}
                <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {recurso.titulo}</h5>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (recurso?.filePath) {
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
                        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
                        const key = recurso.filePath.replace(/^https?:\/\/[^/]+\//, '');
                        const res = await fetch(`${backendUrl}/api/resources/download/${encodeURIComponent(key)}`, {
                          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
                        });
                        const data = await res.json();
                        if (data.downloadUrl) {
                          window.open(data.downloadUrl, '_blank');
                        } else {
                          alert('No se pudo obtener el enlace de descarga.');
                        }
                      } catch (err) {
                        alert('Error al descargar el archivo.');
                      }
                    } else if (recurso?.url) {
                      // Solo abrir si es un enlace externo (no archivo subido)
                      if (recurso.url && !recurso.filePath && recurso.url.startsWith('http')) {
                        window.open(recurso.url, '_blank');
                      } else {
                        alert('No se puede descargar el recurso.');
                      }
                    }
                  }}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                  title="Descargar recurso"
                >
                  <FaDownload /> Descargar
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
