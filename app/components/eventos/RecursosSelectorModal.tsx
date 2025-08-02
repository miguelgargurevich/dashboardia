"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaCheck, FaFileAlt, FaTag } from "react-icons/fa";
import { useConfig, getIconComponent } from "../../lib/useConfig";

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
}

interface RecursosSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (recursos: Recurso[]) => void;
  selectedIds: string[];
  token?: string | null;
}

const RecursosSelectorModal: React.FC<RecursosSelectorModalProps> = ({ open, onClose, onSelect, selectedIds, token }) => {
  // Hook para obtener configuración de recursos
  const { items: recursosConfig } = useConfig('recursos');

  // Función para obtener configuración de un tipo de recurso
  const getRecursoConfig = (tipo: string) => {
    const config = recursosConfig.find((item: any) => 
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
        // Leer recursos desde data.resources (formato real de la API)
        if (Array.isArray(data.resources)) {
          setRecursos(data.resources);
        } else if (Array.isArray(data)) {
          setRecursos(data);
        } else if (Array.isArray(data.recursos)) {
          setRecursos(data.recursos);
        } else {
          setRecursos([]);
          setError("Respuesta inesperada del servidor.");
        }
      })
      .catch(() => {
        setError("No se pudo conectar al servidor.");
        setRecursos([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    setSeleccionados(selectedIds);
  }, [selectedIds, open]);

  const tipos = Array.from(new Set(recursos.map(r => r.tipo).filter(Boolean)));

  const recursosFiltrados = recursos.filter(r =>
    (!busqueda || r.titulo.toLowerCase().includes(busqueda.toLowerCase())) &&
    (!tipoFiltro || r.tipo === tipoFiltro)
  );

  const toggleSeleccion = (id: string) => {
    setSeleccionados(sel =>
      sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]
    );
  };

  const handleConfirmar = () => {
    const recursosSeleccionados = recursos.filter(r => seleccionados.includes(r.id));
    onSelect(recursosSeleccionados);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-secondary/95 to-primary/95 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col border border-accent/40 overflow-hidden">
        {/* Header sticky */}
        <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-accent flex items-center gap-2"><FaFileAlt className="text-accent" />Seleccionar Recursos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20 text-2xl font-bold"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-lg" />
              <input
                type="text"
                placeholder="Buscar recurso por nombre..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-std pl-10 py-3 text-base bg-primary/80 border-accent/30 focus:ring-accent/40"
              />
            </div>
            <div className="relative w-56">
              <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-lg" />
              <select
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value)}
                className="input-std pl-10 py-3 text-base bg-primary/80 border-accent/30 focus:ring-accent/40 appearance-none"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo ?? "default"} value={tipo ?? "default"}>
                    {tipo ?? "Sin tipo"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
            {loading ? (
              <div className="text-gray-400 col-span-2 text-center py-8 text-lg animate-pulse">Cargando recursos...</div>
            ) : error ? (
              <div className="text-red-400 col-span-2 text-center py-8 text-lg">{error}</div>
            ) : recursosFiltrados.length === 0 ? (
              <div className="text-gray-400 col-span-2 text-center py-8 text-lg">No hay recursos disponibles.</div>
            ) : (
              recursosFiltrados.map(recurso => (
                <div
                  key={recurso.id}
                  onClick={() => toggleSeleccion(recurso.id)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors duration-150 select-none cursor-pointer shadow-lg
                    ${seleccionados.includes(recurso.id)
                      ? 'bg-accent/20 text-accent border-accent/30 border-2'
                      : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'}
                  `}
                >
                  <span className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl border ${getRecursoConfig(recurso.tipo || "default").color}`}>
                    {(() => {
                      const config = getRecursoConfig(recurso.tipo || "default");
                      const IconComponent = config.IconComponent as React.ComponentType<{ className?: string }>;
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate text-base group-hover:text-accent transition-colors">{recurso.titulo}</span>
                      {recurso.tipo && <span className={`text-xs font-semibold uppercase tracking-wide px-3 py-0.5 rounded-full ${getRecursoConfig(recurso.tipo).color}`}>{recurso.tipo}</span>}
                    </div>
                    {recurso.descripcion && <div className="text-xs text-gray-400 mt-1 truncate italic">{recurso.descripcion}</div>}
                  </div>
                  <span className="flex items-center ml-4">
                    {seleccionados.includes(recurso.id) && <FaCheck className="text-accent text-xl animate-bounce" />}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="px-6 py-3 rounded-xl border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700/40 hover:text-white font-semibold text-base transition" onClick={onClose}>
              Cancelar
            </button>
            <button className="px-6 py-3 rounded-xl bg-accent text-primary font-bold hover:bg-accent/90 transition flex items-center gap-3 text-base shadow-lg" onClick={handleConfirmar}>
              <FaCheck className="text-lg" /> Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecursosSelectorModal;
