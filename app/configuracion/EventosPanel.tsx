"use client";
import React, { useState } from "react";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";

interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  tags: string[];
}

const mockEventos: Evento[] = [
  { id: "1", titulo: "Mantenimiento Servidor", fecha: "2025-07-28", tags: ["mantenimiento", "servidor"] },
  { id: "2", titulo: "Reunión Mensual", fecha: "2025-07-30", tags: ["reunión", "mensual"] },
  { id: "3", titulo: "Capacitación Helpdesk", fecha: "2025-08-01", tags: ["capacitación", "helpdesk"] },
];

const EventosPanel: React.FC = () => {
  const [search, setSearch] = useState("");
  const filtered = mockEventos.filter(ev =>
    ev.titulo.toLowerCase().includes(search.toLowerCase()) ||
    ev.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-primary rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <FaCalendarAlt className="text-2xl text-accent" />
        <h2 className="text-2xl font-bold text-accent">Eventos</h2>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título o tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-gray-400">No hay eventos.</div>}
        {filtered.map(ev => (
          <div key={ev.id} className="bg-secondary/40 rounded-lg p-3 border border-accent/20 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{ev.titulo}</span>
              <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-bold">{ev.fecha}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {ev.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventosPanel;
