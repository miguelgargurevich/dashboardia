import React from 'react';
import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
import { FaEdit, FaTrash, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { useEventosConfig, useConfig } from '../../lib/useConfig';

export interface DetalleEventoPanelProps {
  eventoSeleccionado: any | null;
  onEdit: (evento: any) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

const DetalleEventoPanel: React.FC<DetalleEventoPanelProps> = ({ eventoSeleccionado, onEdit, onDelete, emptyMessage }) => {
  // Hooks para obtener configuración
  const { getEventoConfig } = useEventosConfig();
  const { items: temasConfig } = useConfig('temas');

  // Función para obtener el color de un tema
  const getColorTema = (temaNombre: string) => {
    const tema = temasConfig.find((item: any) => 
      item.nombre.toLowerCase() === temaNombre?.toLowerCase()
    );
    return tema?.color || 'bg-accent/20 text-accent';
  };

  return (
    <div className="bg-secondary rounded-lg p-6 h-full">
      {eventoSeleccionado ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="bg-primary/40 rounded-lg p-3 border border-yellow-400/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  {(() => {
                    const config = getEventoConfig(eventoSeleccionado.eventType || eventoSeleccionado.tipoEvento || 'evento');
                    const IconComponent = config.IconComponent as React.ComponentType<{ className?: string }>;
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                </span>
                <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {eventoSeleccionado.title}</h5>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(eventoSeleccionado)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                  title="Editar evento"
                >
                  <FaEdit /> Editar
                </button>
                {/* Botón eliminar oculto temporalmente */}
                {/*
                <button
                  onClick={() => onDelete(eventoSeleccionado.id)}
                  className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                  title="Eliminar evento"
                >
                  <FaTrash /> Eliminar
                </button>
                */}
              </div>
            </div>
            {eventoSeleccionado.description && (
              <p className="text-gray-300 text-xs mb-2 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {eventoSeleccionado.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              {eventoSeleccionado.diaEnvio && (
                <span className={`px-2 py-1 rounded ${getColorTema('fecha')}`}>📅 <span className="font-bold">Día de envío:</span> {eventoSeleccionado.diaEnvio}</span>
              )}
              {eventoSeleccionado.query && (
                <span className={`px-2 py-1 rounded ${getColorTema('query')}`} title={eventoSeleccionado.query}>🔎 <span className="font-bold">Query:</span> {eventoSeleccionado.query.length > 20 ? eventoSeleccionado.query.slice(0,20) + '…' : eventoSeleccionado.query}</span>
              )}
              {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 && (
                <span className={`px-2 py-1 rounded ${getColorTema('recursos')}`}>📎 <span className="font-bold">Recursos:</span> {eventoSeleccionado.relatedResources.length}</span>
              )}
              {eventoSeleccionado.isRecurring && (
                <span className={`px-2 py-1 rounded ${getColorTema('recurrente')}`}>🔁 <span className="font-bold">Recurrente:</span> {eventoSeleccionado.recurrencePattern || 'Sí'}</span>
              )}
              {eventoSeleccionado.eventType && (
                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">🏷️ <span className="font-bold">Tipo:</span> {eventoSeleccionado.eventType}</span>
              )}
            </div>
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
            {(eventoSeleccionado.validador || eventoSeleccionado.codigoDana || eventoSeleccionado.nombreNotificacion || eventoSeleccionado.modo) && (
              <div className="mt-2 pt-2 border-t border-yellow-400/20">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex flex-wrap gap-2">
                    {eventoSeleccionado.validador && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                        <span className="font-bold text-blue-300 mr-1">Validador:</span> 👤 {eventoSeleccionado.validador}
                      </span>
                    )}
                    {eventoSeleccionado.codigoDana && (
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-300">
                        <span className="font-bold text-green-300 mr-1">Código Dana:</span> 🏢 {eventoSeleccionado.codigoDana}
                      </span>
                    )}
                    {eventoSeleccionado.nombreNotificacion && (
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                        <span className="font-bold text-purple-300 mr-1">Notificación:</span> 🔔 {eventoSeleccionado.nombreNotificacion}
                      </span>
                    )}
                  </div>
                  {eventoSeleccionado.modo && (
                    <span className="text-xs text-yellow-400 px-2 py-1 rounded bg-yellow-400/10 ml-2">
                      <span className="font-bold text-yellow-400 mr-1">Modo:</span> {eventoSeleccionado.modo}
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Recursos relacionados (nombres) */}
            {eventoSeleccionado.relatedResources && eventoSeleccionado.relatedResources.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
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
            )}
          </div>
        </div>
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
