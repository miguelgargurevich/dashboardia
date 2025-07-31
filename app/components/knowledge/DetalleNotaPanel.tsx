import React from 'react';
import { FaDownload, FaTrash, FaEye, FaFileAlt, FaEdit } from 'react-icons/fa';

interface Nota {
  id: string;
  nombre: string;
  contenido: string;
  tema?: string;
  date?: string;
  descripcion?: string;
  etiquetas?: string[];
}

interface Tema {
  id: string;
  nombre: string;
}

interface DetalleNotaPanelProps {
  notaSeleccionada: Nota | null;
  temas: Tema[];
  descargarNota: (nota: Nota) => void;
  eliminarNota: (nota: Nota) => void;
  renderizarContenidoMarkdown: (contenido: string) => React.ReactNode;
  onEdit?: (nota: Nota) => void;
}

const DetalleNotaPanel: React.FC<DetalleNotaPanelProps> = ({
  notaSeleccionada,
  descargarNota,
  eliminarNota,
  renderizarContenidoMarkdown,
  onEdit,
}) => {
    return (
    <div className="bg-secondary rounded-lg p-6 h-full">
      {notaSeleccionada ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="bg-primary/40 rounded-lg p-3 border border-yellow-400/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  <FaFileAlt />
                </span>
                <h5 className="font-semibold text-white text-sm"><span className="font-bold text-gray-400 mr-1">Título:</span> {notaSeleccionada.nombre}</h5>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => descargarNota(notaSeleccionada)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                  title="Descargar nota"
                >
                  <FaDownload /> Descargar
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(notaSeleccionada)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-200 px-2 py-1 rounded border border-blue-400/30 bg-blue-400/10 text-xs font-semibold"
                    title="Editar nota"
                  >
                    <FaEdit /> Editar
                  </button>
                )}
                {/* Botón eliminar oculto temporalmente */}
                <button
                  style={{ display: 'none' }}
                  className="flex items-center gap-1 text-red-400 hover:text-red-200 px-2 py-1 rounded border border-red-400/30 bg-red-400/10 text-xs font-semibold"
                  title="Eliminar nota"
                >
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
            {notaSeleccionada.descripcion && (
              <p className="text-gray-300 text-xs mb-2 line-clamp-2"><span className="font-bold text-gray-400 mr-1">Descripción:</span> {notaSeleccionada.descripcion}</p>
            )}
            <div className="mb-4">
              {renderizarContenidoMarkdown(notaSeleccionada.contenido || '')}
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              {notaSeleccionada.etiquetas && notaSeleccionada.etiquetas.length > 0 && (
                <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-300">🏷️ <span className="font-bold">Etiquetas:</span> {notaSeleccionada.etiquetas.join(', ')}</span>
              )}
              {notaSeleccionada.date && (
                <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">📅 <span className="font-bold">Fecha:</span> {notaSeleccionada.date}</span>
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
