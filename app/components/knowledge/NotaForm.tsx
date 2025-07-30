"use client";
import React, { useState, useEffect } from "react";
import { FaFileAlt } from "react-icons/fa";

interface NotaFormValues {
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
  tema: string;
  priority?: string;
  date?: string;
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
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion || "");

  useEffect(() => {
    if (initialValues) {
      setNombre(initialValues.nombre || "");
      setContenido(initialValues.contenido || "");
      setTipo(initialValues.tipo || (tiposNotas[0]?.id || ""));
      setTema(initialValues.tema || (temas[0]?.id || ""));
      setEtiquetas(initialValues.etiquetas || []);
      setDescripcion(initialValues.descripcion || "");
    }
    // eslint-disable-next-line
  }, [JSON.stringify(initialValues)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nombre, contenido, tipo, etiquetas, descripcion, tema });
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
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Título de la nota"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contenido</label>
        <textarea
          className="input-std w-full min-h-[120px]"
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          placeholder="Contenido de la nota"
          rows={6}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de nota</label>
          <select
            className="input-std w-full"
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            required
          >
            {tiposNotas.map(t => (
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
        <label className="block text-sm font-medium mb-1">Etiquetas (separadas por coma)</label>
        <input
          type="text"
          className="input-std w-full"
          value={etiquetas.join(", ")}
          onChange={handleEtiquetasChange}
          placeholder="Ej: importante, tarea, urgente"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {etiquetasDisponibles.map((et, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">{et}</span>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
        <input
          type="text"
          className="input-std w-full"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción breve"
        />
      </div>
      <div className="flex gap-2 justify-end">
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
