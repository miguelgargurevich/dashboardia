"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaFolderOpen } from "react-icons/fa";

interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface RecursosConfigPanelProps {
  tiposRecursos?: TipoRecurso[];
  onChange?: (tiposRecursos: TipoRecurso[]) => void;
}

interface ColorOption {
  nombre: string;
  hex: string;
  tailwind: string;
}

const RecursosConfigPanel: React.FC<RecursosConfigPanelProps> = ({ tiposRecursos: tiposRecursosProp, onChange }) => {
  const [tiposState, setTiposState] = useState<TipoRecurso[]>(tiposRecursosProp || []);
  const [colores, setColores] = useState<ColorOption[]>([]);
  const [editando, setEditando] = useState<TipoRecurso | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: "", descripcion: "", color: "" });

  // Función para obtener el color por su valor tailwind
  const obtenerColorPorTailwind = (tailwindColor: string) => {
    if (colores.length === 0) return null;
    return colores.find(c => c.tailwind === tailwindColor) || colores[0];
  };

  // Función para obtener el hex de un color tailwind
  const obtenerHexPorTailwind = (tailwindColor: string) => {
    if (colores.length === 0) return '#3B82F6'; // Color azul por defecto
    const colorObj = colores.find(c => c.tailwind === tailwindColor);
    return colorObj ? colorObj.hex : colores[0].hex;
  };

  // Cargar datos si no se pasan como props
  useEffect(() => {
    const cargarDatos = async () => {
      await Promise.all([
        cargarColores(),
        !tiposRecursosProp ? cargarTiposRecursos() : Promise.resolve()
      ]);
    };
    cargarDatos();
  }, [tiposRecursosProp]);

  const cargarColores = async () => {
    try {
      const response = await fetch('/api/config/colores');
      if (response.ok) {
        const data = await response.json();
        setColores(data);
        // Solo establecer el primer color como default si no hay form.color y NO estamos editando
        if (!form.color && data.length > 0 && !editando) {
          setForm(prev => ({ ...prev, color: data[0].tailwind }));
        }
      } else {
        console.error('Error en respuesta de colores:', response.status);
        // Usar colores por defecto si falla la API
        const coloresDefault = [
          { nombre: "Azul", hex: "#3B82F6", tailwind: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
          { nombre: "Morado", hex: "#8B5CF6", tailwind: "bg-purple-500/20 text-purple-400 border-purple-400/30" },
          { nombre: "Verde", hex: "#10B981", tailwind: "bg-green-500/20 text-green-400 border-green-400/30" },
          { nombre: "Rojo", hex: "#EF4444", tailwind: "bg-red-500/20 text-red-400 border-red-400/30" }
        ];
        setColores(coloresDefault);
        if (!form.color && !editando) {
          setForm(prev => ({ ...prev, color: coloresDefault[0].tailwind }));
        }
      }
    } catch (error) {
      console.error('Error cargando colores:', error);
      // Usar colores por defecto en caso de error
      const coloresDefault = [
        { nombre: "Azul", hex: "#3B82F6", tailwind: "bg-blue-500/20 text-blue-400 border-blue-400/30" },
        { nombre: "Morado", hex: "#8B5CF6", tailwind: "bg-purple-500/20 text-purple-400 border-purple-400/30" },
        { nombre: "Verde", hex: "#10B981", tailwind: "bg-green-500/20 text-green-400 border-green-400/30" },
        { nombre: "Rojo", hex: "#EF4444", tailwind: "bg-red-500/20 text-red-400 border-red-400/30" }
      ];
      setColores(coloresDefault);
      if (!form.color && !editando) {
        setForm(prev => ({ ...prev, color: coloresDefault[0].tailwind }));
      }
    }
  };

  const cargarTiposRecursos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config/tipos-recursos');
      if (response.ok) {
        const data = await response.json();
        setTiposState(data);
      }
    } catch (error) {
      console.error('Error cargando tipos de recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de recursos desde el JSON centralizado al montar
  useEffect(() => {
    if (!tiposRecursosProp || tiposRecursosProp.length === 0) {
      cargarTiposRecursos();
    }
  }, []);

  const handleEdit = (tipo: TipoRecurso) => {
    setEditando(tipo);
    setForm({ nombre: tipo.nombre, descripcion: tipo.descripcion, color: tipo.color });
    setMostrarFormulario(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar este tipo de recurso?")) return;
    const nuevos = tiposState.filter(t => t.id !== id);
    setTiposState(nuevos);
    onChange && onChange(nuevos);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let nuevos: TipoRecurso[];
    if (editando) {
      nuevos = tiposState.map(t =>
        t.id === editando.id ? { ...t, nombre: form.nombre, descripcion: form.descripcion, color: form.color } : t
      );
      setEditando(null);
    } else {
      nuevos = [
        ...tiposState,
        { id: Date.now().toString(), nombre: form.nombre, descripcion: form.descripcion, color: form.color }
      ];
    }
    setTiposState(nuevos);
    onChange && onChange(nuevos);
    setForm({ nombre: "", descripcion: "", color: colores.length > 0 ? colores[0].tailwind : "" });
    setMostrarFormulario(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <FaFolderOpen className="text-2xl text-accent" />
          <h1 className="text-3xl font-bold text-accent">Configuración de Tipos de Recursos</h1>
        </div>
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setEditando(null);
            setForm({ nombre: "", descripcion: "", color: colores.length > 0 ? colores[0].tailwind : "" });
          }}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus /> Agregar Tipo
        </button>
      </div>
      <ul className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {tiposState.map(tipo => (
          <li key={tipo.id} className={`flex items-center gap-3 p-4 rounded-2xl border border-accent/20 shadow-lg bg-primary/80 ${tipo.color} transition-all`}>
            <div className="flex-1">
              <div className="font-bold text-base flex items-center gap-2">
                <span 
                  className="inline-block w-3 h-3 rounded-full border border-white/30 mr-1" 
                  style={{backgroundColor: obtenerHexPorTailwind(tipo.color)}}
                ></span>
                {tipo.nombre}
              </div>
              <div className="text-xs opacity-70 mt-1">{tipo.descripcion}</div>
            </div>
            <button onClick={() => handleEdit(tipo)} className="text-blue-400 hover:text-blue-200"><FaEdit /></button>
            <button onClick={() => handleDelete(tipo.id)} className="text-red-400 hover:text-red-200"><FaTrash /></button>
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
                placeholder="Nombre del tipo de recurso"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="flex-1 input-std"
                required
              />
              <div className="flex items-center gap-2">
                <select
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-40 bg-primary/80 border border-accent/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  {colores.map(c => (
                    <option key={c.tailwind} value={c.tailwind}>
                      {c.nombre} {c.hex}
                    </option>
                  ))}
                </select>
                {form.color && (
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-4 h-4 rounded-full border border-white/30" 
                      style={{backgroundColor: obtenerHexPorTailwind(form.color)}}
                    ></span>
                    <span className="text-xs text-gray-400">
                      {obtenerColorPorTailwind(form.color)?.hex}
                    </span>
                  </div>
                )}
              </div>
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
                {editando ? "Actualizar Tipo" : "Crear Tipo"}
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

export default RecursosConfigPanel;
