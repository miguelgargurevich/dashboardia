
"use client";
import React, { useState, useEffect } from "react";
import RecursosSelectorModal from "./RecursosSelectorModal";
import { FaCalendarAlt } from "react-icons/fa";

export interface EventoFormValues {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  modo?: string;
  validador?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
  relatedResources?: string[];
  //
  isRecurring?: boolean;
  recurrencePattern?: string;
  eventType?: string;
}

interface EventoFormProps {
  initialValues?: Partial<EventoFormValues>;
  onSubmit: (values: EventoFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitLabel?: string;
}

const EventoForm: React.FC<EventoFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar evento"
}) => {

  // Normaliza fecha a formato YYYY-MM-DDTHH:mm para input datetime-local
  function normalizeDate(val?: string) {
    if (!val) return "";
    // Si ya está en formato corto, no tocar
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) return val;
    // Si es ISO, recortar
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) return val.slice(0, 16);
    return val;
  }

  const [form, setForm] = useState<EventoFormValues>({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    startDate: normalizeDate(initialValues?.startDate),
    endDate: normalizeDate(initialValues?.endDate),
    location: initialValues?.location || "",
    modo: initialValues?.modo || "",
    validador: initialValues?.validador || "",
    codigoDana: initialValues?.codigoDana || "",

    nombreNotificacion: initialValues?.nombreNotificacion || "",
    diaEnvio: initialValues?.diaEnvio || "",
    query: initialValues?.query || "",
    relatedResources: initialValues?.relatedResources || [],
    isRecurring: initialValues?.isRecurring || false,
    recurrencePattern: initialValues?.recurrencePattern || "",
    eventType: initialValues?.eventType || "",
  });

  // Modal de selección de recursos
  const [recursosModalAbierto, setRecursosModalAbierto] = useState(false);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<{ id: string; titulo: string; tipo?: string; descripcion?: string }[]>([]);

  // Sincronizar recursos seleccionados con initialValues
  useEffect(() => {
    if (initialValues?.relatedResources && initialValues.relatedResources.length > 0) {
      // Cargar detalles de los recursos seleccionados
      fetch('/api/resources')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.recursos)) {
            setRecursosSeleccionados(
              data.recursos.filter((r: any) => initialValues.relatedResources?.includes(r.id))
            );
          }
        });
    } else {
      setRecursosSeleccionados([]);
    }
  }, [initialValues]);

  useEffect(() => {
    if (initialValues) {
      setForm(f => ({
        ...f,
        ...initialValues,
        startDate: normalizeDate(initialValues.startDate),
        endDate: normalizeDate(initialValues.endDate),
      }));
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === 'checkbox' && 'checked' in e.target) {
      newValue = (e.target as HTMLInputElement).checked;
    }
    setForm(f => ({
      ...f,
      [name]: newValue
    }));
  };

  // Manejar archivos adjuntos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setForm(f => ({ ...f, archivosAdjuntos: files }));
  };


  // Cuando el usuario confirma selección en el modal
  const handleRecursosSeleccionados = (recursos: { id: string; titulo: string; tipo?: string; descripcion?: string }[]) => {
    setRecursosSeleccionados(recursos);
    setForm(f => ({ ...f, relatedResources: recursos.map(r => r.id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full input-std"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          rows={2}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Fecha inicio *</label>
          <input
            type="datetime-local"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            className="w-full input-std"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Fecha fin</label>
          <input
            type="datetime-local"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className="w-full input-std"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Ubicación</label>
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full input-std"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Modo</label>
          <input
            type="text"
            name="modo"
            value={form.modo}
            onChange={handleChange}
            className="w-full input-std"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Validador</label>
          <input
            type="text"
            name="validador"
            value={form.validador}
            onChange={handleChange}
            className="w-full input-std"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Código Dana</label>
          <input
            type="text"
            name="codigoDana"
            value={form.codigoDana}
            onChange={handleChange}
            className="w-full input-std"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Notificación</label>
          <input
            type="text"
            name="nombreNotificacion"
            value={form.nombreNotificacion}
            onChange={handleChange}
            className="w-full input-std"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de evento</label>
          <select
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
            className="w-full input-std"
          >
            <option value="">Seleccionar</option>
            <option value="incidente">Incidente</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="reunion">Reunión</option>
            <option value="capacitacion">Capacitación</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">Recurrencia</label>
          <select
            name="recurrencePattern"
            value={form.recurrencePattern}
            onChange={handleChange}
            className="w-full input-std"
          >
            <option value="">Sin recurrencia</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Día de Envío (ej: 6 DE CADA MES)</label>
        <input
          type="text"
          name="diaEnvio"
          value={form.diaEnvio}
          onChange={handleChange}
          className="w-full input-std"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Query (opcional)</label>
        <input
          type="text"
          name="query"
          value={form.query}
          onChange={handleChange}
          className="w-full input-std"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Recursos Relacionados</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {recursosSeleccionados.length === 0 ? (
            <span className="text-gray-400 text-sm">Ningún recurso seleccionado.</span>
          ) : (
            recursosSeleccionados.map(r => (
              <span key={r.id} className="px-2 py-1 bg-gray-700/40 text-gray-200 text-xs rounded flex items-center gap-1">
                📄 {r.titulo}
                {r.tipo && <span className="ml-1 text-gray-400">({r.tipo})</span>}
              </span>
            ))
          )}
        </div>
        <button type="button" className="px-3 py-1 rounded bg-accent text-primary font-bold hover:bg-accent/80 transition" onClick={() => setRecursosModalAbierto(true)}>
          Seleccionar recursos
        </button>
        <RecursosSelectorModal
          open={recursosModalAbierto}
          onClose={() => setRecursosModalAbierto(false)}
          onSelect={handleRecursosSeleccionados}
          selectedIds={form.relatedResources || []}
          token={typeof window !== 'undefined' ? (window.localStorage.getItem('token') || undefined) : undefined}
        />
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700 transition" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" disabled={loading}>
          <span className="mr-2"><FaCalendarAlt /></span> {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default EventoForm;
