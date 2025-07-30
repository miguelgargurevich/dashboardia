"use client";
import React, { useEffect, useState } from "react";


interface Event {
  id?: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  recurrenceType?: string;
  eventType?: string;
  validador?: string;
  modo?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  diaEnvio?: string;
  query?: string;
}

const emptyEvent: Event = {
  title: '',
  startDate: '',
  endDate: '',
  location: '',
  recurrenceType: '',
  eventType: '',
  validador: '',
  modo: '',
  codigoDana: '',
  nombreNotificacion: '',
  diaEnvio: '',
  query: '',
};

interface EventosListPanelProps {
  selectedDate?: string;
}

export default function EventosListPanel({ selectedDate }: EventosListPanelProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<Event>(emptyEvent);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/eventos");
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyEvent);
    setShowModal(true);
  };
  const openEdit = (ev: Event) => {
    setEditing(ev);
    setForm(ev);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyEvent);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/eventos/${editing.id}` : '/api/eventos';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchEvents();
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('¿Eliminar este evento?')) return;
    await fetch(`/api/eventos/${id}`, { method: 'DELETE' });
    await fetchEvents();
  };

  return (
    <div className="bg-primary rounded-lg p-4 shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-accent">Lista de eventos</h3>
        <button className="px-2 py-1 bg-accent text-white rounded hover:bg-accent/80 text-xs" onClick={openNew}>Nuevo evento</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Cargando...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-400">No hay eventos</div>
      ) : (
        <ul className="divide-y divide-accent/10 overflow-y-auto max-h-96">
          {events.map(ev => (
            <li key={ev.id} className="py-2 flex items-center justify-between group">
              <div>
                <div className="font-semibold text-sm text-accent">{ev.title}</div>
                <div className="text-xs text-gray-400">{new Date(ev.startDate).toLocaleDateString('es-ES')}</div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded" onClick={() => openEdit(ev)}>Editar</button>
                <button className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded" onClick={() => handleDelete(ev.id)}>Eliminar</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal para crear/editar evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-md" onSubmit={handleSave}>
            <h4 className="text-lg font-bold mb-4 text-accent">{editing ? 'Editar evento' : 'Nuevo evento'}</h4>
            <div className="mb-2">
              <label className="block text-xs mb-1">Título</label>
              <input name="title" value={form.title} onChange={handleChange} required className="w-full px-2 py-1 rounded bg-primary text-white" />
            </div>
            <div className="mb-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha inicio</label>
                <input type="date" name="startDate" value={form.startDate?.slice(0,10) || ''} onChange={handleChange} required className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Fecha fin</label>
                <input type="date" name="endDate" value={form.endDate?.slice(0,10) || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">Ubicación</label>
              <input name="location" value={form.location || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
            </div>
            <div className="mb-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Tipo de evento</label>
                <select name="eventType" value={form.eventType || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white">
                  <option value="">Seleccionar</option>
                  <option value="incidente">Incidente</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="reunion">Reunión</option>
                  <option value="capacitacion">Capacitación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Recurrencia</label>
                <select name="recurrenceType" value={form.recurrenceType || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white">
                  <option value="">Ninguna</option>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>
            <div className="mb-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Validador</label>
                <input name="validador" value={form.validador || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Modo</label>
                <input name="modo" value={form.modo || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
            </div>
            <div className="mb-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Código Dana</label>
                <input name="codigoDana" value={form.codigoDana || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Nombre Notificación</label>
                <input name="nombreNotificacion" value={form.nombreNotificacion || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
            </div>
            <div className="mb-2 flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1">Día de Envío</label>
                <input name="diaEnvio" value={form.diaEnvio || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1">Query</label>
                <input name="query" value={form.query || ''} onChange={handleChange} className="w-full px-2 py-1 rounded bg-primary text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="px-3 py-1 rounded bg-gray-600 text-white" onClick={closeModal} disabled={saving}>Cancelar</button>
              <button type="submit" className="px-3 py-1 rounded bg-accent text-white" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
