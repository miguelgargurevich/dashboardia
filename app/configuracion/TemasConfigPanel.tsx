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



// Cargar temas desde el JSON centralizado en public/temas.json

const fetchTemasJson = async (): Promise<Tema[]> => {
  const res = await fetch("/temas.json");
  if (!res.ok) return [];
  return await res.json();
};

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


// Si no se reciben temas, usar los base

const TemasConfigPanel: React.FC<Partial<TemasConfigPanelProps>> = ({ temas, onChange }) => {
  const [temasState, setTemasState] = useState<Tema[]>(temas && temas.length > 0 ? temas : []);
  const [editando, setEditando] = useState<Tema | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", color: colores[0] });

  // Cargar temas desde el JSON centralizado al montar
  useEffect(() => {
    if (!temas || temas.length === 0) {
      fetchTemasJson().then(json => {
        setTemasState(json);
        onChange && onChange(json);
      });
    }
  }, []);


  const handleEdit = (tema: Tema) => {
    setEditando(tema);
    setForm({ nombre: tema.nombre, descripcion: tema.descripcion, color: tema.color });
    setMostrarFormulario(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este tema?")) return;
    const nuevos = temasState.filter(t => t.id !== id);
    setTemasState(nuevos);
    onChange && onChange(nuevos);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let nuevos: Tema[];
    if (editando) {
      nuevos = temasState.map(t =>
        t.id === editando.id ? { ...t, nombre: form.nombre, descripcion: form.descripcion, color: form.color } : t
      );
      setEditando(null);
    } else {
      nuevos = [
        ...temasState,
        { id: Date.now().toString(), nombre: form.nombre, descripcion: form.descripcion, color: form.color }
      ];
    }
    setTemasState(nuevos);
    onChange && onChange(nuevos);
    setForm({ nombre: "", descripcion: "", color: colores[0] });
    setMostrarFormulario(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <FaLayerGroup className="text-2xl text-accent" />
          <h1 className="text-3xl font-bold text-accent">Configuración Temas</h1>
        </div>
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setEditando(null);
            setForm({ nombre: "", descripcion: "", color: colores[0] });
          }}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus /> Agregar Tema
        </button>
      </div>
      <ul className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {temasState.map(tema => (
          <li key={tema.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-accent/20 shadow-lg bg-primary/80 ${tema.color.replace('/20','/10')} transition-all`}>
            <div className="flex-1">
              <div className="font-bold text-base flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full border border-white/30 mr-1" style={{background: tema.color.split(' ')[0].replace('bg-','').replace('-500/20','')}}></span>
                {tema.nombre}
              </div>
              <div className="text-xs opacity-70 mt-1">{tema.descripcion}</div>
            </div>
            <button onClick={() => handleEdit(tema)} className="text-blue-400 hover:text-blue-200"><FaEdit /></button>
            <button onClick={() => handleDelete(tema.id)} className="text-red-400 hover:text-red-200"><FaTrash /></button>
          </li>
        ))}
      </ul>
      {/* Botón movido arriba, junto al título */}
      {mostrarFormulario && (
        <div className="mb-4">
          <form onSubmit={handleSubmit} className="space-y-2 bg-secondary p-4 rounded-lg border border-accent/10">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del tema"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="flex-1 bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                required
              />
              <select
                value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-40 bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              >
                {colores.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="w-full bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-accent text-secondary font-semibold py-2 rounded-lg hover:bg-accent/80 transition-all">
                {editando ? "Actualizar Tema" : "Crear Tema"}
              </button>
              <button type="button" onClick={() => { setMostrarFormulario(false); setEditando(null); }} className="flex-1 bg-gray-600/80 text-white font-semibold py-2 rounded-lg hover:bg-gray-700/80 transition-all">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TemasConfigPanel;
