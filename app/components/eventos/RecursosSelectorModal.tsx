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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
      <div className="bg-gradient-to-br from-secondary/90 to-primary/90 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-accent/30 overflow-hidden">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-secondary/95 border-b border-accent/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-accent flex items-center gap-2"><FaFileAlt className="text-accent" /> Seleccionar Recursos</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700/30 text-gray-400 hover:text-white transition" aria-label="Cerrar"><FaTimes /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-std pl-10"
              />
            </div>
            <div className="relative">
              <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              <select
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value)}
                className="input-std pl-10"
              >
                <option value="">Todos los tipos</option>
                {tipos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow ${agregando ? 'bg-gray-700 text-gray-200' : 'bg-accent text-primary hover:bg-accent/80'}`}
              onClick={() => setAgregando(a => !a)}
            >
              <FaPlus /> {agregando ? "Cancelar" : "Agregar recurso"}
            </button>
          </div>
          {agregando && (
            <div className="bg-primary/40 rounded-xl p-4 flex flex-col gap-3 border border-accent/10 shadow-inner animate-fade-in">
              <div className="flex gap-2 items-center">
                <FaFileAlt className="text-accent" />
                <input
                  type="text"
                  placeholder="Título del recurso"
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  className="input-std flex-1"
                  required
                />
              </div>
              <div className="flex gap-2 items-center">
                <FaTag className="text-accent" />
                <input
                  type="text"
                  placeholder="Tipo (opcional)"
                  value={nuevoTipo}
                  onChange={e => setNuevoTipo(e.target.value)}
                  className="input-std flex-1"
                />
              </div>
              <div className="flex gap-2 items-center">
                <FaAlignLeft className="text-accent" />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={nuevaDescripcion}
                  onChange={e => setNuevaDescripcion(e.target.value)}
                  className="input-std flex-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-600 text-gray-200 hover:bg-gray-700 transition" onClick={() => setAgregando(false)}>
                  Cancelar
                </button>
                <button type="button" className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" disabled={agregandoLoading} onClick={handleAgregarRecurso}>
                  <FaCheck /> Guardar
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            {recursosFiltrados.length === 0 ? (
              <div className="text-gray-400 col-span-2">No hay recursos disponibles.</div>
            ) : (
              recursosFiltrados.map(recurso => (
                <label key={recurso.id} className={`flex items-center gap-3 p-4 rounded-xl border border-accent/10 bg-secondary/80 shadow hover:shadow-lg cursor-pointer transition-all ${seleccionados.includes(recurso.id) ? 'ring-2 ring-accent/60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(recurso.id)}
                    onChange={() => toggleSeleccion(recurso.id)}
                    className="accent-accent w-5 h-5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{recurso.titulo}</span>
                      {recurso.tipo && <span className="text-xs text-accent bg-accent/10 rounded px-2 py-0.5 ml-2">{recurso.tipo}</span>}
                    </div>
                    {recurso.descripcion && <div className="text-xs text-gray-400 mt-1 truncate">{recurso.descripcion}</div>}
                  </div>
                  {seleccionados.includes(recurso.id) && <FaCheck className="text-accent text-lg ml-2" />}
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 rounded-lg border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700 transition" onClick={onClose}>
              Cancelar
            </button>
            <button className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" onClick={handleConfirmar}>
              <FaCheck /> Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecursosSelectorModal;
