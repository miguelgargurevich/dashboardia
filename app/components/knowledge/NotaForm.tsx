"use client";
import React, { useState, useEffect } from "react";
import RecursosSelectorPanel from "../resources/RecursosSelectorPanel";
import FileUploadS3 from "../FileUploadS3";
import { FaFileAlt, FaStickyNote, FaHashtag, FaRegStickyNote } from "react-icons/fa";

interface NotaFormValues {
  title: string;
  content: string;
  tipo: string;
  tags?: string[];
  priority?: string;
  date?: string; // Único campo de fecha
  relatedResources?: string[];
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface Recurso {
  id: string;
  titulo: string;
  tipo?: string;
  descripcion?: string;
}

interface NotaFormProps {
  initialValues?: NotaFormValues;
  tiposNotas: TipoNota[];
  etiquetasDisponibles: string[];
  onSubmit: (values: NotaFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
  readOnly?: boolean;
}

const NotaForm: React.FC<NotaFormProps> = ({
  initialValues,
  tiposNotas,
  etiquetasDisponibles,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar nota",
  readOnly = false
}) => {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [content, setContent] = useState(initialValues?.content || "");
  const [tipo, setTipo] = useState(initialValues?.tipo || (tiposNotas[0]?.id || ""));
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [recursosModalOpen, setRecursosModalOpen] = useState(false);
  // Estado para los detalles de los recursos seleccionados
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<Recurso[]>([]);
  const [relatedResources, setRelatedResources] = useState<string[]>(initialValues?.relatedResources || []);

  // Cargar detalles de recursos relacionados al abrir el modal (detalle o edición)
  useEffect(() => {
    async function fetchRecursos() {
      if (initialValues?.relatedResources && initialValues.relatedResources.length > 0) {
        try {
          // Obtener token si existe (para rutas protegidas)
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
          // Fetch de todos los recursos relacionados en paralelo
          const recursos = await Promise.all(
            initialValues.relatedResources.map(async (id) => {
              const res = await fetch(`/api/resources/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
              });
              if (!res.ok) return null;
              return await res.json();
            })
          );
          setRecursosSeleccionados(recursos.filter(Boolean));
        } catch {
          setRecursosSeleccionados([]);
        }
      } else {
        setRecursosSeleccionados([]);
      }
    }
    fetchRecursos();
    // Solo cuando cambian los recursos relacionados
  }, [initialValues?.relatedResources]);
  const getToday = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };
  // Normaliza la fecha a formato YYYY-MM-DD si viene en otro formato
  const normalizeDate = (dateStr?: string) => {
    if (!dateStr) return getToday();
    // Si ya está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Si es un string de fecha válido
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return getToday();
  };
  const [date, setDate] = useState(normalizeDate(initialValues?.date));

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || "");
      setContent(initialValues.content || "");
      setTipo(initialValues.tipo || (tiposNotas[0]?.id || ""));
      setTags(initialValues.tags || []);
      setDate(normalizeDate(initialValues.date));
      setRelatedResources(initialValues.relatedResources || []);
    } else {
      setTitle("");
      setContent("");
      setTipo(tiposNotas[0]?.id || "");
      setTags([]);
      setDate(getToday());
      setRelatedResources([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, tiposNotas]);

  // ...resto de hooks y funciones...

  // --- FUNCIONES AUXILIARES ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = {
      title,
      content,
      tipo,
      tags,
      date,
      relatedResources
    };
    await onSubmit(values);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(
      e.target.value
        .split(/\s*,\s*/)
        .map(et => et.trim())
        .filter(Boolean)
    );
  };

  const handleAgregarTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-secondary/90 to-primary/90 rounded-2xl shadow-2xl border border-accent/30 p-6 max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <FaRegStickyNote className="text-accent text-2xl" />
          <h2 className="text-xl font-bold text-accent">{initialValues ? (readOnly ? 'Detalle de Nota' : 'Editar Nota') : 'Nueva Nota'}</h2>
        </div>
        {/* Primera fila: Título y Fecha */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              className="input-std w-full pl-10"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título de la nota"
              required
              disabled={readOnly}
            />
            <FaRegStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
          </div>
          <div className="w-full md:w-48 relative flex items-center min-h-[40px]">
            {readOnly ? (
              <>
                <span className="pl-10 text-base text-gray-200">{date ? new Date(date).toLocaleDateString('es-ES') : '-'}</span>
                <FaRegStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              </>
            ) : (
              <>
                <input
                  type="date"
                  className="input-std w-full pl-10"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
                <FaRegStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
              </>
            )}
          </div>
        </div>
        {/* Segunda fila: Tipo */}
        <div className="relative">
          <select
            className="input-std w-full pl-10 appearance-none"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
            disabled={readOnly}
          >
            {tiposNotas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          <FaStickyNote className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
        </div>
        {/* Tercera fila: Contenido */}
        <div className="relative">
          <textarea
            className="input-std w-full min-h-[120px] pl-10"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Contenido de la nota"
            rows={6}
            required
            disabled={readOnly}
          />
          <FaStickyNote className="absolute left-3 top-4 text-accent" />
        </div>
        {/* Cuarta fila: Tags */}
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="relative">
            <input
              type="text"
              className="input-std w-full pl-10"
              value={tags.join(", ")}
              onChange={handleTagsChange}
              placeholder="Ej: importante, tarea, urgente"
              disabled={readOnly}
            />
            <FaHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {etiquetasDisponibles.map((et, idx) => (
              <button
                type="button"
                key={idx}
                className={`px-2 py-0.5 rounded text-xs border transition focus:outline-none ${
                  tags.includes(et)
                    ? 'bg-accent text-primary border-accent'
                    : 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/30'
                }`}
                onClick={() => !readOnly && handleAgregarTag(et)}
                tabIndex={0}
                disabled={readOnly}
              >
                {et}
              </button>
            ))}
          </div>
        </div>
        {/* Subida de archivos a S3 */}
        {!readOnly && (
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Adjuntar nuevo archivo</label>
          <FileUploadS3
            categoria="notas"
            onUploadComplete={result => {
              // El recurso subido está en result.recurso
              const recurso = result.recurso;
              setRelatedResources(prev => prev.includes(recurso.id) ? prev : [...prev, recurso.id]);
              setRecursosSeleccionados(prev => prev.some(r => r.id === recurso.id) ? prev : [...prev, recurso]);
            }}
            onError={(err) => alert('Error subiendo archivo: ' + err)}
            multiple={false}
          />
        </div>
        )}
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
          {!readOnly && (
            <button type="button" className="px-3 py-1 rounded bg-accent text-primary font-bold hover:bg-accent/80 transition mb-2" onClick={() => setRecursosModalOpen(v => !v)}>
              Seleccionar recursos
            </button>
          )}
        </div>
        {!readOnly && (
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
        )}
      </form>
      <RecursosSelectorPanel
        open={recursosModalOpen}
        onClose={() => setRecursosModalOpen(false)}
        onSelect={recursos => {
          setRelatedResources(recursos.map(r => r.id));
          setRecursosSeleccionados(recursos); // Sincroniza detalles
          setRecursosModalOpen(false);
        }}
        selectedIds={relatedResources}
        token={typeof window !== 'undefined' ? localStorage.getItem('token') : undefined}
      />
    </>
  );
}

export default NotaForm;
