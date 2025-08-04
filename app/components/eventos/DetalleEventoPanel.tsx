import React from 'react';
import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { useEventosConfig } from '../../lib/useConfig';
import { Event } from '../../lib/types';

export interface DetalleEventoPanelProps {
  eventoSeleccionado: Event | null;
  onEdit: (evento: Event) => void;
  onDelete: (evento: Event) => void;
  emptyMessage?: string;
}

const DetalleEventoPanel: React.FC<DetalleEventoPanelProps> = ({ 
  eventoSeleccionado, 
  onEdit,
  onDelete,
  emptyMessage
}) => {
  // Hooks para obtener configuración
  const { getEventoConfig, loading: eventosLoading } = useEventosConfig();

  // Obtener configuración del evento actual
  const eventoConfig = eventoSeleccionado ? getEventoConfig(eventoSeleccionado.eventType || 'evento') : null;
  
  // Verificar que tanto los datos del evento como la configuración estén listos
  const isEventDataReady = eventoSeleccionado && 
                           eventoSeleccionado.eventType && 
                           !eventosLoading && 
                           eventoConfig?.item; // Verificar que existe la configuración real del evento

  return (
    <div className="bg-secondary rounded-lg p-4 h-full">
      {eventoSeleccionado ? (
        // Solo mostrar el contenido cuando los datos estén completamente listos
        isEventDataReady ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className={`bg-primary/40 rounded-lg p-2 border-2 ${eventoConfig?.color ? eventoConfig.color.split(' ').find(c => c.includes('border-')) || 'border-yellow-400' : 'border-yellow-400'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={eventoConfig?.color ? eventoConfig.color.split(' ').find(c => c.includes('text-')) || 'text-yellow-400' : 'text-yellow-400'}>
                    {(() => {
                      const IconComponent = eventoConfig.IconComponent as React.ComponentType<{ className?: string }>;
                      return <IconComponent className="w-4 h-4" />;
                    })()}
                  </span>
                  <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {eventoSeleccionado.title}</h5>
                </div>
              <div className="flex gap-2">
                <button
                  onClick={() => eventoSeleccionado && onEdit(eventoSeleccionado)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                  title="Editar evento"
                >
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => eventoSeleccionado && onDelete(eventoSeleccionado)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                  title="Eliminar evento"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
            {eventoSeleccionado.description && (
              <p className="text-gray-300 text-xs mb-1 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {eventoSeleccionado.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  <span className="font-bold text-gray-400 mr-1">Fecha:</span> {formatFechaDDMMYYYY(eventoSeleccionado.startDate)}
                </span>
               
              </div>
              <div className="flex items-center gap-2">
                {eventoSeleccionado.location && (
                  <span className="text-gray-400">
                    <span className="font-bold text-gray-400 mr-1">Ubicación:</span> 📍 {eventoSeleccionado.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-1 mt-2">
              {/* Primera línea */}
              {eventoSeleccionado.diaEnvio && (
                <span className="px-2 py-1 rounded bg-blue-400/20 text-blue-400">
                  📅 <span className="font-bold">Día de envío:</span> {eventoSeleccionado.diaEnvio}
                </span>
              )}
              {eventoSeleccionado.modo && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-400/20 text-yellow-400">
                  <span className="font-bold mr-1">⚙️ Modo:</span> {eventoSeleccionado.modo}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs mb-1">
              {/* Segunda línea*/}
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                <span className="font-bold text-blue-300 mr-1">👤 Validador:</span>  {eventoSeleccionado.validador}
              </span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                <span className="font-bold text-green-300 mr-1">🏢 Código Dana:</span>  {eventoSeleccionado.codigoDana}
              </span>

              {/* Otros campos que pueden existir */}
              {eventoSeleccionado.recurrencePattern && eventoSeleccionado.recurrencePattern !== 'ninguno' && (
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                  🔁 <span className="font-bold">Recurrente:</span> {eventoSeleccionado.recurrencePattern}
                </span>
              )}
              {eventoSeleccionado.eventType && (
                <span className={`px-2 py-1 rounded ${eventoConfig?.color || 'bg-cyan-500/20 text-cyan-300'}`}>
                  🏷️ <span className="font-bold">Tipo:</span> {eventoSeleccionado.eventType}
                </span>
              )}
            </div>
            {(eventoSeleccionado.validador || eventoSeleccionado.codigoDana || eventoSeleccionado.modo) && (
              <div className="mt-3 pt-2 border-t border-yellow-400/20">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center gap-2">
                    {/* Recursos relacionados (nombres) */}
                    {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {eventoSeleccionado.relatedResources.slice(0, 3).map((resource: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-600/20 text-gray-300 text-xs rounded truncate max-w-24">
                            📄 {resource}
                          </span>
                        ))}
                        {eventoSeleccionado.relatedResources.length > 3 && (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                            +{eventoSeleccionado.relatedResources.length - 3} más
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
                        📄 Sin Recursos disponibles
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 ? (
                      <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                        <span className="font-bold mr-1">📎 Recursos:</span> {eventoSeleccionado.relatedResources.length}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-gray-600/20 text-gray-400">
                        📎 Recursos: 0
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : null
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <FaEye className="text-4xl mb-4 mx-auto" />
            <p>{emptyMessage || 'Selecciona un evento para ver sus detalles'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleEventoPanel;
