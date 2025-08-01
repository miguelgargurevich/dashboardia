"use client";
import React, { useState, useEffect } from "react";
import RecursosSelectorModal from "./RecursosSelectorModal";
import { FaFileAlt, FaStickyNote, FaTag, FaHashtag, FaRegStickyNote } from "react-icons/fa";

interface NotaFormValues {
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  tema: string;
  priority?: string;
  date?: string; // Único campo de fecha
  relatedResources?: string[];
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface NotaFormProps {
  initialValues?: NotaFormValues;
  temas: Tema[];
  tiposNotas: TipoNota[];
  etiquetasDisponibles: string[];
  onSubmit: (values: NotaFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const NotaForm: React.FC<NotaFormProps> = ({
  initialValues,
  temas,
  tiposNotas,
  etiquetasDisponibles,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar nota"
}) => {
  const [nombre, setNombre] = useState(initialValues?.nombre || "");
  const [contenido, setContenido] = useState(initialValues?.contenido || "");
  const [tipo, setTipo] = useState(initialValues?.tipo || (tiposNotas[0]?.id || ""));
  const [tema, setTema] = useState(initialValues?.tema || (temas[0]?.id || ""));
  const [etiquetas, setEtiquetas] = useState<string[]>(initialValues?.etiquetas || []);
  const [recursosModalOpen, setRecursosModalOpen] = useState(false);
  // Estado para los detalles de los recursos seleccionados
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<{ id: string; titulo: string; tipo?: string; descripcion?: string }[]>([]);
  const [selectedRecursos, setSelectedRecursos] = useState<string[]>(initialValues?.relatedResources || []);
  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };
  const [date, setDate] = useState(initialValues?.date || getToday());

  useEffect(() => {
    if (initialValues) {
      setNombre(initialValues.nombre || "");
      setContenido(initialValues.contenido || "");
      setTipo(initialValues.tipo || (tiposNotas[0]?.id || ""));
      setTema(initialValues.tema || (temas[0]?.id || ""));
      setEtiquetas(initialValues.etiquetas || []);
      setDate(initialValues.date || getToday());
      setSelectedRecursos(initialValues.relatedResources || []);
    } else {
      setNombre("");
      setContenido("");
      setTipo(tiposNotas[0]?.id || "");
      setTema(temas[0]?.id || "");
      setEtiquetas([]);
      setDate(getToday());
      setSelectedRecursos([]);
    }
  }, [JSON.stringify(initialValues), tiposNotas, temas]);

  // Cargar detalles de los recursos seleccionados
  useEffect(() => {
    if (selectedRecursos.length > 0) {
      fetch('/api/resources', {
        headers: typeof window !== 'undefined' && localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : undefined
      })
        .then(res => res.json())
        .then(data => {
          const recursos = Array.isArray(data.resources) ? data.resources : Array.isArray(data.recursos) ? data.recursos : Array.isArray(data) ? data : [];
          setRecursosSeleccionados(recursos.filter((r: any) => selectedRecursos.includes(r.id)));
        });
    } else {
      setRecursosSeleccionados([]);
    }
  }, [selectedRecursos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = { nombre, contenido, tipo, etiquetas, tema, date, relatedResources: selectedRecursos };
    await onSubmit(values);
  };

  const handleEtiquetasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEtiquetas(
      e.target.value
        .split(/\s*,\s*/)
        .map(et => et.trim())
        .filter(Boolean)
    );
  };

  // Al hacer click en un tag sugerido, lo agrega si no está presente
  const handleAgregarEtiqueta = (etiqueta: string) => {
    if (!etiquetas.includes(etiqueta)) {
      setEtiquetas([...etiquetas, etiqueta]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-secondary/90 to-primary/90 rounded-2xl shadow-2xl border border-accent/30 p-6 max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">      
      <div className="flex items-center gap-2 mb-2">
        <FaRegStickyNote className="text-accent text-2xl" />
        <h2 className="text-xl font-bold text-accent">{initialValues ? 'Editar Nota' : 'Nueva Nota'}</h2>
      </div>
      
      {/* Primera fila: Título y Fecha */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            className="input-std w-full pl-10"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Título de la nota"
            required
          />
          <FaRegStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
        <div className="w-full md:w-48 relative">
          <input
            type="date"
            className="input-std w-full pl-10"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <FaRegStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
      </div>

      {/* Segunda fila: Tipo y Tema */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <select
            className="input-std w-full pl-10 appearance-none"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
          >
            {tiposNotas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <FaStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
        <div className="flex-1 relative">
          <select
            className="input-std w-full pl-10 appearance-none"
            value={tema}
            onChange={e => setTema(e.target.value)}
            required
          >
            {temas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
      </div>

      {/* Tercera fila: Contenido */}
      <div className="relative">
        <textarea
          className="input-std w-full min-h-[120px] pl-10"
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          placeholder="Contenido de la nota"
          rows={6}
          required
        />
        <FaStickyNote className="absolute left-3 top-4 text-accent" />
      </div>

      {/* Cuarta fila: Etiquetas */}
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="relative">
          <input
            type="text"
            className="input-std w-full pl-10"
            value={etiquetas.join(", ")}
            onChange={handleEtiquetasChange}
            placeholder="Ej: importante, tarea, urgente"
          />
          <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {etiquetasDisponibles.map((et, idx) => (
            <button
              type="button"
              key={idx}
              className={`px-2 py-0.5 rounded text-xs border transition focus:outline-none ${
                etiquetas.includes(et)
                  ? 'bg-accent text-primary border-accent'
                  : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/30'
              }`}
              onClick={() => handleAgregarEtiqueta(et)}
              tabIndex={0}
            >
              {et}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Recursos Relacionados</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {recursosSeleccionados.length === 0 ? (
            <span className="text-gray-400 text-sm">Ningún recurso seleccionado.</span>
          ) : (
            recursosSeleccionados.map(r => (
              <span key={r.id} className="px-2 py-1 bg-gray-700/40 text-gray-200 text-xs rounded flex items-center gap-1">
                <FaFileAlt className="inline-block mr-1 text-accent" />{r.titulo}
                {r.tipo && <span className="ml-1 text-gray-400">({r.tipo})</span>}
              </span>
            ))
          )}
        </div>
        <button type="button" className="px-3 py-1 rounded bg-accent text-primary font-bold hover:bg-accent/80 transition" onClick={() => setRecursosModalOpen(true)}>
          Seleccionar recursos
        </button>
        <RecursosSelectorModal
          open={recursosModalOpen}
          onClose={() => setRecursosModalOpen(false)}
          onSelect={recursos => {
            setSelectedRecursos(recursos.map(r => r.id));
            setRecursosModalOpen(false);
          }}
          selectedIds={selectedRecursos}
          token={typeof window !== 'undefined' ? localStorage.getItem('token') : undefined}
        />
      </div>
      <div className="flex gap-2 justify-end mt-4">
        {onCancel && (
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700 transition" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" disabled={loading}>
          <FaFileAlt className="mr-2" /> {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default NotaForm;
