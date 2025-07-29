"use client";
import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { FaFileAlt, FaBook, FaVideo, FaBell, FaPrint, FaTicketAlt, FaClock, FaExclamationTriangle, FaLink, FaBrain, FaLayerGroup, FaAddressBook, FaClipboardList, FaPlus } from 'react-icons/fa';
import NotasPanel from '../components/dashboard/NotasPanel';
import type { Recurso, Tema, TipoRecurso } from '../lib/types';
import RecursosArchivosPanel from '../components/dashboard/RecursosArchivosPanel';
import { useRouter } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

import TodoConocimientoPanel from './TodoConocimientoPanel';
import EventosKnowledgePanel from "./EventosKnowledgePanel";

// Eliminada la versión duplicada de NotasMD para evitar conflicto de tipos


type NotaTipo = 'nota' | 'documento' | 'video' | 'incidente' | 'mantenimiento' | 'reunion' | 'capacitacion' | 'otro';

interface NotasMD {
  id?: string; // ID para notas de la base de datos
  nombre: string;
  contenido: string;
  tema: string;
  tipo: NotaTipo;
  etiquetas?: string[];
  // Campos adicionales del modelo unificado
  descripcion?: string;
  status?: string;
  priority?: string;
  date?: string; // Para notas diarias
  relatedResources?: string[];
  createdAt?: string;
  updatedAt?: string;

}

const KnowledgePage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  // Eventos para TodoConocimientoPanel (eventos del mes actual)
  const [eventosParaTodoConocimiento, setEventosParaTodoConocimiento] = useState<any[]>([]);
  useEffect(() => {
    async function fetchEventos() {
      if (!token) return;
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/events/calendar?month=${month}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEventosParaTodoConocimiento(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setEventosParaTodoConocimiento([]);
      }
    }
    fetchEventos();
  }, [token]);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [seccionActiva, setSeccionActiva] = useState('todo');
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [notasMD, setNotasMD] = useState<NotasMD[]>([]);
  const [notaSeleccionada, setNotaSeleccionada] = useState<NotasMD | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // Estados para filtros de etiquetas
  const [filtroEtiquetaNota, setFiltroEtiquetaNota] = useState<string>('');
  const [etiquetasDisponiblesNotas, setEtiquetasDisponiblesNotas] = useState<string[]>([]);

  // Estados para crear nueva nota
  const [mostrarFormularioNota, setMostrarFormularioNota] = useState(false);

  // Estados para recursos
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [mostrarFormularioRecurso, setMostrarFormularioRecurso] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  const [cargandoRecursos, setCargandoRecursos] = useState(false);
  const [filtroTipoRecurso, setFiltroTipoRecurso] = useState<string>('');
  const [filtroEtiquetaRecurso, setFiltroEtiquetaRecurso] = useState<string>('');
  const [etiquetasDisponiblesRecursos, setEtiquetasDisponiblesRecursos] = useState<string[]>([]);
  const [tipoRecursoSeleccionado, setTipoRecursoSeleccionado] = useState<string | null>(null);

  // Definición de tipos de recursos desde JSON centralizado
  const [tiposRecursos, setTiposRecursos] = useState<TipoRecurso[]>([]);
  useEffect(() => {
    fetch('/tiposRecursos.json')
      .then(res => res.json())
      .then((data) => {
        // Asignar iconos según el id
        const iconMap: Record<string, React.ReactNode> = {
          'url': <FaLink className="text-xl" />,
          'archivo': <FaFileAlt className="text-xl" />,
          'video': <FaVideo className="text-xl" />,
          'ia-automatizacion': <FaBrain className="text-xl" />,
          'contactos-externos': <FaAddressBook className="text-xl" />,
          'plantillas-formularios': <FaClipboardList className="text-xl" />
        };
        setTiposRecursos(data.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-xl" /> })));
      });
  }, []);

  // Cargar temas desde el JSON centralizado y asignar iconos
  const [temas, setTemas] = useState<Tema[]>([]);
  useEffect(() => {
    fetch('/temas.json')
      .then(res => res.json())
      .then((data) => {
        // Asignar iconos según el id
        const iconMap: Record<string, React.ReactNode> = {
          'notificaciones': <FaBell className="text-xl" />,
          'polizas': <FaPrint className="text-xl" />,
          'tickets': <FaTicketAlt className="text-xl" />,
          'actividades-diarias': <FaClock className="text-xl" />,
          'emergencias': <FaExclamationTriangle className="text-xl" />,
          'kb-conocidos': <FaBrain className="text-xl" />
        };
        setTemas(data.map((t: any) => ({ ...t, icono: iconMap[t.id] || <FaLayerGroup className="text-xl" /> })));
      });
  }, []);
  // Helper para obtener el id del primer tema
  const primerTemaId = temas[0]?.id || '';

  // Efecto para inicializar autenticación
  useEffect(() => {
    setMounted(true);
    const t = localStorage.getItem('token');
    setIsLoggedIn(!!t);
    setToken(t);
    if (!t) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      cargarContenido();
      cargarRecursos();
    }
  }, [token]);

  // Efecto para extraer etiquetas disponibles
  useEffect(() => {
    // Extraer etiquetas únicas de notas
    const etiquetasNotas = new Set<string>();
    notasMD.forEach(nota => {
      nota.etiquetas?.forEach(etiqueta => {
        etiquetasNotas.add(etiqueta);
      });
    });
    setEtiquetasDisponiblesNotas(Array.from(etiquetasNotas).sort());

    // Extraer etiquetas únicas de recursos
    const etiquetasRecursos = new Set<string>();
    recursos.forEach(recurso => {
      recurso.tags?.forEach(tag => {
        etiquetasRecursos.add(tag);
      });
    });
    setEtiquetasDisponiblesRecursos(Array.from(etiquetasRecursos).sort());
  }, [notasMD, recursos]);

  const cargarContenido = async () => {
    if (!token) return;
    
    setCargando(true);
    
    try {
      // Obtener notas directamente del endpoint
      const response = await fetch('/api/content/knowledge', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener la lista de notas');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al obtener notas');
      }
      
      const notasCargadas: NotasMD[] = [];
      const { archivosPorTema } = data; // Backend compatibility - contains notes grouped by tema

      // Procesar notas de cada tema
      for (const [tema, notas] of Object.entries(archivosPorTema)) {
        const notasArray = notas as any[];
        
        for (const notaInfo of notasArray) {
          // Las notas ya vienen con el contenido desde la base de datos
          // No necesitamos hacer fetch adicional
          try {
            // Determinar tipo basado en el tipo de la nota
            let tipo: 'nota' | 'documento' | 'video' | 'incidente' | 'mantenimiento' | 'reunion' | 'capacitacion' | 'otro' = 
              notaInfo.tipo || 'nota';

            // Extraer etiquetas - ahora vienen directamente en notaInfo.tags
            const etiquetas = notaInfo.tags || [];

            notasCargadas.push({
              id: notaInfo.id, // ID de la base de datos para operaciones CRUD
              nombre: notaInfo.title || notaInfo.nombreSinExtension || 'Sin título', // Usar title de la base de datos o nombreSinExtension como fallback
              tema: tema,
              tipo: tipo,
              contenido: notaInfo.content || notaInfo.contenido || '', // Usar content de la base de datos o contenido como fallback
              etiquetas: etiquetas,
              // Campos adicionales del modelo unificado
              descripcion: notaInfo.descripcion,
              status: notaInfo.status,
              priority: notaInfo.priority,
              date: notaInfo.date,
              relatedResources: notaInfo.relatedResources,
              createdAt: notaInfo.createdAt || notaInfo.fechaModificacion,
              updatedAt: notaInfo.updatedAt || notaInfo.fechaModificacion
            });
          } catch (error) {
            console.error(`Error procesando nota ${notaInfo.nombreSinExtension}:`, error);
          }
        }
      }

      setNotasMD(notasCargadas);
      console.log('Notas cargadas desde base de datos:', {
        totalNotas: notasCargadas.length,
        notasPorTema: Object.fromEntries(
          Object.entries(archivosPorTema).map(([tema, notas]) => 
            [tema, (notas as any[]).length]
          )
        )
      });
      
    } catch (error) {
      console.error('Error cargando contenido:', error);
      alert('Error al cargar las notas. Por favor, recarga la página.');
    } finally {
      setCargando(false);
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

  // Funciones auxiliares para recursos
  const getIconoTipoRecurso = (tipo: string, tipoArchivo?: string) => {
    if (tipo === 'url') return <FaLink className="text-accent text-sm" />;
    if (tipo === 'video') return <FaVideo className="text-accent text-sm" />;
    if (tipo === 'ia-automatizacion') return <FaBrain className="text-accent text-sm" />;
    if (tipo === 'contactos-externos') return <FaAddressBook className="text-accent text-sm" />;
    if (tipo === 'plantillas-formularios') return <FaClipboardList className="text-accent text-sm" />;
    
    if (tipo === 'archivo') {
      switch (tipoArchivo) {
        case 'pdf':
          return <FaFileAlt className="text-red-400 text-sm" />;
        case 'word':
          return <FaFileAlt className="text-blue-400 text-sm" />;
        case 'excel':
          return <FaFileAlt className="text-green-400 text-sm" />;
        case 'powerpoint':
          return <FaFileAlt className="text-orange-400 text-sm" />;
        case 'video':
          return <FaVideo className="text-purple-400 text-sm" />;
        case 'imagen':
          return <FaFileAlt className="text-pink-400 text-sm" />;
        default:
          return <FaFileAlt className="text-accent text-sm" />;
      }
    }
    
    return <FaFileAlt className="text-accent text-sm" />;
  };

  const getTipoRecursoLabel = (tipo: string, tipoArchivo?: string) => {
    if (tipo === 'url') return 'Enlace Web';
    if (tipo === 'video') return 'Video';
    if (tipo === 'ia-automatizacion') return 'IA y Automatización';
    if (tipo === 'contactos-externos') return 'Contactos y Recursos Externos';
    if (tipo === 'plantillas-formularios') return 'Plantillas y Formularios';
    
    if (tipo === 'archivo') {
      switch (tipoArchivo) {
        case 'pdf': return 'Documento PDF';
        case 'word': return 'Documento Word';
        case 'excel': return 'Hoja Excel';
        case 'powerpoint': return 'Presentación PowerPoint';
        case 'video': return 'Archivo de Video';
        case 'audio': return 'Archivo de Audio';
        case 'imagen': return 'Imagen';
        case 'archivo_comprimido': return 'Archivo Comprimido';
        case 'texto': return 'Archivo de Texto';
        default: return 'Archivo';
      }
    }
    
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const cargarRecursos = async () => {
    if (!token) return;
    
    setCargandoRecursos(true);
    try {
      const params = new URLSearchParams();
      if (temaSeleccionado) params.append('categoria', temaSeleccionado);
      
      const response = await fetch(`/api/resources?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecursos(data.recursos || []);
      } else {
        console.error('Error cargando recursos:', response.statusText);
      }
    } catch (error) {
      console.error('Error cargando recursos:', error);
    } finally {
      setCargandoRecursos(false);
    }
  };

  const eliminarRecurso = async (id: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/resources/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setRecursos(prev => prev.filter(recurso => recurso.id !== id));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando recurso');
      }
    } catch (error) {
      console.error('Error eliminando recurso:', error);
      throw error;
    }
  };

  const eliminarNota = async (nota: NotasMD) => {
    if (!token) return;
    
    try {
      // Si la nota tiene ID, eliminarla directamente
      if (nota.id) {
        const response = await fetch('/api/content/knowledge', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: nota.id })
        });

        if (response.ok) {
          // Recargar notas después de eliminar
          await cargarContenido();
          // Si era la nota seleccionada, limpiar la selección
          if (notaSeleccionada?.id === nota.id) {
            setNotaSeleccionada(null);
          }
          alert('Nota eliminada exitosamente');
          return;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Error eliminando nota');
        }
      } else {
        // Fallback: intentar eliminar por nombre y tema (para compatibilidad)
        const response = await fetch('/api/content/knowledge', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nombre: nota.nombre, tema: nota.tema })
        });

        if (response.ok) {
          await cargarContenido();
          if (notaSeleccionada?.nombre === nota.nombre) {
            setNotaSeleccionada(null);
          }
          alert('Nota eliminada exitosamente');
          return;
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Error eliminando nota');
        }
      }
      
    } catch (error) {
      console.error('Error eliminando nota:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar la nota: ${errorMessage}`);
    }
  };

  const crearRecurso = async (datosRecurso: Partial<Recurso>) => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosRecurso)
      });
      
      if (response.ok) {
        const data = await response.json();
        const nuevoRecurso = data.recurso;
        setRecursos(prev => [nuevoRecurso, ...prev]);
        setMostrarFormularioRecurso(false);
        return nuevoRecurso;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error creando recurso');
      }
    } catch (error) {
      console.error('Error creando recurso:', error);
      throw error;
    }
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
        const filasTabla: string[][] = [];
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

  const FormularioNuevaNota = () => {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const [formData, setFormData] = useState({
      titulo: '',
      tema: temaSeleccionado || primerTemaId,
      contenido: '',
      etiquetas: '',
      fecha: fechaHoy
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const etiquetas = formData.etiquetas 
          ? formData.etiquetas.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        // Usar la fecha del formulario, o la de hoy si está vacía
        const fechaNota = formData.fecha || fechaHoy;

        // Crear el contenido markdown para guardar en la base de datos
        const contenidoMarkdown = `# ${formData.titulo}

${formData.contenido}

**Etiquetas:** ${etiquetas.join(', ')}`;

        const body = {
          nombre: formData.titulo,
          tema: formData.tema,
          contenido: contenidoMarkdown,
          etiquetas,
          date: fechaNota
        };

        const response = await fetch('/api/content/knowledge', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          await cargarContenido();
          setMostrarFormularioNota(false);
          alert('Nota creada exitosamente');
        } else {
          throw new Error('Error al crear la nota');
        }
      } catch (error) {
        console.error('Error creando nota:', error);
        alert('Error al crear la nota. Por favor intenta nuevamente.');
      }
    };

    return (
      <Modal
        open={mostrarFormularioNota}
        onClose={() => setMostrarFormularioNota(false)}
        title="Crear Nueva Nota"
        maxWidth="max-w-2xl"
      >
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fecha *</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
              className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
              required
            />
          </div>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Contenido *</label>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData(prev => ({ ...prev, contenido: e.target.value }))}
              className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
              rows={8}
              placeholder="Escribe el contenido de la nota en formato Markdown..."
              required
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
              className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/30"
            >
              Crear Nota
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormularioNota(false)}
              className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Componente para el formulario de crear recurso
  const FormularioRecurso = () => {
    const [formData, setFormData] = useState({
      titulo: recursoEditando?.titulo || '',
      tipo: (recursoEditando?.tipo as 'url' | 'archivo' | 'video' | 'ia-automatizacion' | 'contactos-externos' | 'plantillas-formularios') || 'url',
      descripcion: recursoEditando?.descripcion || '',
      url: recursoEditando?.url || '',
      tema: recursoEditando?.tema || temaSeleccionado || primerTemaId,
      etiquetas: recursoEditando?.tags?.join(', ') || ''
    });
    const [archivo, setArchivo] = useState<File | null>(null);
    const [procesandoRecurso, setProcesandoRecurso] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcesandoRecurso(true);

      try {
        const etiquetas = formData.etiquetas 
          ? formData.etiquetas.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        if (formData.tipo === 'archivo' && archivo) {
          // Subir archivo
          const formDataFile = new FormData();
          formDataFile.append('file', archivo);
          formDataFile.append('titulo', formData.titulo);
          formDataFile.append('descripcion', formData.descripcion);
          formDataFile.append('tema', formData.tema);
          formDataFile.append('tags', JSON.stringify(etiquetas));

          const response = await fetch('/api/resources/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataFile,
          });

          if (!response.ok) {
            throw new Error('Error al subir el archivo');
          }
        } else if (recursoEditando) {
          // Editar recurso existente
          const response = await fetch(`/api/resources/${recursoEditando.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ...formData,
              tags: etiquetas
            })
          });

          if (!response.ok) {
            throw new Error('Error al actualizar el recurso');
          }
        } else {
          // Crear nuevo recurso (URL, video, documento)
          await crearRecurso({
            titulo: formData.titulo,
            tipo: formData.tipo,
            descripcion: formData.descripcion,
            url: formData.url,
            tema: formData.tema,
            tags: etiquetas
          });
        }

        // Recargar recursos y cerrar formulario
        await cargarRecursos();
        setMostrarFormularioRecurso(false);
        setRecursoEditando(null);
        alert(recursoEditando ? 'Recurso actualizado exitosamente' : 'Recurso creado exitosamente');
      } catch (error) {
        console.error('Error al procesar recurso:', error);
        alert('Error al procesar el recurso');
      } finally {
        setProcesandoRecurso(false);
      }
    };

    return (
      <Modal
        open={mostrarFormularioRecurso}
        onClose={() => {
          setMostrarFormularioRecurso(false);
          setRecursoEditando(null);
        }}
        title={recursoEditando ? 'Editar Recurso' : 'Agregar Nuevo Recurso'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Recurso *</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as 'url' | 'archivo' | 'video' | 'ia-automatizacion' | 'contactos-externos' | 'plantillas-formularios' }))}
              className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
              required
              disabled={!!recursoEditando}
            >
              <option value="url" className="bg-primary text-white">🔗 Enlace / URL</option>
              <option value="archivo" className="bg-primary text-white">📁 Archivo</option>
              <option value="video" className="bg-primary text-white">🎥 Video</option>
              <option value="ia-automatizacion" className="bg-primary text-white">🤖 IA y Automatización</option>
              <option value="contactos-externos" className="bg-primary text-white">� Contactos y Recursos Externos</option>
              <option value="plantillas-formularios" className="bg-primary text-white">📋 Plantillas y Formularios</option>
            </select>
          </div>
          {(formData.tipo === 'url' || formData.tipo === 'video' || formData.tipo === 'ia-automatizacion' || formData.tipo === 'contactos-externos' || formData.tipo === 'plantillas-formularios') ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                placeholder={
                  formData.tipo === 'video' ? "https://youtube.com/watch?v=..." : 
                  formData.tipo === 'ia-automatizacion' ? "https://docs.google.com/document/d/..." :
                  formData.tipo === 'contactos-externos' ? "https://directorio.empresa.com" :
                  formData.tipo === 'plantillas-formularios' ? "https://forms.google.com/..." :
                  "https://ejemplo.com"
                }
                required
              />
            </div>
          ) : formData.tipo === 'archivo' && !recursoEditando ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Archivo *</label>
              <input
                type="file"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                required
              />
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
              placeholder="Descripción breve del recurso"
            />
          </div>
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
              className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/30"
              disabled={procesandoRecurso}
            >
              {recursoEditando ? 'Guardar Cambios' : 'Crear Recurso'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormularioRecurso(false);
                setRecursoEditando(null);
              }}
              className="flex-1 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700/80 transition-all duration-200 transform hover:scale-105 shadow-lg"
              disabled={procesandoRecurso}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    );

  };

  // Protección de autenticación
  if (!mounted || isLoggedIn === null) {
    return null; // Espera a montar y verificar
  }

  if (!isLoggedIn) {
    return null; // Ya redirigió al login
  }

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
            onClick={() => { setSeccionActiva('todo'); setTemaSeleccionado(null); setTipoRecursoSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'todo'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaLayerGroup />
            Todo el conocimiento
          </button>
          <button
            onClick={() => { setSeccionActiva('todos'); setTemaSeleccionado(null); setTipoRecursoSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'temas' || seccionActiva === 'todos'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaBook />
            Notas y Documentos
          </button>
          <button
            onClick={() => { setSeccionActiva('recursos'); setTemaSeleccionado(null); setTipoRecursoSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'tipos' || seccionActiva === 'recursos'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaLayerGroup />
            Recursos y Archivos
          </button>
          <button
            onClick={() => { setSeccionActiva('eventos'); setTemaSeleccionado(null); setTipoRecursoSeleccionado(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              seccionActiva === 'eventos'
                ? 'bg-accent text-secondary' 
                : 'bg-secondary text-accent hover:bg-accent/10'
            }`}
          >
            <FaClock />
            Eventos del Equipo
          </button>
        </div>




        {/* Panel Todo el conocimiento */}

        {/* Panel Todo el conocimiento */}
        {seccionActiva === 'todo' && (
          <div>
            {/* Panel unificado: notas, recursos, eventos */}
            <TodoConocimientoPanel notas={notasMD} recursos={recursos} eventos={eventosParaTodoConocimiento} />
          </div>
        )}


        {/* Panel de eventos de conocimiento, como sección independiente */}
        {seccionActiva === 'eventos' && (
          <div>
            <EventosKnowledgePanel token={token} />
          </div>
        )}

        {/* Subnavegación para Notas y Documentos - Siempre visible cuando estemos en este contexto */}
        {(seccionActiva === 'temas' || seccionActiva === 'todos') && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => { setSeccionActiva('todos'); setTemaSeleccionado(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                seccionActiva === 'todos'
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <FaFileAlt className="text-sm" />
              Todas las Notas
            </button>
            <button
              onClick={() => { setSeccionActiva('temas'); setTemaSeleccionado(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                seccionActiva === 'temas'
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <FaLayerGroup className="text-sm" />
              Por Temas
            </button>
          </div>

        )}

        {/* Subnavegación para Recursos y Archivos - Siempre visible cuando estemos en este contexto */}
        {(seccionActiva === 'tipos' || seccionActiva === 'recursos') && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => { setSeccionActiva('recursos'); setTipoRecursoSeleccionado(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                seccionActiva === 'recursos'
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <FaVideo className="text-sm" />
              Todos los Recursos
            </button>
            <button
              onClick={() => { setSeccionActiva('tipos'); setTipoRecursoSeleccionado(null); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                seccionActiva === 'tipos'
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-secondary text-gray-300 hover:bg-accent/10 hover:text-accent'
              }`}
            >
              <FaLayerGroup className="text-sm" />
              Por Tipos
            </button>
          </div>
        )}

        {/* Vista por temas */}
        {seccionActiva === 'temas' && !temaSeleccionado && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {temas.map((tema) => {
                const cantidadDocs = notasMD.filter(nota => nota.tema === tema.id).length;
                return (
                  <button
                    key={tema.id}
                    onClick={() => setTemaSeleccionado(tema.id)}
                    className={`text-left p-6 rounded-lg border transition-all duration-300 ${tema.color} hover:bg-white/10 hover:border-accent/60`}
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
                  Crear Nota Manual
                </button>
              </div>
            </div>
            <NotasPanel
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              etiquetasDisponiblesNotas={
                etiquetasDisponiblesNotas.filter(et =>
                  notasMD.some(nota => nota.tema === temaSeleccionado && nota.etiquetas?.includes(et))
                )
              }
              filtroEtiquetaNota={filtroEtiquetaNota}
              setFiltroEtiquetaNota={setFiltroEtiquetaNota}
              cargando={cargando}
              notasFiltradas={notasMD.filter(nota => (
                nota.tema === temaSeleccionado &&
                (
                  nota.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                  nota.contenido.toLowerCase().includes(busqueda.toLowerCase())
                ) &&
                (!filtroEtiquetaNota || (nota.etiquetas && nota.etiquetas.includes(filtroEtiquetaNota)))
              ))}
              temas={temas}
              notaSeleccionada={notaSeleccionada}
              setNotaSeleccionada={setNotaSeleccionada}
              descargarNota={descargarNota}
              eliminarNota={eliminarNota}
              renderizarContenidoMarkdown={renderizarContenidoMarkdown}
            />
          </div>
        )}

        {/* Vista por tipos de recursos */}
        {seccionActiva === 'tipos' && !tipoRecursoSeleccionado && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiposRecursos.map((tipo) => {
                const cantidadRecursos = recursos.filter(recurso => recurso.tipo === tipo.id).length;
                return (
                  <button
                    key={tipo.id}
                    onClick={() => setTipoRecursoSeleccionado(tipo.id)}
                    className={`text-left p-6 rounded-lg border transition-all duration-300 ${tipo.color} hover:bg-white/10 hover:border-accent/60`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      {tipo.icono}
                      <h3 className="text-lg font-bold">{tipo.nombre}</h3>
                    </div>
                    <p className="text-sm mb-3 opacity-80">{tipo.descripcion}</p>
                    <div className="text-xs opacity-60">
                      {cantidadRecursos} recurso{cantidadRecursos !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista de recursos por tipo seleccionado */}
        {seccionActiva === 'tipos' && tipoRecursoSeleccionado && (
          <div>
            {/* Header del tipo con colores */}
            <div className={`rounded-lg p-4 mb-6 border ${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setTipoRecursoSeleccionado(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    ← Volver a tipos
                  </button>
                  <div className="flex items-center gap-3">
                    {tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.icono}
                    <h2 className="text-xl font-bold">
                      {tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.nombre}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setMostrarFormularioRecurso(true)}
                  className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                  Agregar Recurso
                </button>
              </div>
            </div>
            <RecursosArchivosPanel
              recursos={recursos.filter(r => r.tipo === tipoRecursoSeleccionado)}
              temas={temas}
              recursoSeleccionado={recursoSeleccionado}
              setRecursoSeleccionado={setRecursoSeleccionado}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              etiquetasDisponibles={etiquetasDisponiblesRecursos}
              filtroEtiqueta={filtroEtiquetaRecurso}
              setFiltroEtiqueta={setFiltroEtiquetaRecurso}
              filtroTipo={filtroTipoRecurso}
              setFiltroTipo={setFiltroTipoRecurso}
              cargando={cargandoRecursos}
              getIconoTipoRecurso={getIconoTipoRecurso}
              getTipoRecursoLabel={getTipoRecursoLabel}
              formatFileSize={formatFileSize}
              temaSeleccionado={temaSeleccionado}
              setRecursoEditando={setRecursoEditando}
              setMostrarFormularioRecurso={setMostrarFormularioRecurso}
              eliminarRecurso={eliminarRecurso}
            />
          </div>
        )}

        {/* Vista de todas las Notas */}
        {seccionActiva === 'todos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Gestión de Notas</h2>
              <button
                onClick={() => setMostrarFormularioNota(true)}
                className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
              >
                <FaPlus />
                Agregar Nota
              </button>
            </div>

            <NotasPanel
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              etiquetasDisponiblesNotas={etiquetasDisponiblesNotas}
              filtroEtiquetaNota={filtroEtiquetaNota}
              setFiltroEtiquetaNota={setFiltroEtiquetaNota}
              cargando={cargando}
              notasFiltradas={notasFiltradas}
              temas={temas}
              notaSeleccionada={notaSeleccionada}
              setNotaSeleccionada={setNotaSeleccionada}
              descargarNota={descargarNota}
              eliminarNota={eliminarNota}
              renderizarContenidoMarkdown={renderizarContenidoMarkdown}
            />
          </div>
        )}

        {/* Vista de recursos */}
        {seccionActiva === 'recursos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Gestión de Recursos</h2>
              <button
                onClick={() => setMostrarFormularioRecurso(true)}
                className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
              >
                <FaPlus />
                Agregar Recurso
              </button>
            </div>
            <RecursosArchivosPanel
              recursos={recursos}
              temas={temas}
              recursoSeleccionado={recursoSeleccionado}
              setRecursoSeleccionado={setRecursoSeleccionado}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              etiquetasDisponibles={etiquetasDisponiblesRecursos}
              filtroEtiqueta={filtroEtiquetaRecurso}
              setFiltroEtiqueta={setFiltroEtiquetaRecurso}
              filtroTipo={filtroTipoRecurso}
              setFiltroTipo={setFiltroTipoRecurso}
              cargando={cargandoRecursos}
              getIconoTipoRecurso={getIconoTipoRecurso}
              getTipoRecursoLabel={getTipoRecursoLabel}
              formatFileSize={formatFileSize}
              temaSeleccionado={temaSeleccionado}
              setRecursoEditando={setRecursoEditando}
              setMostrarFormularioRecurso={setMostrarFormularioRecurso}
              eliminarRecurso={eliminarRecurso}
            />
          </div>
        )}
        
        {mostrarFormularioNota && <FormularioNuevaNota />}
        {mostrarFormularioRecurso && <FormularioRecurso />}
      </div>
      
      {/* Chat de IA flotante */}
      <AssistantBubble />
    </div>
  );
};

export default KnowledgePage;
