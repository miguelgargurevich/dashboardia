"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaTimes, FaCheck, FaFileAlt, FaTag, FaAlignLeft } from "react-icons/fa";

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
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>(selectedIds);

  useEffect(() => {
    fetch("/api/resources", {
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.recursos)) {
          setRecursos(data.recursos);
        }
      });
  }, [token]);

  useEffect(() => {
    setSeleccionados(selectedIds);
  }, [selectedIds, open]);

  const tipos = Array.from(new Set(recursos.map(r => r.tipo).filter(Boolean)));

  // Estado para agregar recurso
  const [agregando, setAgregando] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [agregandoLoading, setAgregandoLoading] = useState(false);

  const handleAgregarRecurso = async () => {
    if (!nuevoTitulo.trim()) return;
    setAgregandoLoading(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ titulo: nuevoTitulo, tipo: nuevoTipo, descripcion: nuevaDescripcion })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          // Refrescar lista y seleccionar el nuevo recurso
          const nuevoRecurso = { id: data.id, titulo: nuevoTitulo, tipo: nuevoTipo, descripcion: nuevaDescripcion };
          setRecursos(prev => [nuevoRecurso, ...prev]);
          setSeleccionados(sel => [data.id, ...sel]);
          setAgregando(false);
          setNuevoTitulo("");
          setNuevoTipo("");
          setNuevaDescripcion("");
        }
      }
    } finally {
      setAgregandoLoading(false);
    }
  };

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
      <div className="bg-gradient-to-br from-secondary/95 to-primary/95 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-accent/40 overflow-hidden">
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
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
            {recursosFiltrados.length === 0 ? (
              <div className="text-gray-400 col-span-2 text-center py-8 text-lg">No hay recursos disponibles.</div>
            ) : (
              recursosFiltrados.map(recurso => (
                <label key={recurso.id} className={`group flex items-start gap-4 p-5 rounded-2xl border border-accent/10 bg-secondary/90 shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-150 ${seleccionados.includes(recurso.id) ? 'ring-2 ring-accent/80 border-accent/40 bg-accent/10' : 'hover:border-accent/40 hover:bg-accent/5'}`}>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(recurso.id)}
                    onChange={() => toggleSeleccion(recurso.id)}
                    className="accent-accent w-5 h-5 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white truncate text-base group-hover:text-accent transition-colors">{recurso.titulo}</span>
                      {recurso.tipo && <span className="text-xs text-accent bg-accent/10 rounded-full px-3 py-0.5 ml-2 font-semibold uppercase tracking-wide">{recurso.tipo}</span>}
                    </div>
                    {recurso.descripcion && <div className="text-xs text-gray-300 mt-1 truncate italic">{recurso.descripcion}</div>}
                  </div>
                  {seleccionados.includes(recurso.id) && <FaCheck className="text-accent text-xl ml-2 animate-bounce" />}
                </label>
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
