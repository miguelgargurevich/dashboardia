
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
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-secondary/90 to-primary/90 rounded-2xl shadow-2xl border border-accent/30 p-6 max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <FaCalendarAlt className="text-accent text-2xl" />
        <h2 className="text-xl font-bold text-accent">{initialValues ? 'Editar Evento' : 'Nuevo Evento'}</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              name="title"
              className="input-std w-full pl-10"
              value={form.title}
              onChange={handleChange}
              placeholder="Título del evento"
              required
            />
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" />
          </div>
          <textarea
            name="description"
            className="input-std w-full min-h-[80px]"
            value={form.description}
            onChange={handleChange}
            placeholder="Descripción del evento"
            rows={4}
          />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative">
            <input
              type="datetime-local"
              name="startDate"
              className="input-std w-full pl-10"
              value={form.startDate}
              onChange={handleChange}
              required
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">📅</span>
          </div>
          <div className="relative">
            <input
              type="datetime-local"
              name="endDate"
              className="input-std w-full pl-10"
              value={form.endDate}
              onChange={handleChange}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">⏰</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              name="location"
              className="input-std w-full pl-10"
              value={form.location}
              onChange={handleChange}
              placeholder="Ubicación"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">📍</span>
          </div>
          <div className="relative">
            <input
              type="text"
              name="modo"
              className="input-std w-full pl-10"
              value={form.modo}
              onChange={handleChange}
              placeholder="Modo (opcional)"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🎯</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              name="validador"
              className="input-std w-full pl-10"
              value={form.validador}
              onChange={handleChange}
              placeholder="Validador (opcional)"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">✅</span>
          </div>
          <div className="relative">
            <input
              type="text"
              name="codigoDana"
              className="input-std w-full pl-10"
              value={form.codigoDana}
              onChange={handleChange}
              placeholder="Código Dana (opcional)"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🔢</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <select
              name="eventType"
              className="input-std w-full pl-10"
              value={form.eventType}
              onChange={handleChange}
            >
              <option value="">Tipo de evento</option>
              <option value="incidente">Incidente</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="reunion">Reunión</option>
              <option value="capacitacion">Capacitación</option>
              <option value="otro">Otro</option>
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🏷️</span>
          </div>
          <div className="relative">
            <select
              name="recurrencePattern"
              className="input-std w-full pl-10"
              value={form.recurrencePattern}
              onChange={handleChange}
            >
              <option value="">Sin recurrencia</option>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🔁</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              name="diaEnvio"
              className="input-std w-full pl-10"
              value={form.diaEnvio}
              onChange={handleChange}
              placeholder="Día de Envío (ej: 6 DE CADA MES)"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">📆</span>
          </div>
          <div className="relative">
            <input
              type="text"
              name="query"
              className="input-std w-full pl-10"
              value={form.query}
              onChange={handleChange}
              placeholder="Query (opcional)"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent">🔎</span>
          </div>
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
      <div className="flex gap-2 justify-end mt-4">
        {onCancel && (
          <button type="button" className="px-4 py-2 rounded-lg border border-gray-500 bg-transparent text-gray-300 hover:bg-gray-700 transition" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-primary font-bold hover:bg-accent/80 transition flex items-center gap-2" disabled={loading}>
          <FaCalendarAlt className="mr-2" /> {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default EventoForm;
