"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaCheck, FaTag } from "react-icons/fa";
import { useConfig, getIconComponent } from "../../lib/useConfig";

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
  filePath?: string;
  url?: string;
}

interface RecursosSelectorPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recursos: Recurso[]) => void;
  selectedIds: string[];
  token?: string | null;
  recursoIds?: string[];
}

const RecursosSelectorPanel: React.FC<RecursosSelectorPanelProps> = ({ open, onClose, onSelect, selectedIds, token, recursoIds }) => {
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

  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>(selectedIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [token, recursoIds, open]);

  useEffect(() => {
    setSeleccionados(selectedIds);
  }, [selectedIds, open]);

  const normalizarTipo = (tipo: string | undefined | null) => (tipo ?? '').trim().toLowerCase();
  const recursosFiltrados = recursos.filter(r => {
    const tipoNormalizado = normalizarTipo(r.tipo);
    const filtroNormalizado = normalizarTipo(tipoFiltro);
    if (filtroNormalizado === 'archivo') {
      return (
        (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
        r.filePath && !r.url
      );
    }
    if (filtroNormalizado === 'enlace') {
      return (
        (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
        r.url
      );
    }
    return (
      (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
      (!filtroNormalizado || tipoNormalizado === filtroNormalizado)
    );
  });

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

  // Animación slide-down
  return (
    <div
      className={`overflow-hidden transition-all duration-500 ${open ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'} bg-gradient-to-br from-[#23243a] via-[#1a1b2e] to-[#181926] rounded-xl shadow-xl border border-accent/30 mt-1 mb-2`}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      <div className="p-3">
        {/* Filtros arriba, lista abajo, todo ocupa el ancho */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-base z-20 bg-transparent pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar recurso por nombre..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-std pl-10 py-2 text-sm bg-primary/80 border-accent/30 focus:ring-accent/40 rounded-lg shadow-inner w-full"
              />
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-accent font-semibold text-xs mr-1 flex items-center gap-1"><FaTag />Tipo:</span>
              <button
                type="button"
                className={`px-3 py-0.5 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === '' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                onClick={e => { e.preventDefault(); setTipoFiltro(''); }}
              >
                Todos
              </button>
              <button
                type="button"
                className={`px-3 py-0.5 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === 'archivo' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                onClick={e => { e.preventDefault(); setTipoFiltro('archivo'); }}
              >
                Archivos
              </button>
              <button
                type="button"
                className={`px-3 py-0.5 rounded-full border text-xs font-bold transition-colors ${tipoFiltro === 'enlace' ? 'bg-accent text-primary border-accent' : 'bg-secondary/60 text-gray-300 border-gray-600 hover:bg-accent/20 hover:text-accent'}`}
                onClick={e => { e.preventDefault(); setTipoFiltro('enlace'); }}
              >
                Enlaces web
              </button>
            </div>
          </div>
        </div>
        {/* Lista de recursos: grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {loading ? (
            <div className="col-span-full text-gray-400 text-center py-4 text-base animate-pulse">Cargando recursos...</div>
          ) : error ? (
            <div className="col-span-full text-red-400 text-center py-4 text-base">{error}</div>
          ) : recursosFiltrados.length === 0 ? (
            <div className="col-span-full text-gray-400 text-center py-4 text-base">
              No hay recursos disponibles.
            </div>
          ) : (
            recursosFiltrados.map(recurso => {
              const config = getRecursoConfig(recurso.tipo || "default");
              const isSelected = seleccionados.includes(recurso.id);
              return (
                <div
                  key={recurso.id}
                  className={`w-full p-2 rounded-lg transition-all duration-200 border flex flex-wrap items-start gap-2 group ${
                    isSelected
                      ? 'bg-accent/20 text-accent shadow-lg shadow-current/20 border-accent/40'
                      : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                  }`}
                  style={{ minWidth: 0 }}
                >
                  <div className="flex-1 flex items-start gap-2 text-left bg-transparent border-none outline-none p-0 cursor-pointer min-w-0">
                    <div className={`p-2 rounded-lg ${config.color?.split(' ').find(c => c.startsWith('bg-')) || 'bg-accent/20'} ${config.color?.split(' ').find(c => c.startsWith('text-')) || 'text-accent'}`}>
                      {React.createElement(config.IconComponent as React.ComponentType<{ className?: string }>, { className: "text-sm" })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white break-words text-sm leading-snug">
                        {recurso.titulo}
                      </h4>
                      <p className="text-xs text-accent mt-0.5">
                        {config.icono}
                      </p>
                      {recurso.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate italic">{recurso.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={isSelected ? 'Deseleccionar recurso' : 'Seleccionar recurso'}
                    onClick={() => toggleSeleccion(recurso.id)}
                    className={`mt-1 ml-2 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded border-2 ${isSelected ? 'border-accent bg-accent' : 'border-gray-500 bg-white/10'} transition`}
                    style={{ minWidth: 20, minHeight: 20 }}
                  >
                    {isSelected && <FaCheck className="text-primary text-xs" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
        {/* Botón de acción: solo Confirmar selección */}
        <div className="flex justify-end mt-3">
          <button
            className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/90 transition flex items-center gap-2 text-sm shadow-xl"
            onClick={() => {
              handleConfirmar();
              // Asegura que el panel se cierre al confirmar
              if (typeof onClose === 'function') onClose();
            }}
          >
            <FaCheck className="text-base" /> Confirmar selección
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecursosSelectorPanel;
