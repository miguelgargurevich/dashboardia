"use client";
import Modal from '../components/Modal';
import React, { useState, useEffect } from 'react';
import NotaForm from '../components/knowledge/NotaForm';
import RecursoForm from '../components/resources/RecursoForm';
import { FaFileAlt, FaBook, FaVideo, FaBell, FaPrint, FaTicketAlt, FaClock, FaExclamationTriangle, FaLink, FaBrain, FaLayerGroup, FaAddressBook, FaClipboardList, FaPlus, FaCalendarAlt, FaEye } from 'react-icons/fa';
import NotasPanel from '../components/knowledge/NotasPanel';
import type { Recurso, Tema, TipoRecurso } from '../lib/types';
import RecursosArchivosPanel from '../components/resources/RecursosArchivosPanel';
import { useRouter } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

import TodoConocimientoPanel from './TodoConocimientoPanel';
import DetalleNotaPanel from '../components/knowledge/DetalleNotaPanel';
import DetalleRecursoPanel from '../components/resources/DetalleRecursoPanel';
import DetalleEventoPanel from '../components/eventos/DetalleEventoPanel';
import EventosKnowledgePanel from "./EventosKnowledgePanel";
import EventoForm from '../components/eventos/EventoForm';


interface TipoNota {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

interface NotasMD {
  id?: string; // ID para notas de la base de datos
  nombre: string;
  contenido: string;
  tema: string;
  tipo: string; // ahora string, validado contra tiposNotas
  etiquetas?: string[];
  descripcion?: string;
  status?: string;
  priority?: string;
  date?: string; // Único campo de fecha
  relatedResources?: string[];
}

const KnowledgePage: React.FC = () => {
  // Tipos de nota desde JSON centralizado
  const [tiposNotas, setTiposNotas] = useState<TipoNota[]>([]);
  // Estado para crear nuevo evento
  const [mostrarFormularioEvento, setMostrarFormularioEvento] = useState(false);
  useEffect(() => {
    fetch('/tiposNotas.json')
      .then(res => res.json())
      .then((data) => setTiposNotas(data));
  }, []);

  const [token, setToken] = useState<string | null>(null);
  // Estado para los filtros de Todo el Conocimiento
  const [filtros, setFiltros] = useState({ notas: true, recursos: true, eventos: true });
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
  
  // Estado para selección de evento en TodoConocimientoPanel
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any | null>(null);
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
              descripcion: notaInfo.descripcion,
              status: notaInfo.status,
              priority: notaInfo.priority,
              // Usar solo el campo de fecha unificado
              date: notaInfo.date,
              relatedResources: notaInfo.relatedResources
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
        setRecursos(data.resources || []);
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

        {/* Panel Todo el conocimiento con filtros y botones de acción */}
        {!tiposNotas.length ? (
          <div className="p-8 text-center text-gray-500">Cargando tipos de nota...</div>
        ) : seccionActiva === 'todo' ? (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setFiltros(f => ({ ...f, notas: !f.notas }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                  filtros.notas
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'bg-secondary text-gray-300 border-transparent hover:bg-accent/10 hover:text-accent'
                }`}
              >
                {filtros.notas ? <FaEye className="text-accent text-base" /> : <FaEye className="text-gray-400 text-base" />}
                Notas
              </button>
              <button
                onClick={() => setFiltros(f => ({ ...f, recursos: !f.recursos }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                  filtros.recursos
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'bg-secondary text-gray-300 border-transparent hover:bg-accent/10 hover:text-accent'
                }`}
              >
                {filtros.recursos ? <FaEye className="text-accent text-base" /> : <FaEye className="text-gray-400 text-base" />}
                Recursos
              </button>
              <button
                onClick={() => setFiltros(f => ({ ...f, eventos: !f.eventos }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${
                  filtros.eventos
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'bg-secondary text-gray-300 border-transparent hover:bg-accent/10 hover:text-accent'
                }`}
              >
                {filtros.eventos ? <FaEye className="text-accent text-base" /> : <FaEye className="text-gray-400 text-base" />}
                Eventos
              </button>
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Todo el conocimiento</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => { setNotaSeleccionada(null); setMostrarFormularioNota(true); }}
                  className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                   Nota
                </button>
                <button
                  onClick={() => { setRecursoSeleccionado(null); setMostrarFormularioRecurso(true); }}
                  className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                   Recurso
                </button>
                <button
                  onClick={() => setMostrarFormularioEvento(true)}
                  className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                   Evento
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <TodoConocimientoPanel
                  notas={filtros.notas ? notasMD : []}
                  recursos={filtros.recursos ? recursos : []}
                  eventos={filtros.eventos ? eventosParaTodoConocimiento : []}
                  notaSeleccionada={notaSeleccionada}
                  setNotaSeleccionada={setNotaSeleccionada as (nota: any) => void}
                  recursoSeleccionado={recursoSeleccionado}
                  setRecursoSeleccionado={setRecursoSeleccionado as (recurso: any) => void}
                  eventoSeleccionado={eventoSeleccionado}
                  setEventoSeleccionado={setEventoSeleccionado as (evento: any) => void}
                />
              </div>
              <div className="lg:col-span-2">
                {notaSeleccionada ? (
                  <DetalleNotaPanel
                    notaSeleccionada={notaSeleccionada as any}
                    temas={temas}
                    descargarNota={descargarNota as (nota: any) => void}
                    eliminarNota={eliminarNota as (nota: any) => void}
                    renderizarContenidoMarkdown={renderizarContenidoMarkdown}
                  />
                ) : recursoSeleccionado ? (
                  <DetalleRecursoPanel
                    recurso={recursoSeleccionado}
                    temas={temas}
                    getTipoRecursoLabel={getTipoRecursoLabel}
                    formatFileSize={formatFileSize}
                    onEdit={() => setMostrarFormularioRecurso(true)}
                    onDelete={eliminarRecurso}
                  />
                ) : eventoSeleccionado ? (
                  <DetalleEventoPanel
                    eventoSeleccionado={eventoSeleccionado}
                    onEdit={() => setMostrarFormularioEvento(true)}
                    onDelete={() => {}}
                    emptyMessage="Selecciona un evento para ver sus detalles"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <FaEye className="text-4xl mb-4 mx-auto" />
                      <p>Selecciona una nota, recurso o evento para ver sus detalles</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}




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

        {/* Panel de eventos de conocimiento, como sección independiente */}
        {seccionActiva === 'eventos' && (
          <div>
            <EventosKnowledgePanel token={token} />
          </div>
        )}
        
        {/* Vista de todas las Notas */}
        {seccionActiva === 'todos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Gestión de Notas</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => { setNotaSeleccionada(null); setMostrarFormularioNota(true); }}
                  className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                   Nota
                </button>
              </div>
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
              tiposNotas={tiposNotas}
            />
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
                  onClick={() => { setNotaSeleccionada(null); setMostrarFormularioNota(true); }}
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
              tiposNotas={tiposNotas}
            />
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
                  onClick={() => { setRecursoSeleccionado(null); setMostrarFormularioRecurso(true); }}
                  className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <FaPlus />
                   Recurso
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
              setMostrarFormularioRecurso={setMostrarFormularioRecurso}
              eliminarRecurso={eliminarRecurso}
            />
          </div>
        )}

        {/* Vista de recursos */}
        {seccionActiva === 'recursos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">Gestión de Recursos</h2>
              <button
                onClick={() => { setRecursoSeleccionado(null); setMostrarFormularioRecurso(true); }}
                className="flex items-center gap-2 bg-accent text-secondary px-4 py-2 rounded-lg hover:bg-accent/80 transition-colors"
              >
                <FaPlus />
                 Recurso
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
              setMostrarFormularioRecurso={setMostrarFormularioRecurso}
              eliminarRecurso={eliminarRecurso}
            />
          </div>
        )}
        
        {/* Modal para crear nota */}
        {mostrarFormularioNota && (
          <Modal
            open={mostrarFormularioNota}
            onClose={() => setMostrarFormularioNota(false)}
            title={notaSeleccionada ? 'Editar Nota' : 'Nueva Nota'}
          >
            <NotaForm
              temas={temas}
              tiposNotas={tiposNotas}
              etiquetasDisponibles={etiquetasDisponiblesNotas}
              initialValues={notaSeleccionada || undefined}
              onSubmit={async (values) => {
                if (!token) return;
                try {
                  const res = await fetch('/api/content/knowledge', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(values)
                  });
                  if (!res.ok) throw new Error('Error al guardar la nota');
                  await cargarContenido();
                  setNotaSeleccionada(null);
                  setMostrarFormularioNota(false);
                } catch (err) {
                  alert('Ocurrió un error al guardar la nota.');
                }
              }}
            />
          </Modal>
        )}

        {/* Modal para crear recurso */}
        {mostrarFormularioRecurso && (
          <Modal
            open={mostrarFormularioRecurso}
            onClose={() => setMostrarFormularioRecurso(false)}
            title={recursoSeleccionado ? 'Editar Recurso' : 'Nuevo Recurso'}
          >
            <RecursoForm
              temas={temas}
              tiposRecursos={tiposRecursos.map(t => ({
                ...t,
                descripcion: t.descripcion || '',
                color: t.color || '',
              }))}
              etiquetasDisponibles={etiquetasDisponiblesRecursos}
              initialValues={recursoSeleccionado || undefined}
              onSubmit={async (values) => {
                if (!token) return;
                try {
                  const res = await fetch('/api/resources', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(values)
                  });
                  if (!res.ok) throw new Error('Error al guardar el recurso');
                  await cargarRecursos();
                  setRecursoSeleccionado(null);
                  setMostrarFormularioRecurso(false);
                } catch (err) {
                  alert('Ocurrió un error al guardar el recurso.');
                }
              }}
            />
          </Modal>
        )}

        {/* Modal para crear evento */}
        {mostrarFormularioEvento && (
          <Modal
            open={mostrarFormularioEvento}
            onClose={() => setMostrarFormularioEvento(false)}
            title={"Nuevo Evento"}
          >
            <EventoForm
              initialValues={undefined}
              onSubmit={async (values: any) => {
                if (!token) return;
                try {
                  const res = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(values)
                  });
                  if (!res.ok) throw new Error('Error al crear el evento');
                  setMostrarFormularioEvento(false);
                  window.location.reload();
                } catch (err) {
                  alert('Ocurrió un error al crear el evento.');
                }
              }}
              onCancel={() => setMostrarFormularioEvento(false)}
              submitLabel="Crear evento"
            />
          </Modal>
        )}

      </div>
      

      {/* Chat de IA flotante */}
      <AssistantBubble />
    </div>
  );
};

export default KnowledgePage;
