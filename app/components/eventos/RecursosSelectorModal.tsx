"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaSearch, FaCheck, FaFileAlt, FaTag, FaEye, FaDownload } from "react-icons/fa";
import { useConfig, getIconComponent } from "../../lib/useConfig";

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
  filePath?: string;
  url?: string;
}

interface RecursosSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recursos: Recurso[]) => void;
  selectedIds: string[]; // IDs seleccionados
  token?: string | null;
  recursoIds?: string[]; // IDs a mostrar (filtrar)
}

const RecursosSelectorModal: React.FC<RecursosSelectorModalProps> = ({ open, onClose, onSelect, selectedIds, token, recursoIds }) => {
  // Hook para obtener configuración de recursos
  const { items: recursosConfig } = useConfig('recursos');

  // Función para obtener configuración de un tipo de recurso
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

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>(selectedIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/resources", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    })
      .then(async res => {
        if (!res.ok) {
          let msg = "Error al cargar recursos.";
          if (res.status === 401) msg = "No autorizado. Verifica tu sesión.";
          setError(msg);
          setRecursos([]);
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
        if (Array.isArray(recursoIds) && recursoIds.length > 0) {
          setRecursos(allRecursos.filter(r => recursoIds.includes(r.id)));
        } else {
          setRecursos(allRecursos);
        }
      })
      .catch(() => {
        setError("No se pudo conectar al servidor.");
        setRecursos([]);
      })
      .finally(() => setLoading(false));
  }, [token, recursoIds]);

  useEffect(() => {
    setSeleccionados(selectedIds);
  }, [selectedIds, open]);

  // Normalizar tipos para evitar problemas de comparación
  const normalizarTipo = (tipo: string | undefined | null) => (tipo ?? '').trim().toLowerCase();
  // const tipos = Array.from(new Set(recursos.map(r => normalizarTipo(r.tipo)).filter(t => t))); // Eliminado, filtros fijos

  const recursosFiltrados = recursos.filter(r => {
    const tipoNormalizado = normalizarTipo(r.tipo);
    const filtroNormalizado = normalizarTipo(tipoFiltro);
    // Filtro especial para 'archivo' y 'enlace'
    if (filtroNormalizado === 'archivo') {
      // Considerar archivo si tiene filePath y NO tiene url
      return (
        (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
        r.filePath && !r.url
      );
    }
    if (filtroNormalizado === 'enlace') {
      // Considerar enlace si tiene url (web)
      return (
        (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
        r.url
      );
    }
    // Filtro general por tipo
    return (
      (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
      (!filtroNormalizado || tipoNormalizado === filtroNormalizado)
    );
  });


  // Permitir selección múltiple con click (toggle)
  const toggleSeleccion = (id: string) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleConfirmar = () => {
    const recursosSeleccionados = recursos.filter(r => seleccionados.includes(r.id));
    onSelect(recursosSeleccionados);
    onClose();
  };

  // Estado para recurso seleccionado en el panel derecho
  const [recursoPreview, setRecursoPreview] = useState<Recurso | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  useEffect(() => {
    // Si no hay preview y hay recursos filtrados, seleccionar el primero
    if (!recursoPreview && recursosFiltrados.length > 0) {
      setRecursoPreview(recursosFiltrados[0]);
    }
    // Si el recurso seleccionado ya no está en la lista filtrada y hay otros recursos, limpiar preview
    if (
      recursoPreview &&
      recursosFiltrados.length > 1 &&
      !recursosFiltrados.some(r => r.id === recursoPreview.id)
    ) {
      setRecursoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursosFiltrados, open]);

  // Resetear error de preview al cambiar recurso
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
            <h3 className="text-2xl font-extrabold text-accent flex items-center gap-3 tracking-tight drop-shadow"><FaFileAlt className="text-accent text-2xl" />Seleccionar Recursos</h3>
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
          {/* Panel izquierdo: filtros y lista */}
          <div className="w-full lg:w-2/5 flex flex-col gap-4">
            {/* Filtros */}
            <div className="flex flex-col gap-2">
              <div className="relative flex-1 mb-2">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-lg z-20 bg-transparent pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar recurso por nombre..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="input-std pl-12 py-3 text-base bg-primary/80 border-accent/30 focus:ring-accent/40 rounded-xl shadow-inner"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-accent font-semibold text-sm mr-2 flex items-center gap-1"><FaTag />Tipo:</span>
                <button
                  type="button"
                  className={`px-4 py-1 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === '' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                  onClick={e => { e.preventDefault(); setTipoFiltro(''); }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`px-4 py-1 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === 'archivo' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                  onClick={e => { e.preventDefault(); setTipoFiltro('archivo'); }}
                >
                  Archivos
                </button>
                <button
                  type="button"
                  className={`px-4 py-1 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === 'enlace' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                  onClick={e => { e.preventDefault(); setTipoFiltro('enlace'); }}
                >
                  Enlaces web
                </button>
              </div>
            </div>
            {/* Lista de recursos */}
            <div className="flex-1 overflow-y-auto mt-4">
              {loading ? (
                <div className="text-gray-400 text-center py-8 text-lg animate-pulse">Cargando recursos...</div>
              ) : error ? (
                <div className="text-red-400 text-center py-8 text-lg">{error}</div>
              ) : recursosFiltrados.length === 0 ? (
                <div className="text-gray-400 text-center py-8 text-lg">
                  No hay recursos disponibles.
                </div>
              ) : (
                recursosFiltrados.map(recurso => {
                  const config = getRecursoConfig(recurso.tipo || "default");
                  const isPreview = recursoPreview?.id === recurso.id;
                  const isSelected = seleccionados.includes(recurso.id);
                  return (
                    <div
                      key={recurso.id}
                      className={`w-full p-2 rounded-lg transition-all duration-200 border mb-2 flex items-start gap-3 group ${
                        isPreview
                          ? 'bg-accent/20 text-accent shadow-lg shadow-current/20 border-accent/40'
                          : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={isSelected ? 'Deseleccionar recurso' : 'Seleccionar recurso'}
                        onClick={() => toggleSeleccion(recurso.id)}
                        className={`mt-1 mr-2 w-5 h-5 flex items-center justify-center rounded border-2 ${isSelected ? 'border-accent bg-accent' : 'border-gray-500 bg-white/10'} transition`}
                      >
                        {isSelected && <FaCheck className="text-primary text-xs" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecursoPreview(recurso)}
                        className="flex-1 flex items-start gap-3 text-left bg-transparent border-none outline-none p-0 cursor-pointer"
                        tabIndex={-1}
                      >
                        <div className={`p-2 rounded-lg ${config.color?.split(' ').find(c => c.startsWith('bg-')) || 'bg-accent/20'} ${config.color?.split(' ').find(c => c.startsWith('text-')) || 'text-accent'}`}>
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
                    </div>
                  );
                })
              )}
            </div>
            {/* Acciones de selección */}
            <div className="flex justify-end gap-4 mt-6">
              <button className="px-6 py-3 rounded-xl border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-700/40 hover:text-white font-semibold text-base transition shadow" onClick={onClose}>
                Cerrar
              </button>
              <button className="px-6 py-3 rounded-xl bg-accent text-primary font-bold hover:bg-accent/90 transition flex items-center gap-3 text-base shadow-xl" onClick={handleConfirmar}>
                <FaCheck className="text-lg" /> Confirmar selección
              </button>
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
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/90 transition shadow"
                      onClick={async () => {
                        if (recursoPreview.filePath) {
                          try {
                            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
                            const key = recursoPreview.filePath.replace(/^https?:\/\/[^/]+\//, '');
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
                        } else if (recursoPreview.url) {
                          window.open(recursoPreview.url, '_blank');
                        }
                      }}
                    >
                      <FaDownload /> Descargar
                    </button>
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

export default RecursosSelectorModal;
