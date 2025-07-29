"use client";
import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaBook, FaVideo, FaDownload, FaSearch, FaEye, FaBell, FaPrint, FaTicketAlt, FaClock, FaExclamationTriangle, FaLink, FaPlus, FaEdit, FaTrash, FaEyeSlash, FaBrain, FaLayerGroup, FaAddressBook, FaClipboardList, FaTimes, FaCog, FaUsers, FaGraduationCap } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import AssistantBubble from '../components/AsisstantIA/AssistantBubble';

import TodoConocimientoPanel from './TodoConocimientoPanel';

// Eliminada la versión duplicada de NotasMD para evitar conflicto de tipos

interface Recurso {
  id: string;
  tipo: string; // 'url', 'archivo', 'video', 'documento'
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  tags: string[];
  categoria?: string;
  tema: string;
  fechaCarga: string;
  tipoArchivo?: string;

  tamaño?: number;
  nombreOriginal?: string;
  estado?: string;
}

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

interface TipoRecurso {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
}

const KnowledgePage: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-accent">
                  Crear Nueva Nota
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Completa la información para crear una nueva nota
                </p>
              </div>
              <button
                onClick={() => setMostrarFormularioNota(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20"
              >
                <FaTimes />
              </button>
            </div>
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
          </div>
        </div>
      </div>
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-secondary border border-accent/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="bg-secondary border-b border-accent/20 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-accent">
                  {recursoEditando ? 'Editar Recurso' : 'Agregar Nuevo Recurso'}
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  {recursoEditando 
                    ? 'Modifica la información del recurso y guarda los cambios'
                    : 'Completa la información del recurso'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setMostrarFormularioRecurso(false);
                  setRecursoEditando(null);
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600/20"
              >
                <FaTimes />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1">
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
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-secondary hover:file:bg-accent/80 transition-all"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    required
                  />
                  {archivo && (
                    <p className="text-sm text-accent mt-2">
                      📎 Archivo seleccionado: {archivo.name} ({formatFileSize(archivo.size)})
                    </p>
                  )}
                </div>
              ) : null}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Etiquetas (opcional)</label>
                  <input
                    type="text"
                    value={formData.etiquetas}
                    onChange={(e) => setFormData(prev => ({ ...prev, etiquetas: e.target.value }))}
                    className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                    placeholder="manual, tutorial, urgente"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-accent/20">
                <button
                  type="submit"
                  disabled={procesandoRecurso || (formData.tipo === 'archivo' && !archivo && !recursoEditando)}
                  className="flex-1 bg-gradient-to-r from-accent to-accent/80 text-secondary font-semibold px-6 py-3 rounded-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {procesandoRecurso 
                    ? (recursoEditando ? 'Actualizando...' : 'Creando...') 
                    : (recursoEditando ? 'Actualizar Recurso' : 'Crear Recurso')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormularioRecurso(false);
                    setRecursoEditando(null);
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
        </div>


        {/* Panel Todo el conocimiento */}
        {seccionActiva === 'todo' && (
          <TodoConocimientoPanel notas={notasMD} recursos={recursos} />
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
                            {/* Iconos por tipo de nota */}
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
                             nota.tipo === 'video' ? <FaVideo className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-accent'
                            }`} /> :
                             nota.tipo === 'incidente' ? <FaExclamationTriangle className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-red-400'
                            }`} /> :
                             nota.tipo === 'mantenimiento' ? <FaCog className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-orange-400'
                            }`} /> :
                             nota.tipo === 'reunion' ? <FaUsers className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-blue-400'
                            }`} /> :
                             nota.tipo === 'capacitacion' ? <FaGraduationCap className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-green-400'
                            }`} /> :
                             <FaFileAlt className={`text-sm ${
                              notaSeleccionada?.nombre === nota.nombre 
                                ? temas.find(t => t.id === temaSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                : 'text-accent'
                            }`} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-sm leading-tight">{nota.nombre}</h3>
                              {/* Indicadores para notas diarias */}
                              {nota.date && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                  📅 {nota.date}
                                </span>
                              )}
                              {nota.priority && nota.priority !== 'media' && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  nota.priority === 'alta' || nota.priority === 'critica' 
                                    ? 'bg-red-500/20 text-red-300' 
                                    : 'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {nota.priority === 'critica' ? '🔴' : nota.priority === 'alta' ? '🟠' : '🔵'} {nota.priority}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {nota.descripcion || nota.contenido.slice(0, 100)}...
                            </p>
                            {nota.etiquetas && nota.etiquetas.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {nota.etiquetas.slice(0, 3).map((etiqueta, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                                    #{etiqueta}
                                  </span>
                                ))}
                                {nota.etiquetas.length > 3 && (
                                  <span className="text-xs text-gray-500">+{nota.etiquetas.length - 3}</span>
                                )}
                              </div>
                            )}
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
                    className={`text-left p-6 rounded-lg border transition-all duration-300 hover:shadow-xl hover:shadow-current/20 hover:brightness-110 hover:-translate-y-1 ${tipo.color}`}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de recursos del tipo */}
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="space-y-2">
                    {recursos.filter(recurso => recurso.tipo === tipoRecursoSeleccionado).map((recurso, index) => (
                      <button
                        key={index}
                        onClick={() => setRecursoSeleccionado(recurso)}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                          recursoSeleccionado?.id === recurso.id
                            ? `border-2 ${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.split(' ')[2] || 'border-accent'} ${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color || 'bg-accent/20 text-accent'} shadow-lg`
                            : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            recursoSeleccionado?.id === recurso.id 
                              ? `${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0] || 'bg-accent/30'}`
                              : 'bg-accent/20'
                          }`}>
                            {getIconoTipoRecurso(recurso.tipo, recurso.tipoArchivo)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1 leading-tight">{recurso.titulo}</h3>
                            <p className={`text-xs mb-1 font-medium ${
                              tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                            }`}>
                              {temas.find(t => t.id === recurso.tema)?.nombre}
                            </p>
                            {recurso.tags && recurso.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {recurso.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className={`px-1.5 py-0.5 rounded text-xs ${
                                      tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.replace('text-', 'bg-').replace('border-', 'bg-').split(' ')[0]?.replace('500', '500/20') || 'bg-accent/20'
                                    } ${
                                      tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.split(' ')[1] || 'text-accent'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {recurso.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">+{recurso.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {recurso.descripcion || 'Sin descripción'}
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
                  {recursoSeleccionado ? (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.replace('border-', 'bg-').replace('/30', '/20')}`}>
                            {tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.icono}
                          </div>
                          <h2 className={`text-xl font-bold ${tiposRecursos.find(t => t.id === tipoRecursoSeleccionado)?.color?.split(' ')[1] || 'text-accent'}`}>
                            {recursoSeleccionado.titulo}
                          </h2>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRecursoEditando(recursoSeleccionado);
                              setMostrarFormularioRecurso(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          >
                            <FaEdit className="text-xs" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de eliminar este recurso?')) {
                                eliminarRecurso(recursoSeleccionado.id);
                                setRecursoSeleccionado(null);
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
                        {recursoSeleccionado.descripcion && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                            <p className="text-gray-400">{recursoSeleccionado.descripcion}</p>
                          </div>
                        )}
                        
                        {recursoSeleccionado.url && (
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Enlace</h4>
                            <a
                              href={recursoSeleccionado.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              {recursoSeleccionado.url}
                            </a>
                          </div>
                        )}

                        {recursoSeleccionado.tags.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Etiquetas</h4>
                            <div className="flex flex-wrap gap-2">
                              {recursoSeleccionado.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-accent/20 text-accent rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Tema: {temas.find(t => t.id === recursoSeleccionado.tema)?.nombre}</p>
                          <p>Subido: {new Date(recursoSeleccionado.fechaCarga).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <FaEye className="text-4xl mb-4 mx-auto" />
                        <p>Selecciona un recurso para visualizar su contenido</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FaSearch className="text-accent" />
                      <input
                        type="text"
                        placeholder="Buscar notas..."
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
                      <div className="text-accent">Cargando notas...</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
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

              {/* Panel de detalles */}
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => descargarNota(notaSeleccionada)}
                            className="flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                          >
                            <FaDownload className="text-sm" />
                            Descargar
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('¿Estás seguro de eliminar esta nota?')) {
                                eliminarNota(notaSeleccionada);
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            <FaTrash className="text-sm" />
                            Eliminar
                          </button>
                        </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel de filtros y lista */}
              <div className="lg:col-span-1">
                <div className="bg-secondary rounded-lg p-4">
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FaSearch className="text-accent" />
                      <input
                        type="text"
                        placeholder="Buscar recursos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="flex-1 bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por tipo</label>
                      <select
                        value={filtroTipoRecurso}
                        onChange={(e) => setFiltroTipoRecurso(e.target.value)}
                        className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                      >
                        <option value="">Todos los tipos</option>
                        <option value="archivo">Archivos</option>
                        <option value="url">Enlaces</option>
                        <option value="video">Videos</option>
                        <option value="ia-automatizacion">IA y Automatización</option>
                        <option value="contactos-externos">Contactos y Recursos Externos</option>
                        <option value="plantillas-formularios">Plantillas y Formularios</option>
                      </select>
                    </div>
                    
                    {etiquetasDisponiblesRecursos.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por etiqueta</label>
                        <select
                          value={filtroEtiquetaRecurso}
                          onChange={(e) => setFiltroEtiquetaRecurso(e.target.value)}
                          className="w-full bg-primary/80 backdrop-blur-sm border border-accent/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all h-12"
                        >
                          <option value="">Todas las etiquetas</option>
                          {etiquetasDisponiblesRecursos.map(etiqueta => (
                            <option key={etiqueta} value={etiqueta} className="bg-primary text-white">{etiqueta}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {(busqueda || filtroTipoRecurso || filtroEtiquetaRecurso) && (
                      <button
                        onClick={() => {
                          setBusqueda('');
                          setFiltroTipoRecurso('');
                          setFiltroEtiquetaRecurso('');
                        }}
                        className="w-full px-3 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors text-sm"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>

                  {cargandoRecursos ? (
                    <div className="text-center py-8">
                      <div className="text-accent">Cargando recursos...</div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recursos.filter(recurso => {
                        const matchBusqueda = recurso.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                                             (recurso.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) || false);
                        const matchTipo = !filtroTipoRecurso || recurso.tipo === filtroTipoRecurso;
                        const matchEtiqueta = !filtroEtiquetaRecurso || recurso.tags.includes(filtroEtiquetaRecurso);
                        const matchTema = !temaSeleccionado || recurso.tema === temaSeleccionado;
                        return matchBusqueda && matchTipo && matchEtiqueta && matchTema;
                      }).map((recurso) => (
                        <div
                          key={recurso.id}
                          onClick={() => setRecursoSeleccionado(recurso)}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                            recursoSeleccionado?.id === recurso.id
                              ? 'bg-gradient-to-r from-accent/20 to-accent/10 border border-accent shadow-lg shadow-accent/20'
                              : 'bg-gradient-to-r from-primary to-secondary/50 hover:from-accent/10 hover:to-accent/5 border border-gray-700/50 hover:border-accent/30 shadow-md hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              recursoSeleccionado?.id === recurso.id 
                                ? 'bg-accent/30' 
                                : 'bg-accent/20'
                            }`}>
                              {getIconoTipoRecurso(recurso.tipo, recurso.tipoArchivo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-sm truncate mb-1">{recurso.titulo}</h3>
                              <p className="text-xs text-accent mb-2 font-medium">
                                {temas.find(t => t.id === recurso.tema)?.nombre} • {getTipoRecursoLabel(recurso.tipo, recurso.tipoArchivo)}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {recurso.tamaño && (
                                  <span className="text-xs text-gray-400">
                                    {formatFileSize(recurso.tamaño)}
                                  </span>
                                )}
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
                  {recursoSeleccionado ? (
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-accent mb-2">{recursoSeleccionado.titulo}</h2>
                          {recursoSeleccionado.url && (
                            <a
                              href={recursoSeleccionado.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              {recursoSeleccionado.url}
                            </a>
                          )}
                          {recursoSeleccionado.filePath && (
                            <a
                              href={recursoSeleccionado.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-sm break-all"
                            >
                              {recursoSeleccionado.nombreOriginal || recursoSeleccionado.filePath}
                            </a>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-400">
                              {temas.find(t => t.id === recursoSeleccionado.tema)?.nombre}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-sm text-gray-400">
                              {getTipoRecursoLabel(recursoSeleccionado.tipo, recursoSeleccionado.tipoArchivo)}
                            </span>
                            {recursoSeleccionado.tamaño && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-sm text-gray-400">
                                  {formatFileSize(recursoSeleccionado.tamaño)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRecursoEditando(recursoSeleccionado);
                              setMostrarFormularioRecurso(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                          >
                            <FaEdit className="text-xs" />
                            Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de eliminar este recurso?')) {
                                eliminarRecurso(recursoSeleccionado.id);
                                setRecursoSeleccionado(null);
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
                        {recursoSeleccionado.descripcion && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Descripción</h3>
                            <p className="text-gray-400">{recursoSeleccionado.descripcion}</p>
                          </div>
                        )}

                        {recursoSeleccionado.tags.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Etiquetas</h4>
                            <div className="flex flex-wrap gap-2">
                              {recursoSeleccionado.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-accent/20 text-accent rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Subido: {new Date(recursoSeleccionado.fechaCarga).toLocaleDateString()}</p>
                          {recursoSeleccionado.nombreOriginal && (
                            <p>Archivo original: {recursoSeleccionado.nombreOriginal}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <FaEyeSlash className="text-4xl mb-4 mx-auto" />
                        <p>Selecciona un recurso para ver sus detalles</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
