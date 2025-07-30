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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          className="input-std w-full"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Título del recurso"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <input
          type="text"
          className="input-std w-full"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción breve"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de recurso</label>
          <select
            className="input-std w-full"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
          >
            {tiposRecursos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tema</label>
          <select
            className="input-std w-full"
            value={tema}
            onChange={e => setTema(e.target.value)}
            required
          >
            {temas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Archivo (opcional)</label>
        <input
          type="file"
          className="input-std w-full border-dashed border-2 border-accent bg-transparent text-white"
          onChange={e => setArchivo(e.target.files ? e.target.files[0] : null)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL (opcional)</label>
        <input
          type="url"
          className="input-std w-full"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Etiquetas (separadas por coma)</label>
        <input
          type="text"
          className="input-std w-full"
          value={etiquetas.join(", ")}
          onChange={handleEtiquetasChange}
          placeholder="Ej: importante, referencia, externo"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {etiquetasDisponibles.map((et, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">{et}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
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
