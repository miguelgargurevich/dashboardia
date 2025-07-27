"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaLayerGroup } from "react-icons/fa";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface TemasConfigPanelProps {
  temas: Tema[];
  onChange: (temas: Tema[]) => void;
}

const colores = [
  "bg-blue-500/20 text-blue-400 border-blue-400/30",
  "bg-purple-500/20 text-purple-400 border-purple-400/30",
  "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  "bg-green-500/20 text-green-400 border-green-400/30",
  "bg-red-500/20 text-red-400 border-red-400/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-400/30",
  "bg-pink-500/20 text-pink-400 border-pink-400/30",
  "bg-orange-500/20 text-orange-400 border-orange-400/30"
];

const TemasConfigPanel: React.FC<TemasConfigPanelProps> = ({ temas, onChange }) => {
  const [editando, setEditando] = useState<Tema | null>(null);
  const [form, setForm] = useState({ nombre: "", descripcion: "", color: colores[0] });

  const handleEdit = (tema: Tema) => {
    setEditando(tema);
    setForm({ nombre: tema.nombre, descripcion: tema.descripcion, color: tema.color });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este tema?")) return;
    onChange(temas.filter(t => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando) {
      onChange(
        temas.map(t =>
          t.id === editando.id ? { ...t, nombre: form.nombre, descripcion: form.descripcion, color: form.color } : t
        )
      );
      setEditando(null);
    } else {
      onChange([
        ...temas,
        { id: Date.now().toString(), nombre: form.nombre, descripcion: form.descripcion, color: form.color }
      ]);
    }
    setForm({ nombre: "", descripcion: "", color: colores[0] });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FaLayerGroup className="text-lg text-accent" />
        <h2 className="text-lg font-bold text-accent">Temas</h2>
      </div>
      <ul className="mb-4">
        {temas.map(tema => (
          <li key={tema.id} className={`flex items-center gap-2 mb-2 p-2 rounded border ${tema.color}`}>
            <span className="font-semibold flex-1">{tema.nombre}</span>
            <span className="text-xs opacity-70">{tema.descripcion}</span>
            <button onClick={() => handleEdit(tema)} className="text-blue-400 hover:text-blue-200"><FaEdit /></button>
            <button onClick={() => handleDelete(tema.id)} className="text-red-400 hover:text-red-200"><FaTrash /></button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="space-y-2 bg-secondary p-4 rounded-lg border border-accent/10">
        <input
          type="text"
          placeholder="Nombre del tema"
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        />
        <select
          value={form.color}
          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
          className="w-full bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
        >
          {colores.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="w-full bg-accent text-secondary font-semibold py-2 rounded-lg hover:bg-accent/80 transition-all">
          {editando ? "Actualizar Tema" : "Agregar Tema"}
        </button>
      </form>
    </div>
  );
};

export default TemasConfigPanel;
