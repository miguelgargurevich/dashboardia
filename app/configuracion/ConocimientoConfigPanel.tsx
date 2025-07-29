"use client";
import React, { useState } from "react";
import { FaSearch, FaBook } from "react-icons/fa";

interface ConocimientoConfigPanelProps {
  // Puedes agregar props si necesitas
}

const mockData = [
  { id: 1, tipo: "Nota", titulo: "Procedimiento de Backup", tags: ["backup", "procedimiento"] },
  { id: 2, tipo: "Documento", titulo: "Manual de Usuario", tags: ["manual", "usuario"] },
  { id: 3, tipo: "Recurso", titulo: "Video Capacitación", tags: ["video", "capacitación"] },
  { id: 4, tipo: "Archivo", titulo: "Política de Seguridad", tags: ["seguridad", "política"] },
];

const ConocimientoConfigPanel: React.FC<ConocimientoConfigPanelProps> = () => {
  const [search, setSearch] = useState("");
  const filtered = mockData.filter(item =>
    item.titulo.toLowerCase().includes(search.toLowerCase()) ||
    item.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-primary rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <FaBook className="text-2xl text-accent" />
        <h2 className="text-2xl font-bold text-accent">Todo el conocimiento</h2>
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
        {filtered.length === 0 && <div className="text-gray-400">No hay resultados.</div>}
        {filtered.map(item => (
          <div key={item.id} className="bg-secondary/40 rounded-lg p-3 border border-accent/20 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-bold">{item.tipo}</span>
              <span className="font-semibold text-white">{item.titulo}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConocimientoConfigPanel;
