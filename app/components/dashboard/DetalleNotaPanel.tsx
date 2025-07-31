import React from 'react';
import { FaDownload, FaTrash, FaEye } from 'react-icons/fa';

interface Nota {
  id: string;
  nombre: string;
  contenido: string;
  tema?: string;
  date?: string;
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
}

const DetalleNotaPanel: React.FC<DetalleNotaPanelProps> = ({
  notaSeleccionada,
  temas,
  descargarNota,
  eliminarNota,
  renderizarContenidoMarkdown,
}) => {
  return (
    <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
      {notaSeleccionada ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-accent">{notaSeleccionada.nombre}</h2>
              <p className="text-sm text-gray-400">
                {temas.find((t) => t.id === notaSeleccionada.tema)?.nombre}
              </p>
              {notaSeleccionada.date && (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="font-semibold">Fecha:</span> {new Date(notaSeleccionada.date).toLocaleDateString('es-ES')}
                </p>
              )}
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
  );
};

export default DetalleNotaPanel;
