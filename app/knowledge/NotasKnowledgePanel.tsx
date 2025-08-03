"use client";
import React, { useState } from 'react';
import { FaPlus, FaSearch, FaFileAlt, FaListUl, FaLayerGroup } from 'react-icons/fa';
import { useConfig, getIconComponent } from '../lib/useConfig';
import DetalleNotaPanel from '../components/knowledge/DetalleNotaPanel';
import Modal from '../components/Modal';
import NotaForm from '../components/knowledge/NotaForm';

interface Nota {
  id: string;
  nombre: string;
  contenido: string;
  tema?: string;
  tipo?: string;
  date?: string;
  descripcion?: string;
  etiquetas?: string[];
  status?: string;
  priority?: string;
  relatedResources?: string[];
}

interface NotasKnowledgePanelProps {
  token: string | null;
}

const NotasKnowledgePanel: React.FC<NotasKnowledgePanelProps> = ({ token }) => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarFormularioNota, setMostrarFormularioNota] = useState(false);
  const [notaEditando, setNotaEditando] = useState<Nota | null>(null);
  const [notaSeleccionada, setNotaSeleccionada] = useState<Nota | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState<'lista' | 'tipos'>('lista');
  const [tipoNotaSeleccionado, setTipoNotaSeleccionado] = useState<string | null>(null);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>('');
  
  // Hook de configuración para notas
  const notasConfig = useConfig('notas');
  const temasConfig = useConfig('temas');

  // Función para obtener configuración de tipo de nota
  const getNotaConfig = (tipoId: string) => {
    if (notasConfig.loading) {
      return {
        IconComponent: FaFileAlt,
        color: 'bg-accent/20 text-accent',
        nombre: 'Nota'
      };
    }
    
    const config = notasConfig.items.find((item: any) => 
      item.id === tipoId || item.nombre.toLowerCase() === tipoId.toLowerCase()
    );
    
    if (config) {
      const IconComponent = getIconComponent(config.icono || 'fa-file-alt') as React.ComponentType<{ className?: string }>;
      return {
        IconComponent,
        color: config.color || 'bg-accent/20 text-accent',
        nombre: config.nombre
      };
    }
    
    // Fallback
    return {
      IconComponent: FaFileAlt,
      color: 'bg-accent/20 text-accent', 
      nombre: 'Nota'
    };
  };

  // Función para renderizar contenido markdown
  const renderizarContenidoMarkdown = (contenido: string): React.ReactNode => {
    // Renderizado básico de markdown
    return (
      <div className="prose prose-invert max-w-none">
        {contenido.split('\n').map((linea, index) => {
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
  const cargarNotas = async () => {
    if (!token) return;
    
    setCargando(true);
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
        const { archivosPorTema } = data;

        for (const [tema, notasArray] of Object.entries(archivosPorTema)) {
          const notas = notasArray as any[];
          
          for (const notaInfo of notas) {
            notasCargadas.push({
              id: notaInfo.id,
              nombre: notaInfo.title || notaInfo.nombreSinExtension || 'Sin título',
              tema: tema,
              tipo: notaInfo.tipo || 'nota',
              contenido: notaInfo.content || notaInfo.contenido || '',
              etiquetas: notaInfo.tags || [],
              status: notaInfo.status,
              priority: notaInfo.priority,
              date: notaInfo.date,
              relatedResources: notaInfo.relatedResources
            });
          }
        }
        
        setNotas(notasCargadas);
      }
    } catch (error) {
      console.error('Error cargando notas:', error);
    } finally {
      setCargando(false);
    }
  };

  // Effect para cargar notas al montar el componente
  React.useEffect(() => {
    if (token) {
      cargarNotas();
    }
  }, [token]);

  // Función para manejar submit del formulario
  const handleGuardarNota = async (values: any) => {
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
        console.error('Error guardando nota');
      }
    } catch (error) {
      console.error('Error guardando nota:', error);
    }
  };

  // Función para editar nota
  const handleEdit = (nota: Nota) => {
    setNotaEditando(nota);
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
    const file = new Blob([nota.contenido], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${nota.nombre}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filtrar notas según búsqueda y filtros
  const notasFiltradas = notas.filter(nota => 
    (nota.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
     nota.contenido.toLowerCase().includes(busqueda.toLowerCase())) &&
    (!filtroEtiqueta || (nota.etiquetas && nota.etiquetas.includes(filtroEtiqueta)))
  );

  // Extraer etiquetas disponibles
  const etiquetasDisponibles = Array.from(new Set(
    notas.flatMap(nota => nota.etiquetas || [])
  )).sort();

  if (notasConfig.loading || temasConfig.loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Navegación de secciones */}
      <div className="flex space-x-1 mb-6 bg-secondary/50 p-1 rounded-lg">
        <button
          onClick={() => { setSeccionActiva('lista'); setTipoNotaSeleccionado(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'lista'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaListUl className="text-sm" />
          Lista de Notas
        </button>
        <button
          onClick={() => { setSeccionActiva('tipos'); setTipoNotaSeleccionado(null); }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            seccionActiva === 'tipos'
              ? 'bg-yellow-900/30 text-yellow-300 shadow-lg'
              : 'text-gray-400 hover:text-yellow-300 hover:bg-yellow-900/10'
          }`}
        >
          <FaLayerGroup className="text-sm" />
          Por Tipo
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-secondary rounded-lg p-4">
        <div className="space-y-4 mb-4">
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
      </div>

      {/* Vista Lista - Todas las notas */}
      {seccionActiva === 'lista' && (
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
                          <config.IconComponent className="text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {nota.nombre}
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
              temas={temasConfig.items.map(item => ({
                id: item.id,
                nombre: item.nombre
              }))}
              descargarNota={descargarNota}
              eliminarNota={handleDelete}
              renderizarContenidoMarkdown={renderizarContenidoMarkdown}
              onEdit={handleEdit}
            />
          </div>
        </div>
      )}

      {/* Vista Por Tipo - Cards de tipos */}
      {seccionActiva === 'tipos' && !tipoNotaSeleccionado && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notasConfig.items.map((tipo: any) => {
            const cantidadNotas = notas.filter(nota => 
              nota.tipo === tipo.id || 
              nota.tipo?.toLowerCase() === tipo.nombre.toLowerCase()
            ).length;
            
            const config = getNotaConfig(tipo.id);
            const IconComponent = config.IconComponent as React.ComponentType<{ className?: string }>;
            
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoNotaSeleccionado(tipo.id)}
                className={`text-left p-6 rounded-lg border transition-all duration-300 ${config.color} hover:bg-yellow-900/10 hover:border-yellow-400/30`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 rounded-lg bg-yellow-900/20">
                    <IconComponent className="text-xl text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{tipo.nombre}</h3>
                    <div className="text-xs opacity-60">
                      {cantidadNotas} nota{cantidadNotas !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {tipo.descripcion && (
                  <p className="text-sm opacity-80 leading-relaxed">{tipo.descripcion}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Vista Por Tipo - Notas filtradas por tipo */}
      {seccionActiva === 'tipos' && tipoNotaSeleccionado && (
        <div className="space-y-6">
          {/* Header del tipo seleccionado */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-accent/30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTipoNotaSeleccionado(null)}
                className="px-3 py-2 rounded-lg bg-yellow-900/10 hover:bg-yellow-900/20 transition-colors text-yellow-300"
              >
                ← Volver a tipos
              </button>
              <div className="flex items-center gap-3">
                {(() => {
                  const tipoConfig = notasConfig.items.find((t: any) => t.id === tipoNotaSeleccionado);
                  const IconComponent = getIconComponent(tipoConfig?.icono || 'fa-file-alt') as React.ComponentType<{ className?: string }>;
                  return <IconComponent className="text-xl text-accent" />;
                })()}
                <h2 className="text-xl font-bold text-white">
                  {notasConfig.items.find((t: any) => t.id === tipoNotaSeleccionado)?.nombre}
                </h2>
              </div>
            </div>
          </div>

          {/* Grid de notas del tipo seleccionado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de notas filtradas */}
            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-lg p-6 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 text-accent">
                  Notas ({notas.filter(n => 
                    n.tipo === tipoNotaSeleccionado ||
                    n.tipo?.toLowerCase() === notasConfig.items.find((t: any) => t.id === tipoNotaSeleccionado)?.nombre.toLowerCase()
                  ).length})
                </h3>
                <div className="space-y-3">
                  {notas
                    .filter(nota => 
                      (nota.tipo === tipoNotaSeleccionado ||
                       nota.tipo?.toLowerCase() === notasConfig.items.find((t: any) => t.id === tipoNotaSeleccionado)?.nombre.toLowerCase()) &&
                      (nota.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                       nota.contenido.toLowerCase().includes(busqueda.toLowerCase()))
                    )
                    .map((nota) => {
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
                              <config.IconComponent className="text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">
                                {nota.nombre}
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
                temas={temasConfig.items.map(item => ({
                  id: item.id,
                  nombre: item.nombre
                }))}
                descargarNota={descargarNota}
                eliminarNota={handleDelete}
                renderizarContenidoMarkdown={renderizarContenidoMarkdown}
                onEdit={handleEdit}
              />
            </div>
          </div>
        </div>
      )}

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
              nombre: notaEditando.nombre,
              contenido: notaEditando.contenido,
              tipo: notaEditando.tipo || 'nota',
              etiquetas: notaEditando.etiquetas,
              tema: notaEditando.tema || '',
              priority: notaEditando.priority,
              date: notaEditando.date,
              relatedResources: notaEditando.relatedResources
            } : undefined}
            temas={temasConfig.items.map(item => ({
              id: item.id,
              nombre: item.nombre,
              descripcion: item.descripcion || '',
              icono: <></>,
              color: item.color || ''
            }))}
            tiposNotas={notasConfig.items.map(item => ({
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
