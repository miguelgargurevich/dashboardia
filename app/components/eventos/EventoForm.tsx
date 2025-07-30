"use client";
import React, { useState, useEffect } from "react";

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
  const [form, setForm] = useState<EventoFormValues>({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    startDate: initialValues?.startDate || "",
    endDate: initialValues?.endDate || "",
    location: initialValues?.location || "",
    modo: initialValues?.modo || "",
    validador: initialValues?.validador || "",
    codigoDana: initialValues?.codigoDana || "",
    nombreNotificacion: initialValues?.nombreNotificacion || "",
    isRecurring: initialValues?.isRecurring || false,
    recurrencePattern: initialValues?.recurrencePattern || "",
    eventType: initialValues?.eventType || "",
  });

  useEffect(() => {
    if (initialValues) {
      setForm(f => ({ ...f, ...initialValues }));
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
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all"
          disabled={loading}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default EventoForm;
