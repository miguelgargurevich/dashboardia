// lib/config.ts
// Configuración centralizada para URLs del backend

/**
 * Configuración del backend para diferentes entornos
 */
const getBackendConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isServer = typeof window === 'undefined';
  
  // Base URL del backend sin /api
  const baseUrl = isDevelopment 
    ? 'http://localhost:4000' 
    : process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://api.tudominio.com';
  
  return {
    // URL base para requests del cliente (browser)
    clientApiUrl: `${baseUrl}/api`,
    
    // URL base para requests del servidor (API routes)
    serverApiUrl: baseUrl,
    
    // Helper para obtener la URL correcta según el contexto
    getApiUrl: () => isServer ? baseUrl : `${baseUrl}/api`,
    
    // URLs específicas para diferentes servicios
    endpoints: {
      dailyNotes: '/api/daily-notes',
      dailyNotesStats: '/api/daily-notes/stats',
      tickets: '/api/tickets',
      events: '/api/events',
      resources: '/api/recursos'
    }
  };
};

export const config = getBackendConfig();

// Helper para construir URLs completas
export const buildApiUrl = (endpoint: string, isServerSide: boolean = false) => {
  const baseUrl = isServerSide ? config.serverApiUrl : config.clientApiUrl;
  return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
};

// Para usar en componentes del cliente
export const getClientApiUrl = () => config.clientApiUrl;

// Para usar en API routes del servidor
export const getServerApiUrl = () => config.serverApiUrl;
