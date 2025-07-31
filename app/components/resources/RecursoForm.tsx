"use client";
import React, { useState, useEffect } from "react";
import { FaPaperclip } from "react-icons/fa";

interface RecursoFormValues {
  titulo: string;
  descripcion?: string;
  tipo: string;
  tema: string;
  archivo?: File | null;
  url?: string;
  etiquetas?: string[];
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

export interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface RecursoFormProps {
  initialValues?: Partial<RecursoFormValues>;
  temas: Tema[];
  tiposRecursos: TipoRecurso[];
  etiquetasDisponibles: string[];
  onSubmit: (values: RecursoFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const RecursoForm: React.FC<RecursoFormProps> = ({
  initialValues,
  temas,
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
  const [tema, setTema] = useState(initialValues?.tema || (temas[0]?.id || ""));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [url, setUrl] = useState(initialValues?.url || "");
  const [etiquetas, setEtiquetas] = useState<string[]>(initialValues?.etiquetas || []);

  useEffect(() => {
    if (initialValues) {
      setTitulo(initialValues.titulo || "");
      setDescripcion(initialValues.descripcion || "");
      setTipo(initialValues.tipo || (tiposRecursos[0]?.id || ""));
      setTema(initialValues.tema || (temas[0]?.id || ""));
      setUrl(initialValues.url || "");
      setEtiquetas(initialValues.etiquetas || []);
    }
    // eslint-disable-next-line
  }, [JSON.stringify(initialValues)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ titulo, descripcion, tipo, tema, archivo, url, etiquetas });
  };

  const handleEtiquetasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEtiquetas(e.target.value.split(",").map(et => et.trim()).filter(Boolean));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-secondary/90 to-primary/90 rounded-2xl shadow-2xl border border-accent/30 p-6 max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <FaPaperclip className="text-accent text-2xl" />
        <h2 className="text-xl font-bold text-accent">{initialValues ? 'Editar Recurso' : 'Nuevo Recurso'}</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3">
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
          <div className="relative">
            <input
              type="text"
              className="input-std w-full pl-10"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción breve"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">📝</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative">
            <select
              className="input-std w-full pl-10"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              required
            >
              {tiposRecursos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🏷️</span>
          </div>
          <div className="relative">
            <select
              className="input-std w-full pl-10"
              value={tema}
              onChange={e => setTema(e.target.value)}
              required
            >
              {temas.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">📚</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="block text-sm font-medium mb-1">Archivo (opcional)</label>
          <input
            type="file"
            className="input-std w-full border-dashed border-2 border-accent bg-transparent text-white"
            onChange={e => setArchivo(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <input
              type="url"
              className="input-std w-full pl-10"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🔗</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="block text-sm font-medium mb-1">Etiquetas (separadas por coma)</label>
          <div className="relative">
            <input
              type="text"
              className="input-std w-full pl-10"
              value={etiquetas.join(", ")}
              onChange={handleEtiquetasChange}
              placeholder="Ej: importante, referencia, externo"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">#</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {etiquetasDisponibles.map((et, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">{et}</span>
            ))}
          </div>
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
