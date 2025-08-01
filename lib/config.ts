// lib/config.ts
// Configuración centralizada para URLs del backend

/**
 * Configuración del backend usando variables de entorno
 */
const getBackendConfig = () => {
  // URL base del backend desde variable de entorno
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  
  return {
    // URL base del backend
    baseUrl: backendUrl,
    
    // URL para API calls desde el cliente
    apiUrl: backendUrl,
    
    // Endpoints específicos (ya incluyen /api)
    endpoints: {
      // Auth
      login: `${backendUrl}/api/login`,
      signup: `${backendUrl}/api/signup`,
      
      // Events
      events: `${backendUrl}/api/events`,
      eventsUpcoming: `${backendUrl}/api/events/upcoming`,
      eventsCalendar: `${backendUrl}/api/events/calendar`,
      
      // Tickets
      tickets: `${backendUrl}/api/tickets`,
      ticketsStats: `${backendUrl}/api/tickets/stats`,
      ticketsPriority: `${backendUrl}/api/tickets/por-prioridad`,
      ticketsTrend: `${backendUrl}/api/tickets/tendencia-semanal`,
      
      // Resources
      resources: `${backendUrl}/api/resources`,
      resourcesRecent: `${backendUrl}/api/resources/recent`,
      
      // Notes
      dailyNotes: `${backendUrl}/api/daily-notes`,
      dailyNotesStats: `${backendUrl}/api/daily-notes/stats`,
      dailyNotesSearch: `${backendUrl}/api/daily-notes/search`,
      
      // AI Assistant
      assistant: `${backendUrl}/api/assistant`
    }
  };
};

export const config = getBackendConfig();

// Helper para construir URLs de endpoints
export const getApiEndpoint = (endpoint: string) => {
  const baseUrl = config.apiUrl;
  // Si el endpoint ya incluye la URL completa, retornarlo
  if (endpoint.startsWith('http')) return endpoint;
  // Si el endpoint ya incluye /api, agregar solo la base
  if (endpoint.startsWith('/api/')) return `${baseUrl}${endpoint}`;
  // Si no incluye /api, agregarlo
  return `${baseUrl}/api/${endpoint}`;
};

// Para backward compatibility
export const buildApiUrl = getApiEndpoint;
export const getClientApiUrl = () => config.apiUrl;
export const getServerApiUrl = () => config.baseUrl;
