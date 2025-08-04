"use client";

import { useEffect, useState } from "react";
import { FaPlus, FaSearch } from 'react-icons/fa';
import { formatFechaDDMMYYYY } from '../../lib/formatFecha';
import EventoForm from "./EventoForm";
import type { EventoFormValues } from "./EventoForm";


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
}




interface EventosListPanelProps {
  selectedDate?: string;
}

export default function EventosListPanel({ selectedDate }: EventosListPanelProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');

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
    // Si hay selectedDate, usarla como inicio (con hora 09:00 por defecto)
    let startDate = '';
    if (selectedDate) {
      // selectedDate puede venir como yyyy-MM-dd o yyyy-MM-ddTHH:mm
      const base = selectedDate.slice(0, 10);
      startDate = base + 'T09:00';
    } else {
      const now = new Date();
      now.setSeconds(0, 0);
      startDate = now.toISOString().slice(0, 16);
    }
        setEditing({
          title: '',
          startDate,
          endDate: '',
          location: '',
          recurrenceType: '',
          eventType: '',
          validador: '',
          modo: '',
          codigoDana: '',
          nombreNotificacion: '',
          diaEnvio: '',
        });
    setShowModal(true);
  };
  const openEdit = (ev: Event) => {
    setEditing(ev);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };


  // Maneja el submit del EventoForm
  const handleSave = async (values: EventoFormValues) => {
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/eventos/${editing.id}` : '/api/eventos';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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

  // Filtrar eventos por búsqueda y fecha
  let filteredEvents = events;
  if (selectedDate) {
    const selected = selectedDate.slice(0, 10); // yyyy-MM-dd
    filteredEvents = filteredEvents.filter(ev => ev.startDate && ev.startDate.slice(0, 10) === selected);
  }
  if (busqueda.trim() !== '') {
    filteredEvents = filteredEvents.filter(ev =>
      ev.title.toLowerCase().includes(busqueda.toLowerCase()) ||
      (ev.location && ev.location.toLowerCase().includes(busqueda.toLowerCase()))
    );
  }

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-accent">Gestión de Eventos</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus />
          Nuevo Evento
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-secondary rounded-lg p-4 mb-0">
        <div className="relative flex items-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-lg pointer-events-none">
            <FaSearch />
          </span>
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 input-std pl-10"
          />
        </div>
      </div>

      {/* Vista Lista - Todos los eventos */}
      <div className="bg-primary rounded-lg p-6 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-accent">
          Eventos ({filteredEvents.length})
        </h3>
        {loading ? (
          <div className="text-center text-gray-400">Cargando...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-gray-400">No hay eventos</div>
        ) : (
          <ul className="divide-y divide-accent/10">
            {filteredEvents.map(ev => (
              <li key={ev.id} className="py-2 flex items-center justify-between group">
                <div>
                  <div className="font-semibold text-sm text-accent">{ev.title}</div>
                  <div className="text-xs text-gray-400">{new Date(ev.startDate).toLocaleDateString('es-ES')}</div>
                  <div className="text-xs text-gray-400">{formatFechaDDMMYYYY(ev.startDate)}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded" onClick={() => openEdit(ev)}>Editar</button>
                  <button className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded" onClick={() => handleDelete(ev.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal para crear/editar evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-md">
            <h4 className="text-lg font-bold mb-4 text-accent">{editing ? 'Editar evento' : 'Nuevo evento'}</h4>
            <EventoForm
              initialValues={editing || undefined}
              onSubmit={handleSave}
              onCancel={closeModal}
              loading={saving}
              submitLabel={saving ? 'Guardando...' : 'Guardar'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
