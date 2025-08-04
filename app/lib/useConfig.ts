import { useState, useEffect } from 'react';
import { 
  FaCalendarAlt,
  FaStickyNote,
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
  FaCheckSquare,
  FaExclamationCircle,
  FaCompass,
  // Iconos para recursos
  FaFile,
  FaFileAlt,
  FaFilePdf,
  FaVideo,
  FaLink,
  FaBook,
  FaAddressBook,
  FaRobot,
} from 'react-icons/fa';

interface ConfigItem {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color: string;
  activo?: boolean;
}

type ConfigType = 'eventos' | 'notas' | 'recursos';

export function useConfig(tipo: ConfigType) {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const endpoints: { [key: string]: string } = {
          eventos: 'tipos-eventos',
          notas: 'tipos-notas',
          recursos: 'tipos-recursos'
        };

        const response = await fetch(`/api/config/${endpoints[tipo]}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          throw new Error(`Error al cargar configuración de ${tipo}`);
        }
      } catch (err) {
        console.error(`Error loading ${tipo} config:`, err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [tipo]);

  return { items, loading, error };
}

export function getIconComponent(iconoValue: string): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  // Mapeo directo de iconos
  const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
    'fa-wrench': FaWrench,
    'fa-graduation-cap': FaGraduationCap,
    'fa-laptop': FaLaptop,
    'fa-users': FaUsers,
    'fa-exclamation-triangle': FaExclamationTriangle,
    'fa-bell': FaBell,
    'fa-calendar-alt': FaCalendarAlt,
    'fa-clipboard-list': FaClipboardList,
    'fa-book': FaBook,
    'fa-compass': FaCompass,
    'fa-sticky-note': FaStickyNote,
    'fa-check-square': FaCheckSquare,
    'fa-bug': FaBug,
    'fa-exclamation-circle': FaExclamationCircle,
    'fa-file-pdf': FaFilePdf,
    'fa-link': FaLink,
    'fa-video': FaVideo,
    'fa-file': FaFile,
    'fa-file-alt': FaFileAlt,
    'fa-address-book': FaAddressBook,
    'fa-robot': FaRobot
  };

  // Buscar por valor exacto
  if (iconMap[iconoValue]) {
    return iconMap[iconoValue] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }

  // Buscar agregando guión si no lo tiene
  const iconWithDash = iconoValue.startsWith('fa-') ? iconoValue : `fa-${iconoValue}`;
  if (iconMap[iconWithDash]) {
    return iconMap[iconWithDash] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }

  // Buscar quitando 'fa-' si lo tiene
  const iconWithFa = iconoValue.replace('fa-', '');
  const iconWithFaAdded = `fa-${iconWithFa}`;
  if (iconMap[iconWithFaAdded]) {
    return iconMap[iconWithFaAdded] as React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }

  // Retornar icono por defecto
  return FaFile as React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function obtenerHexPorTailwind(tailwindColor: string): string {
  if (!tailwindColor) return '#3B82F6';
  
  // Mapeo básico de colores tailwind más comunes a hex
  const colorMap: { [key: string]: string } = {
    'bg-blue-500': '#3B82F6',
    'bg-green-500': '#10B981',
    'bg-red-500': '#EF4444',
    'bg-yellow-500': '#F59E0B',
    'bg-purple-500': '#8B5CF6',
    'bg-pink-500': '#EC4899',
    'bg-indigo-500': '#6366F1',
    'bg-gray-500': '#6B7280',
    'bg-orange-500': '#F97316',
  };

  // Buscar color base en la cadena tailwind
  for (const [key, value] of Object.entries(colorMap)) {
    if (tailwindColor.includes(key)) {
      return value;
    }
  }

  return '#3B82F6'; // Azul por defecto
}

// Hook para obtener icono y color de un tipo específico por nombre
export function useConfigByName(tipo: ConfigType, nombre: string) {
  const { items, loading, error } = useConfig(tipo);
  
  const item = items.find(item => 
    item.nombre.toLowerCase() === nombre.toLowerCase()
  );

  return {
    item,
    loading,
    error,
    icono: item?.icono || 'fa-calendar-alt',
    color: item?.color || 'bg-blue-500/20 text-blue-400 border-blue-400/30',
    IconComponent: getIconComponent(item?.icono || 'fa-calendar-alt'),
    hexColor: obtenerHexPorTailwind(item?.color || 'bg-blue-500')
  };
}

// Hook para obtener toda la configuración de eventos y mapear por tipo de evento
export function useEventosConfig() {
  const { items, loading, error } = useConfig('eventos');
  
  const getEventoConfig = (tipoEvento: string) => {
    const item = items.find(item => 
      item.id === tipoEvento ||
      item.nombre.toLowerCase() === tipoEvento.toLowerCase() ||
      tipoEvento.toLowerCase().includes(item.nombre.toLowerCase())
    );

    return {
      item,
      icono: item?.icono || 'fa-calendar-alt',
      color: item?.color || 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      IconComponent: getIconComponent(item?.icono || 'fa-calendar-alt'),
      hexColor: obtenerHexPorTailwind(item?.color || 'bg-blue-500'),
      nombre: item?.nombre || 'Evento'
    };
  };

  return {
    items,
    loading,
    error,
    getEventoConfig
  };
}

// Hook para obtener toda la configuración de notas y mapear por tipo de nota
export function useNotasConfig() {
  const { items, loading, error } = useConfig('notas');
  
  const getNotaConfig = (tipoNota: string) => {
    const item = items.find(item => 
      item.id === tipoNota ||
      item.nombre.toLowerCase() === tipoNota.toLowerCase() ||
      tipoNota.toLowerCase().includes(item.nombre.toLowerCase())
    );

    return {
      item,
      icono: item?.icono || 'fa-sticky-note',
      color: item?.color || 'bg-green-500/20 text-green-400 border-green-400/30',
      IconComponent: getIconComponent(item?.icono || 'fa-sticky-note'),
      hexColor: obtenerHexPorTailwind(item?.color || 'bg-green-500'),
      nombre: item?.nombre || 'Nota'
    };
  };

  return {
    items,
    loading,
    error,
    getNotaConfig
  };
}

// Hook para obtener toda la configuración de recursos y mapear por tipo de recurso
export function useRecursosConfig() {
  const { items, loading, error } = useConfig('recursos');
  
  const getRecursoConfig = (tipoRecurso: string) => {
    const item = items.find(item => 
      item.id === tipoRecurso ||
      item.nombre.toLowerCase() === tipoRecurso.toLowerCase() ||
      tipoRecurso.toLowerCase().includes(item.nombre.toLowerCase())
    );

    return {
      item,
      icono: item?.icono || 'fa-file',
      color: item?.color || 'bg-purple-500/20 text-purple-400 border-purple-400/30',
      IconComponent: getIconComponent(item?.icono || 'fa-file'),
      hexColor: obtenerHexPorTailwind(item?.color || 'bg-purple-500'),
      nombre: item?.nombre || 'Recurso'
    };
  };

  return {
    items,
    loading,
    error,
    getRecursoConfig
  };
}
