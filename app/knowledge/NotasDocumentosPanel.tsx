"use client";
import React, { useState } from "react";
import { FaSearch, FaFileAlt, FaBook, FaVideo, FaEye, FaEdit } from "react-icons/fa";
import NotaForm from "../components/knowledge/NotaForm";

interface Nota {
  id?: string;
  nombre: string;
  contenido: string;
  tipo: string;
  etiquetas?: string[];
  descripcion?: string;
  tema: string;
  priority?: string;
  date?: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface NotasDocumentosPanelProps {
  notas: Nota[];
  temas: Tema[];
  tiposNotas: TipoNota[];
  notaSeleccionada: Nota | null;
  setNotaSeleccionada: (nota: Nota | null) => void;
  busqueda: string;
  setBusqueda: (v: string) => void;
  etiquetasDisponibles: string[];
  filtroEtiqueta: string;
  setFiltroEtiqueta: (v: string) => void;
  cargando: boolean;
  descargarNota: (nota: Nota) => void;
  // eliminarNota: (nota: Nota) => void;
  onEditarNota?: (nota: Nota) => void;
}

const NotasDocumentosPanel: React.FC<NotasDocumentosPanelProps> = ({
  notas,
  temas,
  tiposNotas,
  notaSeleccionada,
  setNotaSeleccionada,
  busqueda,
  setBusqueda,
  etiquetasDisponibles,
  filtroEtiqueta,
  setFiltroEtiqueta,
  cargando,
  descargarNota,
  // eliminarNota,
  onEditarNota
}) => {

  // Estado para mostrar el formulario de edición/creación
  // Función para refrescar notas (debe estar en el componente)
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [notasState, setNotasState] = useState<Nota[]>(notas);
  // Si ya se maneja desde arriba, puedes ignorar este estado y solo usar fetchNotes
  const fetchNotes = async () => {
    setLoadingNotas(true);
    try {
      const res = await fetch('/api/daily-notes');
      if (!res.ok) throw new Error('Error al cargar notas');
      const data = await res.json();
      setNotasState(Array.isArray(data) ? data : []);
    } catch {
      setNotasState([]);
    } finally {
      setLoadingNotas(false);
    }
  };
  const [showNotaForm, setShowNotaForm] = useState(false);
  const [notaEditando, setNotaEditando] = useState<Nota | null>(null);
  const [modoForm, setModoForm] = useState<'crear' | 'editar'>('crear');

  // Handler para abrir el formulario de edición
  const handleEditarNota = (nota: Nota) => {
    setNotaEditando(nota);
    setModoForm('editar');
    setShowNotaForm(true);
  };

  // Handler para abrir el formulario de nueva nota
  const handleNuevaNota = () => {
    setNotaEditando(null);
    setModoForm('crear');
    setShowNotaForm(true);
  };

  // Handler para guardar la nota (creación o edición real)
  const handleGuardarNota = async (values: any) => {
    try {
      let res;
      if (modoForm === 'editar' && notaEditando?.id) {
        // Actualizar nota existente
        res = await fetch(`/api/daily-notes/${notaEditando.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
          },
          body: JSON.stringify(values)
        });
      } else {
        // Crear nueva nota
        res = await fetch('/api/daily-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
          },
          body: JSON.stringify(values)
        });
      }
      if (!res.ok) throw new Error('Error al guardar la nota');
      setShowNotaForm(false);
      setNotaEditando(null);
      await fetchNotes();
    } catch (err) {
      alert('Ocurrió un error al guardar la nota.');
    }
  };

  // Handler para cancelar
  const handleCancelar = () => {
    setShowNotaForm(false);
    setNotaEditando(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Panel de lista de notas */}
      <div className="lg:col-span-3">
        <div className="bg-secondary rounded-lg p-6 h-full min-h-96 flex flex-col">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por nombre o contenido..."
                className="input input-bordered w-full bg-base-200 text-sm"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
              <FaSearch className="text-gray-400" />
            </div>
            <select
              className="select select-bordered bg-base-200 text-sm"
              value={filtroEtiqueta}
              onChange={e => setFiltroEtiqueta(e.target.value)}
            >
              <option value="">Todas las etiquetas</option>
              {etiquetasDisponibles.map((et, idx) => (
                <option key={idx} value={et}>{et}</option>
              ))}
            </select>
            {/* Botón para nueva nota */}
            <button
              className="btn btn-accent btn-sm ml-2"
              onClick={handleNuevaNota}
              type="button"
            >
              Nueva nota
            </button>
          </div>
          {/* Lista de notas */}
          {loadingNotas ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Cargando...</div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
              {notasState.map((nota, index) => {
                const tipoNota = tiposNotas.find((t: TipoNota) => t.id === nota.tipo) || tiposNotas[0];
                const color = tipoNota.color;
                const nombreTipo = tipoNota.nombre;
                const isSelected = notaSeleccionada?.id === nota.id;
                return (
                  <button
                    key={nota.id || index}
                    onClick={() => setNotaSeleccionada(nota)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 cursor-pointer
                      ${isSelected
                        ? `${color} shadow-lg shadow-current/20 border-accent bg-accent/20`
                        : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'}
                    `}
                  >
                    <div className={`flex-shrink-0 p-3 rounded-lg flex items-center justify-center ${isSelected ? color.split(' ')[0]?.replace('/20', '/30') || 'bg-accent/30' : color.split(' ')[0] || 'bg-accent/20'}`}>
                      {/* Icono de nota siempre */}
                      <FaFileAlt className={`text-2xl ${color.split(' ')[1] || 'text-accent'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-base truncate flex-1">{nota.nombre}</h3>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{nombreTipo}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {notaSeleccionada && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-primary rounded-xl shadow-2xl p-6 w-full max-w-2xl relative border border-accent/30">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-accent text-lg"
              onClick={() => setNotaSeleccionada(null)}
              title="Cerrar"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FaFileAlt className="text-accent text-xl" />
              <h2 className="text-lg font-bold text-white flex-1 truncate">{notaSeleccionada.nombre}</h2>
              <button
                className="ml-2 px-2 py-1 rounded bg-accent/10 text-accent text-xs hover:bg-accent/20"
                onClick={() => descargarNota(notaSeleccionada)}
                title="Descargar nota"
              >
                Descargar
              </button>
              {onEditarNota && (
                <button
                  className="ml-2 px-2 py-1 rounded bg-accent/10 text-accent text-xs hover:bg-accent/20"
                  onClick={() => onEditarNota(notaSeleccionada)}
                  title="Editar nota"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">
                  {temas.find((t: Tema) => t.id === notaSeleccionada.tema)?.nombre}
                </p>
                {notaSeleccionada.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="font-semibold">Fecha:</span> {new Date(notaSeleccionada.date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              {notaSeleccionada.contenido}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotasDocumentosPanel;
