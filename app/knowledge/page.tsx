"use client";
import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaBook, FaVideo, FaDownload, FaSearch, FaEye, FaBell, FaPrint, FaTicketAlt, FaClock, FaExclamationTriangle, FaLink, FaPlus, FaEdit, FaTrash, FaCheck, FaEyeSlash, FaBrain } from 'react-icons/fa';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

interface NotasMD {
  nombre: string;
  contenido: string;
  tema: string;
  tipo: 'nota' | 'documento' | 'video';
  etiquetas?: string[];
}

interface URLResource {
  id: string;
  titulo: string;
  url: string;
  descripcion?: string;
  tema: string;
  tipoContenido: string;
  estado: 'pendiente' | 'revisado' | 'archivado';
  prioridad: 'alta' | 'media' | 'baja';
  etiquetas: string[];
  agregadoPor?: string;
  comentarios?: string;
  createdAt: string;
  updatedAt: string;
  fechaRevision?: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

const KnowledgePage: React.FC = () => {
  const [seccionActiva, setSeccionActiva] = useState('temas');
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [notasMD, setNotasMD] = useState<NotasMD[]>([]);
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotasMD | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // Estados para URLs
  const [urls, setUrls] = useState<URLResource[]>([]);
  const [urlSeleccionada, setUrlSeleccionada] = useState<URLResource | null>(null);
  const [mostrarFormularioUrl, setMostrarFormularioUrl] = useState(false);
  const [urlEditando, setUrlEditando] = useState<URLResource | null>(null);
  const [filtroEstadoUrl, setFiltroEstadoUrl] = useState<string>('');
  const [cargandoUrls, setCargandoUrls] = useState(false);

  // Estados para filtros de etiquetas
  const [filtroEtiquetaUrl, setFiltroEtiquetaUrl] = useState<string>('');
  const [etiquetasDisponiblesUrls, setEtiquetasDisponiblesUrls] = useState<string[]>([]);
  const [filtroEtiquetaNota, setFiltroEtiquetaNota] = useState<string>('');
  const [etiquetasDisponiblesNotas, setEtiquetasDisponiblesNotas] = useState<string[]>([]);

  // Estados para crear nueva nota
  const [mostrarFormularioNota, setMostrarFormularioNota] = useState(false);
  const [cargandoGeneracion, setCargandoGeneracion] = useState(false);
  
  // Estados para IA en URLs
  const [cargandoGeneracionUrl, setCargandoGeneracionUrl] = useState(false);

  // Definición de temas basados en las actividades de soporte
  const temas: Tema[] = [
    {
      id: 'notificaciones',
      nombre: 'Notificaciones',
      descripcion: 'Envío y programación de notificaciones automáticas',
      icono: <FaBell className="text-xl" />,
      color: 'bg-blue-500/20 text-blue-400 border-blue-400/30'
    },
    {
      id: 'polizas',
      nombre: 'Pólizas y Reimpresión',
      descripcion: 'Gestión de pólizas, copias y reimpresiones',
      icono: <FaPrint className="text-xl" />,
      color: 'bg-green-500/20 text-green-400 border-green-400/30'
    },
    {
      id: 'tickets',
      nombre: 'Gestión de Tickets',
      descripcion: 'Manejo de tickets de soporte y requerimientos',
      icono: <FaTicketAlt className="text-xl" />,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
    },
    {
      id: 'actividades-diarias',
      nombre: 'Actividades Diarias',
      descripcion: 'Rutinas y procesos diarios del equipo de soporte',
      icono: <FaClock className="text-xl" />,
      color: 'bg-purple-500/20 text-purple-400 border-purple-400/30'
    },
    {
      id: 'emergencias',
      nombre: 'Procedimientos de Emergencia',
      descripcion: 'Acciones para situaciones críticas y resolución de problemas',
      icono: <FaExclamationTriangle className="text-xl" />,
      color: 'bg-red-500/20 text-red-400 border-red-400/30'
    },
    {
      id: 'kb-conocidos',
      nombre: 'KB Conocidos',
      descripcion: 'Base de conocimiento de problemas conocidos y soluciones documentadas',
      icono: <FaBrain className="text-xl" />,
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30'
    }
  ];

  useEffect(() => {
    cargarContenido();
    cargarUrls();
  }, []);

  // Efecto para extraer etiquetas disponibles
  useEffect(() => {
    // Extraer etiquetas únicas de URLs
    const etiquetasUrls = new Set<string>();
    urls.forEach(url => {
      url.etiquetas?.forEach(etiqueta => {
        etiquetasUrls.add(etiqueta);
      });
    });
    setEtiquetasDisponiblesUrls(Array.from(etiquetasUrls).sort());

    // Extraer etiquetas únicas de notas
    const etiquetasNotas = new Set<string>();
    notasMD.forEach(nota => {
      nota.etiquetas?.forEach(etiqueta => {
        etiquetasNotas.add(etiqueta);
      });
    });
    setEtiquetasDisponiblesNotas(Array.from(etiquetasNotas).sort());
  }, [urls, notasMD]);

  const cargarContenido = async () => {
    setCargando(true);
    
    try {
      // Obtener archivos dinámicamente del nuevo endpoint
      const response = await fetch('/api/notas-md');
      
      if (!response.ok) {
        throw new Error('Error al obtener la lista de archivos');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al obtener archivos');
      }
      
      const notasCargadas: NotasMD[] = [];
      const { archivosPorTema } = data;

      // Cargar archivos de cada tema
      for (const [tema, archivos] of Object.entries(archivosPorTema)) {
        const archivosArray = archivos as any[];
        
        for (const archivoInfo of archivosArray) {
          try {
            const response = await fetch(`/${archivoInfo.rutaRelativa}`);
            if (response.ok) {
              const contenido = await response.text();
              
              // Determinar tipo basado en el nombre del archivo
              let tipo: 'nota' | 'documento' | 'video' = 'nota';
              if (archivoInfo.nombre.includes('Manual') || 
                  archivoInfo.nombre.includes('Rutina') || 
                  archivoInfo.nombre.includes('Procedimientos')) {
                tipo = 'documento';
              }

              // Extraer etiquetas del markdown si están presentes
              const extractEtiquetas = (contenido: string): string[] => {
                const etiquetasMatch = contenido.match(/\*\*Etiquetas:\*\*\s*(.+)/);
                if (etiquetasMatch) {
                  return etiquetasMatch[1]
                    .split(/[,\|]/)
                    .map(tag => tag.trim().replace(/`/g, ''))
                    .filter(Boolean);
                }
                return [];
              };

              notasCargadas.push({
                nombre: archivoInfo.nombreSinExtension,
                tema: tema,
                tipo: tipo,
                contenido: contenido,
                etiquetas: extractEtiquetas(contenido)
              });
            }
          } catch (error) {
            console.error(`Error cargando ${archivoInfo.nombre}:`, error);
          }
        }
      }

      setNotasMD(notasCargadas);
      console.log('Archivos cargados dinámicamente:', {
        totalArchivos: notasCargadas.length,
        archivosPorTema: Object.fromEntries(
          Object.entries(archivosPorTema).map(([tema, archivos]) => 
            [tema, (archivos as any[]).length]
          )
        )
      });
      
    } catch (error) {
      console.error('Error cargando contenido:', error);
      // Mensaje más informativo para el usuario
      alert('Error al cargar el contenido. Por favor, recarga la página.');
    } finally {
      setCargando(false);
    }
  };

  const cargarUrls = async (filtros?: { tema?: string; estado?: string }) => {
    setCargandoUrls(true);
    try {
      const params = new URLSearchParams();
      if (filtros?.tema) params.append('tema', filtros.tema);
      if (filtros?.estado) params.append('estado', filtros.estado);
      
      const response = await fetch(`/api/urls?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUrls(data.urls || []);
      } else {
        console.error('Error cargando URLs:', response.statusText);
      }
    } catch (error) {
      console.error('Error cargando URLs:', error);
    } finally {
      setCargandoUrls(false);
    }
  };

  const crearUrl = async (datosUrl: Partial<URLResource>) => {
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUrl)
      });
      
      if (response.ok) {
        const nuevaUrl = await response.json();
        setUrls(prev => [nuevaUrl, ...prev]);
        setMostrarFormularioUrl(false);
        return nuevaUrl;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error creando URL');
      }
    } catch (error) {
      console.error('Error creando URL:', error);
      throw error;
    }
  };

  const actualizarUrl = async (id: string, datosUrl: Partial<URLResource>) => {
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUrl)
      });
      
      if (response.ok) {
        const urlActualizada = await response.json();
        setUrls(prev => prev.map(url => url.id === id ? urlActualizada : url));
        setUrlEditando(null);
        setMostrarFormularioUrl(false);
        return urlActualizada;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error actualizando URL');
      }
    } catch (error) {
      console.error('Error actualizando URL:', error);
      throw error;
    }
  };

  const eliminarUrl = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setUrls(prev => prev.filter(url => url.id !== id));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando URL');
      }
    } catch (error) {
      console.error('Error eliminando URL:', error);
      throw error;
    }
  };

  const marcarComoRevisado = async (id: string, comentarios?: string) => {
    try {
      const response = await fetch(`/api/urls/${id}/revisar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentarios })
      });
      
      if (response.ok) {
        const urlRevisada = await response.json();
        setUrls(prev => prev.map(url => url.id === id ? urlRevisada : url));
        return urlRevisada;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error marcando como revisado');
      }
    } catch (error) {
      console.error('Error marcando como revisado:', error);
      throw error;
    }
  };

  const generarNuevaNota = async (datosNota: {
    titulo: string;
    tema: string;
    descripcion: string;
    tipo: string;
    puntosClave?: string[];
    etiquetas?: string[];
    contexto?: string;
  }) => {
    setCargandoGeneracion(true);
    try {
      const response = await fetch('/api/generar-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosNota)
      });
      
      if (response.ok) {
        const resultado = await response.json();
        
        // Recargar el contenido para incluir la nueva nota
        await cargarContenido();
        
        // Cerrar el formulario
        setMostrarFormularioNota(false);
        
        // Mostrar mensaje de éxito (opcional)
        alert(`Nota "${datosNota.titulo}" generada exitosamente`);
        
        return resultado;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error generando nota');
      }
    } catch (error) {
      console.error('Error generando nota:', error);
      throw error;
    } finally {
      setCargandoGeneracion(false);
    }
  };

  const procesarUrlConIA = async (url: string, tema: string) => {
    setCargandoGeneracionUrl(true);
    try {
      const response = await fetch('/api/procesar-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tema })
      });
      
      if (response.ok) {
        const resultado = await response.json();
        return resultado;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error procesando URL');
      }
    } catch (error) {
      console.error('Error procesando URL con IA:', error);
      throw error;
    } finally {
      setCargandoGeneracionUrl(false);
    }
  };

  const descargarNota = (nota: NotasMD) => {
    const element = document.createElement('a');
    const file = new Blob([nota.contenido], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${nota.nombre}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const notasFiltradas = notasMD.filter(nota => {
    const matchBusqueda = nota.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                         nota.contenido.toLowerCase().includes(busqueda.toLowerCase());
    const matchTema = !temaSeleccionado || nota.tema === temaSeleccionado;
    const matchEtiqueta = !filtroEtiquetaNota || (nota.etiquetas && nota.etiquetas.includes(filtroEtiquetaNota));
    return matchBusqueda && matchTema && matchEtiqueta;
  });

  const renderizarContenidoMarkdown = (contenido: string) => {
    const procesarNegritas = (texto: string) => {
      const partes = texto.split(/(\*\*[^*]+\*\*)/g);
      return partes.map((parte, i) => {
        if (parte.startsWith('**') && parte.endsWith('**')) {
          return <strong key={i} className="font-bold text-white">{parte.slice(2, -2)}</strong>;
        }
        return parte;
      });
    };

    const lineas = contenido.split('\n');
    const resultado: React.ReactElement[] = [];
    let i = 0;

    while (i < lineas.length) {
      const linea = lineas[i];
      
      // Detectar inicio de tabla
      if (linea.includes('|') && linea.trim().startsWith('|') && linea.trim().endsWith('|')) {
        const filasTabla = [];
        let j = i;
        
        // Recoger todas las filas de la tabla
        while (j < lineas.length) {
          const filaActual = lineas[j].trim();
          if (filaActual.includes('|') && filaActual.startsWith('|') && filaActual.endsWith('|')) {
            // Filtrar filas de separación (que solo contienen guiones y pipes)
            if (!filaActual.match(/^[\|\-\s]+$/)) {
              const celdas = filaActual.split('|').slice(1, -1).map(celda => celda.trim());
              filasTabla.push(celdas);
            }
            j++;
          } else {
            break;
          }
        }
        
        if (filasTabla.length > 0) {
          resultado.push(
            <div key={`table-${i}`} className="overflow-x-auto my-4">
              <table className="min-w-full border border-accent/20 rounded-lg">
                <thead>
                  <tr className="bg-accent/10">
                    {filasTabla[0].map((celda, colIndex) => (
                      <th 
                        key={colIndex} 
                        className="border border-accent/20 px-4 py-2 text-left font-bold text-accent"
                      >
                        {procesarNegritas(celda)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filasTabla.slice(1).map((fila, filaIndex) => (
                    <tr key={filaIndex} className="hover:bg-accent/5">
                      {fila.map((celda, colIndex) => (
                        <td 
                          key={colIndex} 
                          className="border border-accent/20 px-4 py-2 text-gray-300"
                        >
                          {procesarNegritas(celda)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        
        i = j;
        continue;
      }

      // Procesamiento normal de líneas (código existente)
      if (linea.startsWith('# ')) {
        const textoTitulo = linea.slice(2);
        resultado.push(<h1 key={i} className="text-2xl font-bold text-accent mb-4">{procesarNegritas(textoTitulo)}</h1>);
      } else if (linea.startsWith('## ')) {
        const textoSubtitulo = linea.slice(3);
        resultado.push(<h2 key={i} className="text-xl font-bold text-accent mb-3">{procesarNegritas(textoSubtitulo)}</h2>);
      } else if (linea.startsWith('### ')) {
        const textoSubsubtitulo = linea.slice(4);
        resultado.push(<h3 key={i} className="text-lg font-bold text-accent mb-2">{procesarNegritas(textoSubsubtitulo)}</h3>);
      } else if (linea.startsWith('#### ')) {
        const textoSubsubtitulo4 = linea.slice(5);
        resultado.push(<h4 key={i} className="text-base font-bold text-accent mb-2">{procesarNegritas(textoSubsubtitulo4)}</h4>);
      } else if (linea.startsWith('- ')) {
        const textoLista = linea.slice(2);
        resultado.push(<li key={i} className="ml-4 mb-1 text-gray-300 list-disc">{procesarNegritas(textoLista)}</li>);
      } else if (linea.trim().startsWith('---')) {
        resultado.push(<hr key={i} className="my-4 border-accent/20" />);
      } else if (linea.trim() === '') {
        resultado.push(<br key={i} />);
      } else if (linea.match(/^[\u{1F300}-\u{1F9FF}]/u)) {
        resultado.push(<p key={i} className="mb-2 text-lg text-white">{procesarNegritas(linea)}</p>);
      } else {
        resultado.push(<p key={i} className="mb-2 text-gray-300">{procesarNegritas(linea)}</p>);
      }
      
      i++;
    }

    return resultado;
  };

  const urlsFiltradas = urls.filter(url => {
    const matchBusqueda = url.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                         (url.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || false);
    const matchTema = !temaSeleccionado || url.tema === temaSeleccionado;
    const matchEstado = !filtroEstadoUrl || url.estado === filtroEstadoUrl;
    const matchEtiqueta = !filtroEtiquetaUrl || url.etiquetas.includes(filtroEtiquetaUrl);
    return matchBusqueda && matchTema && matchEstado && matchEtiqueta;
  });

  const FormularioNuevaNota = () => {
    const [formData, setFormData] = useState({
      titulo: '',
      tema: temaSeleccionado || 'notificaciones',
      descripcion: '',
      tipo: 'nota' as 'procedimiento' | 'manual' | 'guia' | 'nota' | 'checklist',
      puntosClave: '',
      contexto: '',
      etiquetas: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const puntosClave = formData.puntosClave 
          ? formData.puntosClave.split('\n').map(punto => punto.trim()).filter(Boolean)
          : [];

        const etiquetas = formData.etiquetas 
          ? formData.etiquetas.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        await generarNuevaNota({
          ...formData,
          puntosClave,
          etiquetas,
          contexto: formData.contexto || undefined
        });
      } catch (error) {
        console.error('Error generando nota:', error);
        alert('Error al generar la nota. Por favor intenta nuevamente.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
            <h3 className="text-xl font-bold text-accent">
              Crear Nueva Nota con IA
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              Completa la información y la IA generará un documento estructurado para ti
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título de la Nota *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                  placeholder="Ej: Procedimiento para resolver incidencias de notificaciones"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tema *</label>
                  <select
                    value={formData.tema}
                    onChange={(e) => setFormData(prev => ({ ...prev, tema: e.target.value }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    required
                  >
                    {temas.map(tema => (
                      <option key={tema.id} value={tema.id} className="bg-primary text-white">{tema.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Documento *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    required
                  >
                    <option value="nota" className="bg-primary text-white">Nota</option>
                    <option value="procedimiento" className="bg-primary text-white">Procedimiento</option>
                    <option value="manual" className="bg-primary text-white">Manual</option>
                    <option value="guia" className="bg-primary text-white">Guía</option>
                    <option value="checklist" className="bg-primary text-white">Lista de Verificación</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  rows={3}
                  placeholder="Describe brevemente qué debe cubrir esta nota..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Puntos Clave (opcional)</label>
                <textarea
                  value={formData.puntosClave}
                  onChange={(e) => setFormData(prev => ({ ...prev, puntosClave: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  rows={4}
                  placeholder="Lista los puntos importantes que debe incluir (uno por línea)&#10;Ej:&#10;Verificar estado del sistema&#10;Contactar al usuario afectado&#10;Documentar la solución"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Contexto Adicional (opcional)</label>
                <textarea
                  value={formData.contexto}
                  onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  rows={3}
                  placeholder="Información adicional que puede ser útil para la generación del documento..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Etiquetas (opcional)</label>
                <input
                  type="text"
                  value={formData.etiquetas}
                  onChange={(e) => setFormData(prev => ({ ...prev, etiquetas: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                  placeholder="Separadas por comas: urgente, soporte, procedimiento"
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-accent/20">
                <button
                  type="submit"
                  disabled={cargandoGeneracion}
                  className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {cargandoGeneracion ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
                      Generando...
                    </span>
                  ) : (
                    'Generar Nota con IA'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarFormularioNota(false)}
                  disabled={cargandoGeneracion}
                  className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const FormularioUrl = () => {
    const [formData, setFormData] = useState({
      titulo: urlEditando?.titulo || '',
      url: urlEditando?.url || '',
      descripcion: urlEditando?.descripcion || '',
      tema: urlEditando?.tema || temaSeleccionado || 'notificaciones',
      tipoContenido: urlEditando?.tipoContenido || 'pagina-contenidos',
      etiquetas: urlEditando?.etiquetas?.join(', ') || '',
      comentarios: urlEditando?.comentarios || ''
    });

    const [modoManual, setModoManual] = useState(!!urlEditando);

    const handleGenerarConIA = async () => {
      if (!formData.url) {
        alert('Por favor ingresa una URL válida primero');
        return;
      }

      try {
        const resultado = await procesarUrlConIA(formData.url, formData.tema);
        
        setFormData(prev => ({
          ...prev,
          titulo: resultado.titulo,
          descripcion: resultado.descripcion,
          tipoContenido: resultado.tipoContenido,
          etiquetas: resultado.etiquetas.join(', ')
        }));
        
        setModoManual(true); // Cambiar a modo manual para permitir ediciones
      } catch (error) {
        console.error('Error generando con IA:', error);
        alert('Error al procesar la URL con IA. Puedes continuar rellenando manualmente.');
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const datosUrl = {
          ...formData,
          etiquetas: formData.etiquetas.split(',').map(tag => tag.trim()).filter(Boolean)
        };

        if (urlEditando) {
          await actualizarUrl(urlEditando.id, datosUrl);
        } else {
          await crearUrl(datosUrl);
        }
      } catch (error) {
        console.error('Error guardando URL:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
            <h3 className="text-xl font-bold text-accent">
              {urlEditando ? 'Editar URL' : 'Agregar Nueva URL con IA'}
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              {urlEditando 
                ? 'Modifica la información del enlace y guarda los cambios'
                : modoManual 
                  ? 'Edita los campos generados automáticamente o continúa llenando manualmente'
                  : 'Ingresa la URL y la IA generará automáticamente el título, descripción y etiquetas'
              }
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título * {modoManual && !urlEditando && <span className="text-blue-400 text-xs">(Generado por IA)</span>}
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                  placeholder="Ingresa el título del recurso"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL *</label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    placeholder="https://ejemplo.com"
                    required
                  />
                  {!urlEditando && !modoManual && formData.url && (
                    <button
                      type="button"
                      onClick={handleGenerarConIA}
                      disabled={cargandoGeneracionUrl}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {cargandoGeneracionUrl ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Procesando con IA...
                        </span>
                      ) : (
                        '🤖 Generar información con IA'
                      )}
                    </button>
                  )}
                  {!urlEditando && modoManual && (
                    <button
                      type="button"
                      onClick={() => setModoManual(false)}
                      className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 text-sm"
                    >
                      ↻ Generar nuevamente con IA
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción {modoManual && !urlEditando && <span className="text-blue-400 text-xs">(Generada por IA)</span>}
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  rows={3}
                  placeholder="Describe brevemente el contenido del recurso"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tema *</label>
                  <select
                    value={formData.tema}
                    onChange={(e) => setFormData(prev => ({ ...prev, tema: e.target.value }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    required
                  >
                    {temas.map(tema => (
                      <option key={tema.id} value={tema.id} className="bg-primary text-white">{tema.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de Contenido * {modoManual && !urlEditando && <span className="text-blue-400 text-xs">(Detectado por IA)</span>}
                  </label>
                  <select
                    value={formData.tipoContenido}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoContenido: e.target.value }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    required
                  >
                    <option value="video" className="bg-primary text-white">Video</option>
                    <option value="documento" className="bg-primary text-white">Documento</option>
                    <option value="pagina-contenidos" className="bg-primary text-white">Página de Contenidos</option>
                    <option value="tutorial" className="bg-primary text-white">Tutorial</option>
                    <option value="referencia" className="bg-primary text-white">Referencia</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Etiquetas {modoManual && !urlEditando && <span className="text-blue-400 text-xs">(Generadas por IA)</span>}
                </label>
                <input
                  type="text"
                  value={formData.etiquetas}
                  onChange={(e) => setFormData(prev => ({ ...prev, etiquetas: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                  placeholder="Separadas por comas: urgente, soporte, procedimiento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Comentarios</label>
                <textarea
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                  rows={2}
                  placeholder="Comentarios adicionales sobre el recurso"
                />
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-accent/20">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/30"
                >
                  {urlEditando ? 'Actualizar' : modoManual ? 'Crear con IA' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormularioUrl(false);
                    setUrlEditando(null);
                  }}
                  className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">Base de Conocimiento</h1>
          <p className="text-gray-400">Documentación organizada por temas y actividades del equipo de soporte</p>
        </div>

        {/* Navegación por secciones */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => { setSeccionActiva('temas'); setTemaSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'temas' 
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaBook />
            Por Temas
          </button>
          <button
            onClick={() => { setSeccionActiva('todos'); setTemaSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'todos' 
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaFileAlt />
            Todos los Documentos
          </button>
          <button
            onClick={() => { setSeccionActiva('urls'); setTemaSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'urls' 
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaLink />
            Enlaces y URLs
          </button>
        </div>

        {/* Vista por temas */}
        {seccionActiva === 'temas' && !temaSeleccionado && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {temas.map((tema) => {
              const cantidadDocs = notasMD.filter(nota => nota.tema === tema.id).length;
              return (
                <button
                  key={tema.id}
                  onClick={() => setTemaSeleccionado(tema.id)}
                  className={`text-left p-6 rounded-lg border transition-all duration-300 hover:shadow-xl hover:shadow-current/20 hover:brightness-110 hover:-translate-y-1 ${tema.color}`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    {tema.icono}
                    <h3 className="text-lg font-bold">{tema.nombre}</h3>
                  </div>
                  <p className="text-sm mb-3 opacity-80">{tema.descripcion}</p>
                  <div className="text-xs opacity-60">
                    {cantidadDocs} documento{cantidadDocs !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Vista de documentos por tema */}
        {seccionActiva === 'temas' && temaSeleccionado && (
          <div>
            {/* Header del tema con colores */}
            <div className={`rounded-lg p-4 mb-6 border ${temas.find(t => t.id === temaSeleccionado)?.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setTemaSeleccionado(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    ← Volver a temas
                  </button>
                  <div className="flex items-center gap-3">
                    {temas.find(t => t.id === temaSeleccionado)?.icono}
                    <h2 className="text-xl font-bold">
                      {temas.find(t => t.id === temaSeleccionado)?.nombre}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarFormularioNota(true)}
                  className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                  Crear Nueva Nota
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de documentos del tema */}
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="space-y-2">
                    {notasFiltradas.map((nota, index) => (
                      <button
                        key={index}
                        onClick={() => setNotaSeleccionada(nota)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                          notaSeleccionada?.nombre === nota.nombre
                            ? `border-2 ${temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[2] || 'border-accent'} ${temas.find(t => t.id === temaSeleccionado)?.color || 'bg-accent/20 text-accent'} shadow-lg`
                            : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notaSeleccionada?.nombre === nota.nombre 
                              ? `${temas.find(t => t.id === temaSeleccionado)?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0] || 'bg-accent/30'}`
                              : 'bg-accent/20'
                          }`}>
                            {nota.tipo === 'nota' ? <FaFileAlt className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-accent'
                            }`} /> : 
                             nota.tipo === 'documento' ? <FaBook className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-accent'
                            }`} /> :
                             <FaVideo className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-accent'
                            }`} />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{nota.nombre}</h3>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {nota.contenido.slice(0, 100)}...
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visor de contenido */}
              <div className="lg:col-span-2">
                <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
                  {notaSeleccionada ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${temas.find(t => t.id === temaSeleccionado)?.color?.replace('border-', 'bg-').replace('/30', '/20')}`}>
                            {temas.find(t => t.id === temaSeleccionado)?.icono}
                          </div>
                          <h2 className={`text-xl font-bold ${temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'}`}>
                            {notaSeleccionada.nombre}
                          </h2>
                        </div>
                        <button 
                          onClick={() => descargarNota(notaSeleccionada)}
                          className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                        >
                          <FaDownload className="text-sm" />
                          Descargar
                        </button>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        {renderizarContenidoMarkdown(notaSeleccionada.contenido)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <FaEye className="text-4xl mb-4 mx-auto" />
                        <p>Selecciona un documento para visualizar su contenido</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de todos los documentos */}
        {seccionActiva === 'todos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-lg p-4">
                <div className="space-y-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaSearch className="text-accent" />
                    <input
                      type="text"
                      placeholder="Buscar documentos..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="flex-1 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    />
                  </div>
                  
                  {etiquetasDisponiblesNotas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
                      <select
                        value={filtroEtiquetaNota}
                        onChange={(e) => setFiltroEtiquetaNota(e.target.value)}
                        className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                      >
                        <option value="">Todas las etiquetas</option>
                        {etiquetasDisponiblesNotas.map(etiqueta => (
                          <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {(busqueda || filtroEtiquetaNota) && (
                    <button
                      onClick={() => {
                        setBusqueda('');
                        setFiltroEtiquetaNota('');
                      }}
                      className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
                
                {cargando ? (
                  <div className="text-center py-8">
                    <div className="text-accent">Cargando...</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notasFiltradas.map((nota, index) => {
                      const temaInfo = temas.find(t => t.id === nota.tema);
                      const isSelected = notaSeleccionada?.nombre === nota.nombre;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setNotaSeleccionada(nota)}
                          className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] border ${
                            isSelected
                              ? `${temaInfo?.color} shadow-lg shadow-current/20`
                              : `bg-gradient-to-r from-primary to-secondary/50 hover:${temaInfo?.color?.replace('text-', 'from-').replace('border-', 'from-').split(' ')[1]?.replace('400', '400/10') || 'from-accent/10'} hover:to-accent/5 border border-gray-700/50 hover:border-current/30 shadow-md hover:shadow-lg`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected 
                                ? `${temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/30') || 'bg-accent/30'}`
                                : `${temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/20') || 'bg-accent/20'}`
                            }`}>
                              {nota.tipo === 'nota' ? <FaFileAlt className={`text-sm ${
                                temaInfo?.color?.split(' ')[1] || 'text-accent'
                              }`} /> : 
                               nota.tipo === 'documento' ? <FaBook className={`text-sm ${
                                temaInfo?.color?.split(' ')[1] || 'text-accent'
                              }`} /> :
                               <FaVideo className={`text-sm ${
                                temaInfo?.color?.split(' ')[1] || 'text-accent'
                              }`} />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{nota.nombre}</h3>
                              <p className={`text-xs mb-1 font-medium ${
                                temaInfo?.color?.split(' ')[1] || 'text-accent'
                              }`}>
                                {temaInfo?.nombre}
                              </p>
                              {nota.etiquetas && nota.etiquetas.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {nota.etiquetas.slice(0, 3).map((etiqueta, etIndex) => (
                                    <span
                                      key={etIndex}
                                      className={`px-1.5 py-0.5 rounded text-xs ${
                                        temaInfo?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/20') || 'bg-accent/20'
                                      } ${
                                        temaInfo?.color?.split(' ')[1] || 'text-accent'
                                      }`}
                                    >
                                      {etiqueta}
                                    </span>
                                  ))}
                                  {nota.etiquetas.length > 3 && (
                                    <span className="text-xs text-gray-400">+{nota.etiquetas.length - 3}</span>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {nota.contenido.slice(0, 100)}...
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
                {notaSeleccionada ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-accent">{notaSeleccionada.nombre}</h2>
                        <p className="text-sm text-gray-400">
                          {temas.find(t => t.id === notaSeleccionada.tema)?.nombre}
                        </p>
                      </div>
                      <button 
                        onClick={() => descargarNota(notaSeleccionada)}
                        className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                      >
                        <FaDownload className="text-sm" />
                        Descargar
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {renderizarContenidoMarkdown(notaSeleccionada.contenido)}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FaEye className="text-4xl mb-4 mx-auto" />
                      <p>Selecciona un documento para visualizar su contenido</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vista de URLs */}
        {seccionActiva === 'urls' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Gestión de Enlaces y URLs</h2>
              <button
                onClick={() => setMostrarFormularioUrl(true)}
                className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
              >
                <FaPlus />
                Agregar URL
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel de filtros y lista */}
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FaSearch className="text-accent" />
                      <input
                        type="text"
                        placeholder="Buscar URLs..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por estado</label>
                      <select
                        value={filtroEstadoUrl}
                        onChange={(e) => {
                          setFiltroEstadoUrl(e.target.value);
                          cargarUrls({ tema: temaSeleccionado || undefined, estado: e.target.value || undefined });
                        }}
                        className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                      >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="revisado">Revisado</option>
                        <option value="archivado">Archivado</option>
                      </select>
                    </div>
                    
                    {etiquetasDisponiblesUrls.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
                        <select
                          value={filtroEtiquetaUrl}
                          onChange={(e) => setFiltroEtiquetaUrl(e.target.value)}
                          className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                        >
                          <option value="">Todas las etiquetas</option>
                          {etiquetasDisponiblesUrls.map(etiqueta => (
                            <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {(busqueda || filtroEstadoUrl || filtroEtiquetaUrl) && (
                      <button
                        onClick={() => {
                          setBusqueda('');
                          setFiltroEstadoUrl('');
                          setFiltroEtiquetaUrl('');
                        }}
                        className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>

                  {cargandoUrls ? (
                    <div className="text-center py-8">
                      <div className="text-accent">Cargando URLs...</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {urlsFiltradas.map((url) => (
                        <div
                          key={url.id}
                          onClick={() => setUrlSeleccionada(url)}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                            urlSeleccionada?.id === url.id
                              ? 'bg-gradient-to-r from-accent/20 to-accent/10 border border-accent shadow-lg shadow-accent/20'
                              : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              urlSeleccionada?.id === url.id 
                                ? 'bg-accent/30' 
                                : 'bg-accent/20'
                            }`}>
                              <FaLink className="text-accent text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm truncate mb-1">{url.titulo}</h3>
                              <p className="text-xs text-accent mb-2 font-medium">
                                {temas.find(t => t.id === url.tema)?.nombre} • {url.tipoContenido}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  url.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  url.estado === 'revisado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {url.estado}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de detalles */}
              <div className="lg:col-span-2">
                <div className="bg-secondary rounded-lg p-6 h-full min-h-96">
                  {urlSeleccionada ? (
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-accent mb-2">{urlSeleccionada.titulo}</h2>
                          <a
                            href={urlSeleccionada.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm break-all"
                          >
                            {urlSeleccionada.url}
                          </a>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-400">
                              {temas.find(t => t.id === urlSeleccionada.tema)?.nombre}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-sm text-gray-400">{urlSeleccionada.tipoContenido}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {urlSeleccionada.estado === 'pendiente' && (
                            <button
                              onClick={() => marcarComoRevisado(urlSeleccionada.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                            >
                              <FaCheck className="text-xs" />
                              Marcar como revisado
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setUrlEditando(urlSeleccionada);
                              setMostrarFormularioUrl(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          >
                            <FaEdit className="text-xs" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de eliminar esta URL?')) {
                                eliminarUrl(urlSeleccionada.id);
                                setUrlSeleccionada(null);
                              }
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            <FaTrash className="text-xs" />
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {urlSeleccionada.descripcion && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                            <p className="text-gray-400">{urlSeleccionada.descripcion}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Estado</h4>
                            <span className={`inline-block px-3 py-1 rounded text-sm ${
                              urlSeleccionada.estado === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                              urlSeleccionada.estado === 'revisado' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {urlSeleccionada.estado}
                            </span>
                          </div>
                        </div>

                        {urlSeleccionada.etiquetas.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Etiquetas</h4>
                            <div className="flex flex-wrap gap-2">
                              {urlSeleccionada.etiquetas.map((etiqueta, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-accent/20 text-accent rounded text-xs"
                                >
                                  {etiqueta}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {urlSeleccionada.comentarios && (
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Comentarios</h4>
                            <p className="text-gray-400 bg-primary rounded p-3">{urlSeleccionada.comentarios}</p>
                          </div>
                        )}

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Creado: {new Date(urlSeleccionada.createdAt).toLocaleDateString()}</p>
                          {urlSeleccionada.fechaRevision && (
                            <p>Revisado: {new Date(urlSeleccionada.fechaRevision).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <FaEyeSlash className="text-4xl mb-4 mx-auto" />
                        <p>Selecciona una URL para ver sus detalles</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {mostrarFormularioNota && <FormularioNuevaNota />}
        {mostrarFormularioUrl && <FormularioUrl />}
      </div>
      
      {/* Chat de IA flotante */}
      <AssistantBubble />
    </div>
  );
};

export default KnowledgePage;
