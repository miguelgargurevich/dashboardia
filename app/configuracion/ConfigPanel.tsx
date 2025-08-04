"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes,
  FaCog,
  FaCalendarAlt,
  FaStickyNote,
  FaFolderOpen,
  FaLayerGroup,
  // Iconos para eventos
  FaWrench,
  FaGraduationCap,
  FaLaptop,
  FaUsers,
  FaExclamationTriangle,
  FaBell,
  // Iconos para notas
  FaClipboardList,
  FaBug,
  FaComments,
  FaLightbulb,
  FaCheckCircle,
  // Iconos para recursos
  FaFile,
  FaVideo,
  FaLink,
  FaDatabase,
  FaDownload,
  FaUpload,
  // Mas Iconos 
  FaFolder,
  FaTag,
  FaStar,
  FaBookmark,
  FaCloud
} from 'react-icons/fa';

type ConfigType = 'eventos' | 'notas' | 'recursos';

interface ConfigItem {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ColorOption {
  nombre: string;
  hex: string;
  tailwind: string;
}

interface ConfigPanelProps {
  initialType?: ConfigType;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ initialType = 'eventos' }) => {
  const [activeTab, setActiveTab] = useState<ConfigType>(initialType);
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [colores, setColores] = useState<ColorOption[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    descripcion: '', 
    icono: '', 
    color: '' 
  });

  // Configuración de tipos
  const tiposConfig = useMemo(() => ({
    eventos: {
      title: 'Tipos de Eventos',
      icon: FaCalendarAlt,
      endpoint: 'tipos-eventos',
      defaultIcon: 'fa-calendar-alt',
      iconos: [
        { value: 'fa-wrench', label: 'Herramienta', icon: FaWrench },
        { value: 'fa-graduation-cap', label: 'Capacitación', icon: FaGraduationCap },
        { value: 'fa-laptop', label: 'Demo', icon: FaLaptop },
        { value: 'fa-users', label: 'Reunión', icon: FaUsers },
        { value: 'fa-exclamation-triangle', label: 'Incidente', icon: FaExclamationTriangle },
        { value: 'fa-bell', label: 'Notificación', icon: FaBell },
        { value: 'fa-calendar-alt', label: 'Evento', icon: FaCalendarAlt },
      ]
    },
    notas: {
      title: 'Tipos de Notas',
      icon: FaStickyNote,
      endpoint: 'tipos-notas',
      defaultIcon: 'fa-sticky-note',
      iconos: [
        { value: 'fa-sticky-note', label: 'Nota', icon: FaStickyNote },
        { value: 'fa-clipboard-list', label: 'Lista', icon: FaClipboardList },
        { value: 'fa-bug', label: 'Error', icon: FaBug },
        { value: 'fa-comments', label: 'Comentario', icon: FaComments },
        { value: 'fa-lightbulb', label: 'Idea', icon: FaLightbulb },
        { value: 'fa-check-circle', label: 'Completado', icon: FaCheckCircle },
      ]
    },
    recursos: {
      title: 'Tipos de Recursos',
      icon: FaFolderOpen,
      endpoint: 'tipos-recursos',
      defaultIcon: 'fa-folder-open',
      iconos: [
        { value: 'fa-file', label: 'Archivo', icon: FaFile },
        { value: 'fa-video', label: 'Video', icon: FaVideo },
        { value: 'fa-link', label: 'Enlace', icon: FaLink },
        { value: 'fa-database', label: 'Base de datos', icon: FaDatabase },
        { value: 'fa-download', label: 'Descarga', icon: FaDownload },
        { value: 'fa-folder-open', label: 'Carpeta', icon: FaFolderOpen },
      ]
    }
  }), []);

  // Función para obtener icono React
  const obtenerIconoReact = (icono: string) => {
    const iconMap: { [key: string]: React.ComponentType } = {
      // Eventos
      'fa-wrench': FaWrench,
      'fa-graduation-cap': FaGraduationCap,
      'fa-laptop': FaLaptop,
      'fa-users': FaUsers,
      'fa-exclamation-triangle': FaExclamationTriangle,
      'fa-bell': FaBell,
      'fa-calendar-alt': FaCalendarAlt,
      'fa-calendar': FaCalendarAlt,
      // Notas
      'fa-sticky-note': FaStickyNote,
      'fa-clipboard-list': FaClipboardList,
      'fa-bug': FaBug,
      'fa-comments': FaComments,
      'fa-lightbulb': FaLightbulb,
      'fa-check-circle': FaCheckCircle,
      // Recursos
      'fa-file': FaFile,
      'fa-video': FaVideo,
      'fa-link': FaLink,
      'fa-database': FaDatabase,
      'fa-download': FaDownload,
      'fa-upload': FaUpload,
      'fa-folder-open': FaFolderOpen,
      // Mas Iconos
      'fa-layer-group': FaLayerGroup,
      'fa-folder': FaFolder,
      'fa-tag': FaTag,
      'fa-star': FaStar,
      'fa-bookmark': FaBookmark,
      'fa-cloud': FaCloud,
    };
    
    const IconComponent = iconMap[icono] || tiposConfig[activeTab].icon;
    return <IconComponent />;
  };

  // Función para obtener el hex de un color tailwind
  const obtenerHexPorTailwind = (tailwindColor: string) => {
    if (colores.length === 0 || !tailwindColor) return '#3B82F6';
    const colorObj = colores.find(c => c.tailwind === tailwindColor);
    return colorObj ? colorObj.hex : colores[0].hex;
  };

  // Cargar datos cuando cambia el tab activo
  useEffect(() => {
    const cargarColores = async () => {
      try {
        const response = await fetch('/api/config/colores');
        if (response.ok) {
          const data = await response.json();
          setColores(data);
          if (!formData.color && data.length > 0 && !editando) {
            setFormData(prev => ({ ...prev, color: data[0].tailwind }));
          }
        }
      } catch (error) {
        console.error('Error cargando colores:', error);
      }
    };

    const cargarItems = async () => {
      try {
        setLoading(true);
        const currentConfig = tiposConfig[activeTab];
        const response = await fetch(`/api/config/${currentConfig.endpoint}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        }
      } catch (error) {
        console.error(`Error cargando ${activeTab}:`, error);
      } finally {
        setLoading(false);
      }
    };

    const cargarDatos = async () => {
      await Promise.all([
        cargarColores(),
        cargarItems()
      ]);
    };
    cargarDatos();
  }, [activeTab, editando, formData.color, tiposConfig]);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.color.trim()) return;

    // Asegurar que siempre haya un icono
    const dataToSubmit = {
      ...formData,
      icono: formData.icono || tiposConfig[activeTab].defaultIcon
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (editando) {
        // Actualizar item existente
        const response = await fetch(`/api/config/${tiposConfig[activeTab].endpoint}/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSubmit)
        });

        if (response.ok) {
          const itemActualizado = await response.json();
          const nuevosItems = items.map(item => 
            item.id === editando ? itemActualizado : item
          );
          setItems(nuevosItems);
          setEditando(null);
        }
      } else {
        // Crear nuevo item
        const response = await fetch(`/api/config/${tiposConfig[activeTab].endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSubmit)
        });

        if (response.ok) {
          const nuevoItem = await response.json();
          const nuevosItems = [...items, nuevoItem];
          setItems(nuevosItems);
          setAgregando(false);
        }
      }

      setFormData({ 
        nombre: '', 
        descripcion: '', 
        icono: tiposConfig[activeTab].defaultIcon, 
        color: colores.length > 0 ? colores[0].tailwind : '' 
      });
    } catch (error) {
      console.error(`Error guardando ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const manejarEditar = (item: ConfigItem) => {
    setFormData({ 
      nombre: item.nombre, 
      descripcion: item.descripcion || '', 
      icono: item.icono || tiposConfig[activeTab].defaultIcon, 
      color: item.color 
    });
    setEditando(item.id);
    setAgregando(false);
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este ${activeTab.slice(0, -1)}?`)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/config/${tiposConfig[activeTab].endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const nuevosItems = items.filter(item => item.id !== id);
        setItems(nuevosItems);
      }
    } catch (error) {
      console.error(`Error eliminando ${activeTab}:`, error);
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
      icono: tiposConfig[activeTab].defaultIcon, 
      color: colores.length > 0 ? colores[0].tailwind : '' 
    });
  };

  const cambiarTab = (newTab: ConfigType) => {
    if (editando || agregando) {
      if (!confirm('¿Quieres cancelar los cambios actuales?')) return;
    }
    setActiveTab(newTab);
    setEditando(null);
    setAgregando(false);
    setFormData({ 
      nombre: '', 
      descripcion: '', 
      icono: tiposConfig[newTab].defaultIcon, 
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

  const currentConfig = tiposConfig[activeTab];
  const IconComponent = currentConfig.icon;

  return (
    <div className="bg-secondary rounded-xl shadow-lg p-6">
      {/* Header con tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCog className="text-accent text-2xl" />
          <h2 className="text-2xl font-bold text-accent">Configuración del Sistema</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-primary/50 p-1 rounded-lg mb-6">
          {Object.entries(tiposConfig).map(([key, config]) => {
            const TabIcon = config.icon;
            return (
              <button
                key={key}
                onClick={() => cambiarTab(key as ConfigType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors font-medium ${
                  activeTab === key 
                    ? 'bg-accent text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <TabIcon className="text-sm" />
                {config.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconComponent className="text-accent text-xl" />
          <h3 className="text-xl font-semibold text-white">{currentConfig.title}</h3>
        </div>
        <button
          onClick={() => setAgregando(true)}
          disabled={loading || agregando || editando !== null}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
        >
          <FaPlus /> Agregar
        </button>
      </div>

      <div className="space-y-4">
        {/* Formulario para agregar/editar */}
        {agregando && (
          <form onSubmit={manejarSubmit} className="bg-primary/50 p-4 rounded-lg border border-accent/20">
            <h4 className="text-lg font-semibold text-accent mb-4">
              Nuevo {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-std w-full"
                  placeholder={`Nombre del ${activeTab.slice(0, -1)}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {colores.map(colorObj => (
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
                className="input-std w-full"
                placeholder={`Descripción del ${activeTab.slice(0, -1)}...`}
                rows={3}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Icono</label>
              <div className="grid grid-cols-6 gap-1">
                {currentConfig.iconos.map(icono => {
                  const IconoComponent = icono.icon;
                  return (
                    <button
                      key={icono.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono: icono.value })}
                      className={`p-2 rounded border flex items-center justify-center ${
                        formData.icono === icono.value 
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                          : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                      title={icono.label}
                    >
                      <IconoComponent className="text-sm" />
                    </button>
                  );
                })}
              </div>
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

        {/* Lista de items */}
        {items.map((item) => (
          <div key={item.id} className="bg-primary/30 rounded-lg p-4 border border-gray-700">
            {editando === item.id ? (
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
                      {colores.map(colorObj => (
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
                    className="input-std w-full"
                    rows={2}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icono</label>
                  <div className="grid grid-cols-6 gap-1">
                    {currentConfig.iconos.map(icono => {
                      const IconoComponent = icono.icon;
                      return (
                        <button
                          key={icono.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, icono: icono.value })}
                          className={`p-2 rounded border flex items-center justify-center ${
                            formData.icono === icono.value 
                              ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                              : 'border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500'
                          }`}
                          title={icono.label}
                        >
                          <IconoComponent className="text-sm" />
                        </button>
                      );
                    })}
                  </div>
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color ? item.color.split(' ')[0] : 'bg-gray-500'} border`}
                    style={{ color: obtenerHexPorTailwind(item.color || '') }}
                  >
                    {obtenerIconoReact(item.icono || currentConfig.defaultIcon)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.nombre}</h4>
                    {item.descripcion && (
                      <p className="text-sm text-gray-300 mb-1">{item.descripcion}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      {item.icono && `Icono: ${item.icono} • `}Color: {obtenerHexPorTailwind(item.color || '')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => manejarEditar(item)}
                    disabled={loading || agregando || editando !== null}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => manejarEliminar(item.id)}
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

        {items.length === 0 && !agregando && (
          <div className="text-center py-8 text-gray-400">
            <IconComponent className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No hay {currentConfig.title.toLowerCase()} configurados</p>
            <p className="text-sm">Agrega el primer elemento para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
