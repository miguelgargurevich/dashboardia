"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaFileAlt, FaEye, FaDownload } from "react-icons/fa";
import { useConfig, getIconComponent } from "../../lib/useConfig";

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
  filePath?: string;
  url?: string;
}

interface RecursosViewerModalProps {
  open: boolean;
  onClose: () => void;
  recursoIds: string[]; // IDs de recursos a mostrar
  token?: string | null;
}

const RecursosViewerModal: React.FC<RecursosViewerModalProps> = ({ open, onClose, recursoIds, token }) => {
  const { items: recursosConfig } = useConfig('recursos');
  type RecursoConfigItem = {
    nombre: string;
    icono?: string;
    color?: string;
  };
  const getRecursoConfig = (tipo: string) => {
    const config = recursosConfig.find((item: RecursoConfigItem) =>
      item.nombre.toLowerCase() === tipo.toLowerCase() ||
      tipo.toLowerCase().includes(item.nombre.toLowerCase())
    );
    return {
      icono: config?.icono || 'fa-file-alt',
      color: config?.color || 'bg-gray-500/20 text-gray-400 border-gray-400/30',
      IconComponent: getIconComponent(config?.icono || 'fa-file-alt')
    };
  };


  const [recursosState, setRecursosState] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recursoPreview, setRecursoPreview] = useState<Recurso | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (recursoIds && recursoIds.length > 0) {
      setLoading(true);
      setError(null);
      fetch("/api/resources", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      })
        .then(async res => {
          if (!res.ok) {
            setError("Error al cargar recursos.");
            setRecursosState([]);
            return;
          }
          const data = await res.json();
          let allRecursos: Recurso[] = [];
          if (Array.isArray(data.resources)) {
            allRecursos = data.resources;
          } else if (Array.isArray(data)) {
            allRecursos = data;
          } else if (Array.isArray(data.recursos)) {
            allRecursos = data.recursos;
          }
          setRecursosState(allRecursos.filter(r => recursoIds.includes(r.id)));
        })
        .catch(() => {
          setError("No se pudo conectar al servidor.");
          setRecursosState([]);
        })
        .finally(() => setLoading(false));
    } else {
      setRecursosState([]);
    }
  }, [recursoIds, token]);

  useEffect(() => {
    if (!recursoPreview && recursosState.length > 0) {
      setRecursoPreview(recursosState[0]);
    }
    if (
      recursoPreview &&
      recursosState.length > 1 &&
      !recursosState.some(r => r.id === recursoPreview.id)
    ) {
      setRecursoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursosState, open, recursoPreview]);

  useEffect(() => {
    setPreviewError(null);
  }, [recursoPreview]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-br from-[#23243a] via-[#1a1b2e] to-[#181926] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col border border-accent/40 overflow-hidden">
        {/* Header sticky */}
        <div className="bg-gradient-to-r from-secondary/90 to-primary/80 border-b border-accent/20 p-7 rounded-t-3xl flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div>
            <h3 className="text-2xl font-extrabold text-accent flex items-center gap-3 tracking-tight drop-shadow"><FaFileAlt className="text-accent text-2xl" />Recursos Relacionados</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20 text-2xl font-bold"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-8 bg-gradient-to-br from-[#23243a]/80 to-[#181926]/90 overflow-y-auto">
          {/* Panel izquierdo: lista de recursos */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-gray-400 text-center py-8 text-lg animate-pulse">Cargando recursos...</div>
              ) : error ? (
                <div className="text-red-400 text-center py-8 text-lg">{error}</div>
              ) : recursosState.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-lg">No hay recursos para mostrar.</div>
              ) : (
                recursosState.map(recurso => {
                  const config = getRecursoConfig(recurso.tipo || "default");
                  const isSelected = recursoPreview?.id === recurso.id;
                  return (
                    <button
                      key={recurso.id}
                      onClick={() => setRecursoPreview(recurso)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 border cursor-pointer mb-2 flex items-start gap-3 ${
                        isSelected
                          ? 'bg-accent/20 text-accent shadow-lg shadow-current/20 border-accent/40'
                          : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${config.color?.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-accent/20'} ${config.color?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-accent'}`}>
                        {React.createElement(config.IconComponent as React.ComponentType<{ className?: string }>, { className: "text-sm" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {recurso.titulo}
                        </h4>
                        <p className="text-xs text-accent mt-1">
                          {config.icono}
                        </p>
                        {recurso.descripcion && (
                          <p className="text-xs text-gray-400 mt-1 truncate italic">{recurso.descripcion}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {/* Panel derecho: previsualización */}
          <div className="w-full lg:w-3/5 flex flex-col bg-secondary/80 rounded-2xl p-6 min-h-[400px] max-h-[70vh] overflow-y-auto">
            {recursoPreview ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`p-2 rounded-lg ${getRecursoConfig(recursoPreview.tipo || "default").color}`}>{React.createElement(getRecursoConfig(recursoPreview.tipo || "default").IconComponent as React.ComponentType<{ className?: string }>, { className: "text-lg" })}</span>
                  <span className="font-bold text-lg text-accent truncate">{recursoPreview.titulo}</span>
                  {recursoPreview.tipo && <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-0.5 rounded-full ${getRecursoConfig(recursoPreview.tipo).color} shadow-sm`}>{recursoPreview.tipo}</span>}
                </div>
                {recursoPreview.descripcion && <div className="text-sm text-gray-300 mb-2 italic">{recursoPreview.descripcion}</div>}
                {/* Previsualización */}
                {(() => {
                  // PDF
                  if (recursoPreview.filePath && recursoPreview.filePath.endsWith('.pdf')) {
                    return (
                      <>
                        <iframe
                          src={recursoPreview.filePath}
                          className="w-full h-80 rounded-lg border border-accent/20 bg-white"
                          title="Vista previa PDF"
                          onError={() => setPreviewError('No se pudo cargar el archivo PDF.')}
                        />
                        {previewError && (
                          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                            <FaEye className="text-4xl mb-4" />
                            <p>{previewError}</p>
                          </div>
                        )}
                      </>
                    );
                  }
                  // Web
                  if (recursoPreview.url && recursoPreview.url.startsWith('http')) {
                    return (
                      <>
                        <iframe
                          src={recursoPreview.url}
                          className="w-full h-80 rounded-lg border border-accent/20 bg-white"
                          title="Vista previa web"
                          onError={() => setPreviewError('No se pudo cargar la página web.')}
                        />
                        {previewError && (
                          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                            <FaEye className="text-4xl mb-4" />
                            <p>{previewError}</p>
                          </div>
                        )}
                      </>
                    );
                  }
                  // Imagen
                  if (recursoPreview.filePath && /\.(jpg|jpeg|png|gif)$/i.test(recursoPreview.filePath)) {
                    return (
                      <div className="w-full max-h-80 relative rounded-lg border border-accent/20 bg-white flex items-center justify-center" style={{ minHeight: 200 }}>
                        <Image
                          src={recursoPreview.filePath}
                          alt="Vista previa"
                          fill
                          style={{ objectFit: 'contain', borderRadius: '0.75rem' }}
                          sizes="(max-width: 768px) 100vw, 60vw"
                          className="rounded-lg"
                          onError={() => setPreviewError('No se pudo cargar la imagen.')}
                        />
                        {previewError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-lg">
                            <FaEye className="text-4xl mb-2 text-gray-400" />
                            <p className="text-gray-500 text-sm">{previewError}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // No previsualizable
                  return (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                      <FaEye className="text-4xl mb-4" />
                      <p>No se puede previsualizar este recurso.</p>
                    </div>
                  );
                })()}
                {/* Botón de descarga alineado a la derecha */}
                <div className="mt-6 flex justify-end">
                  {(recursoPreview.filePath || recursoPreview.url) && (
                    <a
                      href={recursoPreview.filePath || recursoPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/90 transition shadow"
                    >
                      <FaDownload /> Descargar
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaEye className="text-4xl mb-4" />
                <p>Selecciona un recurso para previsualizarlo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecursosViewerModal;
