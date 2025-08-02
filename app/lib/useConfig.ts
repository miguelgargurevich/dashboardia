import { useState, useEffect } from 'react';
import { 
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
  // Iconos para temas
  FaFolder,
  FaTag,
  FaStar,
  FaBookmark,
  FaCloud
} from 'react-icons/fa';

interface ConfigItem {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color: string;
  activo?: boolean;
}

type ConfigType = 'eventos' | 'notas' | 'recursos' | 'temas';

// Mapeo de iconos React
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
  // Temas
  'fa-layer-group': FaLayerGroup,
  'fa-folder': FaFolder,
  'fa-tag': FaTag,
  'fa-star': FaStar,
  'fa-bookmark': FaBookmark,
  'fa-cloud': FaCloud,
};

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
          recursos: 'tipos-recursos',
          temas: 'temas'
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

export function getIconComponent(iconoValue: string): React.ComponentType {
  return iconMap[iconoValue] || FaCalendarAlt;
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
      item.nombre.toLowerCase() === tipoEvento.toLowerCase() ||
      tipoEvento.toLowerCase().includes(item.nombre.toLowerCase())
    );

    return {
      item,
      icono: item?.icono || 'fa-calendar-alt',
      color: item?.color || 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      IconComponent: getIconComponent(item?.icono || 'fa-calendar-alt'),
      hexColor: obtenerHexPorTailwind(item?.color || 'bg-blue-500')
    };
  };

  return {
    items,
    loading,
    error,
    getEventoConfig
  };
}
