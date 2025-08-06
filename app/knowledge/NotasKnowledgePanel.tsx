"use client";
import React, { useState, useCallback } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useNotasConfig } from '../lib/useConfig';
import DetalleNotaPanel from '../components/knowledge/DetalleNotaPanel';
import Modal from '../components/Modal';
import NotaForm from '../components/knowledge/NotaForm';

interface Nota {
  id: string;
  title: string;
  content: string;
  tipo: string;
  tags?: string[];
  relatedResources?: string[];
  // Si priority y date existen en el backend, déjalos opcionales
  priority?: string;
  date?: string;
}

interface TipoNota {
  id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
}

interface NotaFormValues {
  title: string;
  content: string;
  tipo: string;
  tags?: string[];
  priority?: string;
  date?: string;
  relatedResources?: string[];
}

interface NotasKnowledgePanelProps {
  token: string | null;
}

const NotasKnowledgePanel: React.FC<NotasKnowledgePanelProps> = ({ token }) => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [mostrarFormularioNota, setMostrarFormularioNota] = useState(false);
  const [notaEditando, setNotaEditando] = useState<Nota | null>(null);
  const [notaSeleccionada, setNotaSeleccionada] = useState<Nota | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  // Hook de configuración para notas
  const { getNotaConfig, loading: configLoading, items: tiposNotas } = useNotasConfig();

  // Función para renderizar contenido markdown
  const renderizarContenidoMarkdown = (content: string): React.ReactNode => {
    // Renderizado básico de markdown
    return (
      <div className="prose prose-invert max-w-none">
        {content.split('\n').map((linea, index) => {
          if (linea.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mb-4 text-accent">{linea.slice(2)}</h1>;
          }
          if (linea.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-semibold mb-3 text-accent">{linea.slice(3)}</h2>;
          }
          if (linea.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-medium mb-2 text-accent">{linea.slice(4)}</h3>;
          }
          if (linea.trim() === '') {
            return <br key={index} />;
          }
          return <p key={index} className="mb-2 text-gray-300">{linea}</p>;
        })}
      </div>
    );
  };

  // Función para cargar notas
  const cargarNotas = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/content/knowledge', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Procesar las notas del formato del backend
        const notasCargadas: Nota[] = [];
        
        // El API ahora retorna directamente un array de notas
        const notasArray = Array.isArray(data) ? data : [];

        for (const notaInfo of notasArray) {
          notasCargadas.push({
            id: notaInfo.id,
            title: notaInfo.title || notaInfo.nombreSinExtension || 'Sin título',
            content: notaInfo.content || '',
            tipo: notaInfo.tipo || 'nota',
            tags: notaInfo.tags || [],
            relatedResources: notaInfo.relatedResources,
            priority: notaInfo.priority,
            date: notaInfo.date
          });
        }
        
        setNotas(notasCargadas);
      }
    } catch (error) {
      console.error('Error cargando notas:', error);
    }
  }, [token]);

  // Effect para cargar notas al montar el componente
  React.useEffect(() => {
    if (token) {
      cargarNotas();
    }
  }, [token, cargarNotas]);

  // Función para manejar submit del formulario
  const handleGuardarNota = async (values: NotaFormValues) => {
    if (!token) return;

    try {
      const url = notaEditando ? `/api/content/knowledge/${notaEditando.id}` : '/api/content/knowledge';
      const method = notaEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        await cargarNotas();
        setMostrarFormularioNota(false);
        setNotaEditando(null);
      } else {
        let errorMsg = 'Error guardando nota';
        try {
          const errorData = await response.json();
          errorMsg += ': ' + (errorData?.error || JSON.stringify(errorData));
        } catch {}
        console.error(errorMsg);
      }
    } catch (error) {
      console.error('Error guardando nota:', error);
    }
  };

  // Función para editar nota (acepta readOnly opcional)
  const handleEdit = (nota: Nota) => {
    setNotaEditando({ ...nota });
    setMostrarFormularioNota(true);
  };

  // Función para eliminar nota
  const handleDelete = async (nota: Nota) => {
    if (!token || !confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;

    try {
      const response = await fetch(`/api/content/knowledge/${nota.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await cargarNotas();
        setNotaSeleccionada(null);
      } else {
        console.error('Error eliminando nota');
      }
    } catch (error) {
      console.error('Error eliminando nota:', error);
    }
  };

  // Función para descargar nota
  const descargarNota = (nota: Nota) => {
    const element = document.createElement('a');
    const file = new Blob([nota.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${nota.title}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filtrar notas según búsqueda
  const notasFiltradas = notas.filter(nota => 
    nota.title.toLowerCase().includes(busqueda.toLowerCase()) ||
    nota.content.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Extraer etiquetas disponibles
  const etiquetasDisponibles = Array.from(new Set(
    notas.flatMap(nota => nota.tags || [])
  )).sort();

  if (configLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-accent">Gestión de Notas</h2>
        <button
          onClick={() => {
            setNotaEditando(null);
            setMostrarFormularioNota(true);
          }}
          className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
        >
          <FaPlus />
          Nueva Nota
        </button>
      </div>

      {/* Navegación de secciones eliminada - solo vista de lista */}

      {/* Buscador */}
      <div className="bg-secondary rounded-lg p-4 mb-0">
        <div className="flex items-center gap-2">
          <FaSearch className="text-accent" />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 input-std"
          />
        </div>
      </div>

      {/* Vista Lista - Todas las notas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de notas */}
        <div className="lg:col-span-1">
          <div className="bg-secondary rounded-lg p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-accent">
              Notas ({notasFiltradas.length})
            </h3>
            <div className="space-y-3">
              {notasFiltradas.map((nota) => {
                const config = getNotaConfig(nota.tipo || 'nota');
                return (
                  <button
                    key={nota.id}
                    onClick={() => setNotaSeleccionada(nota)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-accent/10 ${
                      notaSeleccionada?.id === nota.id
                        ? 'border-accent bg-accent/10'
                        : 'border-primary hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${config.color}`}>
                        {React.createElement(config.IconComponent as React.ComponentType<{ className?: string }>, { className: "text-sm" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {nota.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {config.nombre}
                        </p>
                        {nota.date && (
                          <p className="text-xs text-gray-500">
                            {new Date(nota.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Panel de detalle */}
        <div className="lg:col-span-2">
          <DetalleNotaPanel
            notaSeleccionada={notaSeleccionada}
            descargarNota={descargarNota}
            eliminarNota={handleDelete}
            renderizarContenidoMarkdown={renderizarContenidoMarkdown}
            onEdit={handleEdit}
            notaConfig={notaSeleccionada ? getNotaConfig(notaSeleccionada.tipo || 'nota') : undefined}
          />
        </div>
      </div>

      {/* Modal para formulario de nota */}
      {mostrarFormularioNota && (
        <Modal 
          open={mostrarFormularioNota} 
          onClose={() => { setMostrarFormularioNota(false); setNotaEditando(null); }} 
          title={notaEditando ? 'Editar Nota' : 'Nueva Nota'} 
          maxWidth="max-w-2xl"
        >
          <NotaForm
            initialValues={notaEditando ? {
              title: notaEditando.title,
              content: notaEditando.content || '',
              tipo: notaEditando.tipo || 'nota',
              tags: notaEditando.tags,
              priority: notaEditando.priority,
              date: notaEditando.date,
              relatedResources: notaEditando.relatedResources
            } : undefined}
            tiposNotas={tiposNotas.map((item: TipoNota) => ({
              id: item.id,
              nombre: item.nombre,
              descripcion: item.descripcion || '',
              color: item.color || ''
            }))}
            etiquetasDisponibles={etiquetasDisponibles}
            onSubmit={handleGuardarNota}
            onCancel={() => { setMostrarFormularioNota(false); setNotaEditando(null); }}
            submitLabel={notaEditando ? 'Actualizar' : 'Crear'}
          />
        </Modal>
      )}
    </div>
  );
};

export default NotasKnowledgePanel;
