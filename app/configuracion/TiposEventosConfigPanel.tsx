"use client";
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaCalendarAlt } from 'react-icons/fa';

interface TipoEvento {
  id: string;
  nombre: string;
  icono: string;
  activo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TiposEventosConfigPanelProps {
  tiposEventos?: TipoEvento[];
  onChange?: (tipos: TipoEvento[]) => void;
}

const TiposEventosConfigPanel: React.FC<TiposEventosConfigPanelProps> = ({ 
  tiposEventos: tiposEventosProp, 
  onChange 
}) => {
  const [tiposEventos, setTiposEventos] = useState<TipoEvento[]>(tiposEventosProp || []);
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', icono: '' });

  // Cargar tipos de eventos si no se pasan como props
  useEffect(() => {
    if (!tiposEventosProp) {
      cargarTiposEventos();
    }
  }, [tiposEventosProp]);

  const cargarTiposEventos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config/tipos-eventos');
      if (response.ok) {
        const data = await response.json();
        setTiposEventos(data);
      }
    } catch (error) {
      console.error('Error cargando tipos de eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.icono.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (editando) {
        // Actualizar tipo existente
        const response = await fetch(`/api/config/tipos-eventos/${editando}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const tipoActualizado = await response.json();
          const nuevostipos = tiposEventos.map(tipo => 
            tipo.id === editando ? tipoActualizado : tipo
          );
          setTiposEventos(nuevostipos);
          onChange?.(nuevostipos);
          setEditando(null);
        }
      } else {
        // Crear nuevo tipo
        const response = await fetch('/api/config/tipos-eventos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const nuevoTipo = await response.json();
          const nuevostipos = [...tiposEventos, nuevoTipo];
          setTiposEventos(nuevostipos);
          onChange?.(nuevostipos);
          setAgregando(false);
        }
      }

      setFormData({ nombre: '', icono: '' });
    } catch (error) {
      console.error('Error guardando tipo de evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const manejarEditar = (tipo: TipoEvento) => {
    setFormData({ nombre: tipo.nombre, icono: tipo.icono });
    setEditando(tipo.id);
    setAgregando(false);
  };

  const manejarEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tipo de evento?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/config/tipos-eventos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const nuevostipos = tiposEventos.filter(tipo => tipo.id !== id);
        setTiposEventos(nuevostipos);
        onChange?.(nuevostipos);
      }
    } catch (error) {
      console.error('Error eliminando tipo de evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setAgregando(false);
    setFormData({ nombre: '', icono: '' });
  };

  // Lista de iconos comunes para eventos
  const iconosComunes = [
    'fa-calendar', 'fa-calendar-alt', 'fa-clock', 'fa-bell', 'fa-exclamation-triangle',
    'fa-wrench', 'fa-users', 'fa-graduation-cap', 'fa-briefcase', 'fa-star',
    'fa-cog', 'fa-bug', 'fa-shield-alt', 'fa-handshake', 'fa-lightbulb'
  ];

  if (loading && tiposEventos.length === 0) {
    return (
      <div className="bg-secondary rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-gray-400">Cargando tipos de eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-accent text-2xl" />
          <h2 className="text-2xl font-bold text-accent">Tipos de Eventos</h2>
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
        {/* Formulario para agregar nuevo tipo */}
        {agregando && (
          <form onSubmit={manejarSubmit} className="bg-primary/50 p-4 rounded-lg border border-accent/20">
            <h3 className="text-lg font-semibold text-accent mb-4">Nuevo Tipo de Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                  placeholder="Ej: Mantenimiento"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icono (FontAwesome)</label>
                <input
                  type="text"
                  value={formData.icono}
                  onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                  placeholder="Ej: fa-wrench"
                  required
                />
              </div>
            </div>
            
            {/* Sugerencias de iconos */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Iconos sugeridos:</label>
              <div className="flex flex-wrap gap-2">
                {iconosComunes.map(icono => (
                  <button
                    key={icono}
                    type="button"
                    onClick={() => setFormData({ ...formData, icono })}
                    className="px-3 py-1 bg-secondary border border-gray-600 rounded text-sm hover:border-accent transition-colors"
                  >
                    {icono}
                  </button>
                ))}
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

        {/* Lista de tipos existentes */}
        {tiposEventos.map((tipo) => (
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
                      className="w-full px-3 py-2 bg-secondary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icono</label>
                    <input
                      type="text"
                      value={formData.icono}
                      onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                      required
                    />
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
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <i className={`${tipo.icono} text-accent`}></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tipo.nombre}</h3>
                    <p className="text-sm text-gray-400">Icono: {tipo.icono}</p>
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

        {tiposEventos.length === 0 && !agregando && (
          <div className="text-center py-8 text-gray-400">
            <FaCalendarAlt className="text-4xl mx-auto mb-4 opacity-50" />
            <p>No hay tipos de eventos configurados</p>
            <p className="text-sm">Agrega el primer tipo de evento para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiposEventosConfigPanel;
