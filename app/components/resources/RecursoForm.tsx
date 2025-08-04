"use client";
import React, { useState, useEffect } from "react";
import { FaPaperclip, FaTag, FaHashtag, FaLink, FaStickyNote } from "react-icons/fa";

interface RecursoFormValues {
  titulo: string;
  descripcion?: string;
  tipo: string;
  archivo?: File | null;
  url?: string;
  etiquetas?: string[];
}

export interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface RecursoFormProps {
  initialValues?: Partial<RecursoFormValues>;
  tiposRecursos: TipoRecurso[];
  etiquetasDisponibles: string[];
  onSubmit: (values: RecursoFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const RecursoForm: React.FC<RecursoFormProps> = ({
  initialValues,
  tiposRecursos,
  etiquetasDisponibles,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar recurso"
}) => {
  const [titulo, setTitulo] = useState(initialValues?.titulo || "");
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion || "");
  const [tipo, setTipo] = useState(initialValues?.tipo || (tiposRecursos[0]?.id || ""));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [url, setUrl] = useState(initialValues?.url || "");
  const [etiquetas, setEtiquetas] = useState<string[]>(initialValues?.etiquetas || []);

  useEffect(() => {
    if (initialValues) {
      setTitulo(initialValues.titulo || "");
      setDescripcion(initialValues.descripcion || "");
      setTipo(initialValues.tipo || (tiposRecursos[0]?.id || ""));
      setUrl(initialValues.url || "");
      setEtiquetas(initialValues.etiquetas || []);
    }
    // eslint-disable-next-line
  }, [JSON.stringify(initialValues)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ titulo, descripcion, tipo, archivo, url, etiquetas });
  };

  const handleEtiquetasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite etiquetas con espacios y comas, separando solo por comas reales
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
        <FaPaperclip className="text-accent text-2xl" />
        <h2 className="text-xl font-bold text-accent">{initialValues ? 'Editar Recurso' : 'Nuevo Recurso'}</h2>
      </div>
      
      {/* Primera fila: Título */}
      <div className="relative">
        <input
          type="text"
          className="input-std w-full pl-10"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Título del recurso"
          required
        />
        <FaPaperclip className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
      </div>

      {/* Segunda fila: Tipo */}
      <div className="relative">
        <select
          className="input-std w-full pl-10 appearance-none"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          required
        >
          {tiposRecursos.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
        <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
      </div>

      {/* Tercera fila: Descripción */}
      <div className="relative">
        <textarea
          className="input-std w-full min-h-[80px] pl-10"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción del recurso"
          rows={4}
        />
        <FaStickyNote className="absolute left-3 top-4 text-accent" />
      </div>

      {/* Cuarta fila: Archivo y URL */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-gray-300">Contenido del recurso</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="block text-sm text-gray-400">Archivo (opcional)</label>
            <input
              type="file"
              className="input-std w-full border-dashed border-2 border-accent/30 bg-transparent text-white p-3 rounded-lg hover:border-accent/50 transition-colors"
              onChange={e => setArchivo(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-sm text-gray-400">URL (opcional)</label>
            <div className="relative">
              <input
                type="url"
                className="input-std w-full pl-10"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
              />
              <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* Quinta fila: Etiquetas */}
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="relative">
          <input
            type="text"
            className="input-std w-full pl-10"
            value={etiquetas.join(", ")}
            onChange={handleEtiquetasChange}
            placeholder="Ej: importante, referencia, externo"
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
      <div className="flex gap-2 justify-end mt-4">
        {onCancel && (
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700 transition" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" disabled={loading}>
            <FaPaperclip className="mr-2" /> {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default RecursoForm;
