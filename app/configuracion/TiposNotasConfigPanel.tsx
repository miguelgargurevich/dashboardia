"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaStickyNote, FaSave, FaTimes } from "react-icons/fa";

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TiposNotasConfigPanelProps {
  tiposNotas?: TipoNota[];
  onChange?: (tipos: TipoNota[]) => void;
}

interface ColorOption {
  nombre: string;
  hex: string;
  tailwind: string;
}

const TiposNotasConfigPanel: React.FC<TiposNotasConfigPanelProps> = ({ 
  tiposNotas: tiposNotasProp, 
  onChange 
}) => {
  const [tiposNotas, setTiposNotas] = useState<TipoNota[]>(tiposNotasProp || []);
  const [colores, setColores] = useState<ColorOption[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", color: "" });

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
        !tiposNotasProp ? cargarTiposNotas() : Promise.resolve()
      ]);
    };
    cargarDatos();
  }, [tiposNotasProp]);

  const cargarColores = async () => {
    try {
      const response = await fetch('/api/config/colores');
      if (response.ok) {
        const data = await response.json();
        setColores(data);
        // Solo establecer el primer color como default si no hay formData.color y NO estamos editando
        if (!formData.color && data.length > 0 && !editando) {
          setFormData(prev => ({ ...prev, color: data[0].tailwind }));
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
        if (!formData.color && !editando) {
          setFormData(prev => ({ ...prev, color: coloresDefault[0].tailwind }));
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
      if (!formData.color && !editando) {
        setFormData(prev => ({ ...prev, color: coloresDefault[0].tailwind }));
      }
    }
  };

  const cargarTiposNotas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config/tipos-notas');
      if (response.ok) {
        const data = await response.json();
        setTiposNotas(data);
      }
    } catch (error) {
      console.error('Error cargando tipos de notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.descripcion.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (editando) {
        // Actualizar tipo de nota existente
        const response = await fetch(`/api/config/tipos-notas/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const tipoActualizado = await response.json();
          const nuevosTipos = tiposNotas.map(tipo => 
            tipo.id === editando ? tipoActualizado : tipo
          );
          setTiposNotas(nuevosTipos);
          onChange?.(nuevosTipos);
          setEditando(null);
        }
      } else {
        // Crear nuevo tipo de nota
        const response = await fetch('/api/config/tipos-notas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const nuevoTipo = await response.json();
          const nuevosTipos = [...tiposNotas, nuevoTipo];
          setTiposNotas(nuevosTipos);
          onChange?.(nuevosTipos);
          setAgregando(false);
        }
      }

      setFormData({ 
        nombre: '', 
        descripcion: '', 
        color: colores.length > 0 ? colores[0].tailwind : '' 
      });
    } catch (error) {
      console.error('Error guardando tipo de nota:', error);
    } finally {
      setLoading(false);
    }
  };

  const manejarEditar = (tipo: TipoNota) => {
    console.log('Editando tipo de nota:', tipo); // Para debug
    console.log('Colores disponibles:', colores); // Para debug
    const nuevoFormData = { 
      nombre: tipo.nombre, 
      descripcion: tipo.descripcion, 
      color: tipo.color 
    };
    console.log('Nuevo formData:', nuevoFormData); // Para debug
    setFormData(nuevoFormData);
    setEditando(tipo.id);
    setAgregando(false);
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tipo de nota?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/config/tipos-notas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const nuevosTipos = tiposNotas.filter(tipo => tipo.id !== id);
        setTiposNotas(nuevosTipos);
        onChange?.(nuevosTipos);
      }
    } catch (error) {
      console.error('Error eliminando tipo de nota:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setAgregando(false);
    setFormData({ 
      nombre: '', 
      descripcion: '', 
      color: colores.length > 0 ? colores[0].tailwind : '' 
    });
  };

  // Cargar tipos de notas si no se pasan como props
  useEffect(() => {
    if (!tiposNotasProp || tiposNotasProp.length === 0) {
      cargarTiposNotas();
    }
  }, []);

  const handleEdit = (tipo: TipoNota) => {
    manejarEditar(tipo);
  };

  const handleDelete = (id: string) => {
    manejarEliminar(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    manejarSubmit(e);
  };

  if (colores.length === 0) {
    return (
      <div className="bg-secondary rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaStickyNote className="text-accent text-2xl" />
          <h2 className="text-2xl font-bold text-accent">Tipos de Notas</h2>
        </div>
        <button
          onClick={() => setAgregando(true)}
          disabled={loading || agregando || editando !== null}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Agregar Tipo
        </button>
      </div>

      <div className="space-y-4">
        {/* Formulario para agregar nuevo tipo de nota */}
        {agregando && (
          <form onSubmit={manejarSubmit} className="bg-primary/50 p-4 rounded-lg border border-accent/20">
            <h3 className="text-lg font-semibold text-accent mb-4">Nuevo Tipo de Nota</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-std w-full"
                  placeholder="Ej: Reunión importante"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {colores.length > 0 && colores.map(colorObj => (
                    <button
                      key={colorObj.tailwind}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorObj.tailwind })}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === colorObj.tailwind ? 'border-white' : 'border-gray-600'}`}
                      style={{ backgroundColor: colorObj.hex }}
                      title={colorObj.nombre}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                placeholder="Descripción del tipo de nota"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <FaSave /> Guardar
              </button>
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de tipos de notas existentes */}
        {tiposNotas.map((tipo) => (
          <div key={tipo.id} className="bg-primary/30 rounded-lg p-4 border border-gray-700">
            {editando === tipo.id ? (
              <form onSubmit={manejarSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="input-std w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                    <div className="flex gap-2">
                      {colores.length > 0 && colores.map(colorObj => (
                        <button
                          key={colorObj.tailwind}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: colorObj.tailwind })}
                          className={`w-8 h-8 rounded-full border-2 ${formData.color === colorObj.tailwind ? 'border-white' : 'border-gray-600'}`}
                          style={{ backgroundColor: colorObj.hex }}
                          title={colorObj.nombre}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  >
                    <FaSave /> Guardar
                  </button>
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                  >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tipo.color.split(' ')[0]} border`}
                    style={{ color: obtenerHexPorTailwind(tipo.color) }}
                  >
                    <FaStickyNote />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tipo.nombre}</h3>
                    <p className="text-sm text-gray-400">{tipo.descripcion}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => manejarEditar(tipo)}
                    disabled={loading || agregando || editando !== null}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => manejarEliminar(tipo.id)}
                    disabled={loading || agregando || editando !== null}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tiposNotas.length === 0 && !agregando && (
          <div className="text-center py-8 text-gray-400">
            <FaStickyNote className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No hay tipos de notas configurados</p>
            <p className="text-sm">Agrega el primer tipo de nota para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiposNotasConfigPanel;
