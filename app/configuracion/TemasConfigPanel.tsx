"use client";
import React, { useState, useEffect } from "react";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaLayerGroup, 
  FaSave, 
  FaTimes,
  FaFolder,
  FaTag,
  FaStar,
  FaBookmark,
  FaCog,
  FaFile,
  FaDatabase,
  FaCloud
} from "react-icons/fa";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono?: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TemasConfigPanelProps {
  temas?: Tema[];
  onChange?: (temas: Tema[]) => void;
}

interface ColorOption {
  nombre: string;
  hex: string;
  tailwind: string;
}

const TemasConfigPanel: React.FC<TemasConfigPanelProps> = ({ temas: temasProp, onChange }) => {
  const [temas, setTemas] = useState<Tema[]>(temasProp || []);
  const [colores, setColores] = useState<ColorOption[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', icono: '', color: '' });

  // Función para mapear iconos a React Icons
  const obtenerIconoReact = (icono: string) => {
    const iconMap: { [key: string]: React.ComponentType } = {
      'fa-layer-group': FaLayerGroup,
      'fa-folder': FaFolder,
      'fa-tag': FaTag,
      'fa-star': FaStar,
      'fa-bookmark': FaBookmark,
      'fa-cog': FaCog,
      'fa-file': FaFile,
      'fa-database': FaDatabase,
      'fa-cloud': FaCloud,
    };
    
    const IconComponent = iconMap[icono] || FaLayerGroup;
    return <IconComponent />;
  };

  // Lista de iconos disponibles para temas
  const iconosDisponibles = [
    { value: 'fa-layer-group', label: 'Grupo', icon: FaLayerGroup },
    { value: 'fa-folder', label: 'Carpeta', icon: FaFolder },
    { value: 'fa-tag', label: 'Etiqueta', icon: FaTag },
    { value: 'fa-star', label: 'Estrella', icon: FaStar },
    { value: 'fa-bookmark', label: 'Marcador', icon: FaBookmark },
    { value: 'fa-cog', label: 'Configuración', icon: FaCog },
    { value: 'fa-file', label: 'Archivo', icon: FaFile },
    { value: 'fa-database', label: 'Base de datos', icon: FaDatabase },
    { value: 'fa-cloud', label: 'Nube', icon: FaCloud },
  ];

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

  // Cargar temas si no se pasan como props
  useEffect(() => {
    const cargarDatos = async () => {
      await Promise.all([
        cargarColores(),
        !temasProp ? cargarTemas() : Promise.resolve()
      ]);
    };
    cargarDatos();
  }, [temasProp]);

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

  const cargarTemas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config/temas');
      if (response.ok) {
        const data = await response.json();
        setTemas(data);
      }
    } catch (error) {
      console.error('Error cargando temas:', error);
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
        // Actualizar tema existente
        const response = await fetch(`/api/config/temas/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const temaActualizado = await response.json();
          const nuevosTemas = temas.map(tema => 
            tema.id === editando ? temaActualizado : tema
          );
          setTemas(nuevosTemas);
          onChange?.(nuevosTemas);
          setEditando(null);
        }
      } else {
        // Crear nuevo tema
        const response = await fetch('/api/config/temas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const nuevoTema = await response.json();
          const nuevosTemas = [...temas, nuevoTema];
          setTemas(nuevosTemas);
          onChange?.(nuevosTemas);
          setAgregando(false);
        }
      }

      setFormData({ 
        nombre: '', 
        descripcion: '', 
        icono: 'fa-layer-group',
        color: colores.length > 0 ? colores[0].tailwind : '' 
      });
    } catch (error) {
      console.error('Error guardando tema:', error);
    } finally {
      setLoading(false);
    }
  };

  const manejarEditar = (tema: Tema) => {
    console.log('Editando tema:', tema); // Para debug
    console.log('Colores disponibles:', colores); // Para debug
    const nuevoFormData = { 
      nombre: tema.nombre, 
      descripcion: tema.descripcion, 
      icono: tema.icono || 'fa-layer-group',
      color: tema.color 
    };
    console.log('Nuevo formData:', nuevoFormData); // Para debug
    setFormData(nuevoFormData);
    setEditando(tema.id);
    setAgregando(false);
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tema?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/config/temas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const nuevosTemas = temas.filter(tema => tema.id !== id);
        setTemas(nuevosTemas);
        onChange?.(nuevosTemas);
      }
    } catch (error) {
      console.error('Error eliminando tema:', error);
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
      icono: 'fa-layer-group',
      color: colores.length > 0 ? colores[0].tailwind : '' 
    });
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
          <FaLayerGroup className="text-accent text-2xl" />
          <h2 className="text-2xl font-bold text-accent">Temas</h2>
        </div>
        <button
          onClick={() => setAgregando(true)}
          disabled={loading || agregando || editando !== null}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Agregar Tema
        </button>
      </div>

      <div className="space-y-4">
        {/* Formulario para agregar nuevo tema */}
        {agregando && (
          <form onSubmit={manejarSubmit} className="bg-primary/50 p-4 rounded-lg border border-accent/20">
            <h3 className="text-lg font-semibold text-accent mb-4">Nuevo Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-std w-full"
                  placeholder="Ej: Notificaciones"
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
                placeholder="Descripción del tema"
                rows={3}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Icono</label>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {iconosDisponibles.map(icono => {
                  const IconComponent = icono.icon;
                  return (
                    <button
                      key={icono.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono: icono.value })}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                        formData.icono === icono.value 
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                          : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                      title={icono.label}
                    >
                      <IconComponent className="text-lg" />
                      <span className="text-xs">{icono.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={formData.icono}
                onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                className="input-std w-full"
                placeholder="O ingresa manualmente: fa-custom"
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

        {/* Lista de temas existentes */}
        {temas.map((tema) => (
          <div key={tema.id} className="bg-primary/30 rounded-lg p-4 border border-gray-700">
            {editando === tema.id ? (
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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icono</label>
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {iconosDisponibles.map(icono => {
                      const IconComponent = icono.icon;
                      return (
                        <button
                          key={icono.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, icono: icono.value })}
                          className={`p-2 rounded border ${
                            formData.icono === icono.value 
                              ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                              : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                          title={icono.label}
                        >
                          <IconComponent className="text-sm" />
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={formData.icono}
                    onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                    className="input-std w-full"
                    placeholder="fa-custom"
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${tema.color.split(' ')[0]} border`}
                    style={{ color: obtenerHexPorTailwind(tema.color) }}
                  >
                    {obtenerIconoReact(tema.icono || 'fa-layer-group')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tema.nombre}</h3>
                    <p className="text-sm text-gray-300 mb-1">{tema.descripcion}</p>
                    <p className="text-sm text-gray-400">
                      {tema.icono && `Icono: ${tema.icono} • `}Color: {obtenerHexPorTailwind(tema.color)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => manejarEditar(tema)}
                    disabled={loading || agregando || editando !== null}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => manejarEliminar(tema.id)}
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

        {temas.length === 0 && !agregando && (
          <div className="text-center py-8 text-gray-400">
            <FaLayerGroup className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No hay temas configurados</p>
            <p className="text-sm">Agrega el primer tema para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemasConfigPanel;
