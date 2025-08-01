// Configuración de entorno para Dashboard IA
// Este archivo maneja automáticamente las variables según NODE_ENV

const config = {
  // Configuración por defecto para desarrollo
  development: {
    database: process.env.DATABASE_URL_DEV,
    port: process.env.PORT_DEV || 4000,
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    swagger: {
      enabled: true,
      host: "localhost:4000"
    },
    logging: {
      level: "debug",
      requests: true
    }
  },

  // Configuración para producción
  production: {
    database: process.env.DATABASE_URL_PROD || process.env.DATABASE_URL,
    port: process.env.PORT || 4000,
    cors: {
      origin: [
        // Vercel deployments
        "https://dashboard-ia-v3.vercel.app", 
        "https://dashboardia-git-main-miguel-gargurevichs-projects.vercel.app",
        "https://dashboardia.vercel.app",
        // Render backend (para comunicación interna)
        "https://dashboardia.onrender.com",
        // Desarrollo local
        "http://localhost:3000",
        "http://localhost:3001"
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    swagger: {
      enabled: false, // Deshabilitado en producción por seguridad
      host: "dashboardia.onrender.com"
    },
    logging: {
      level: "error",
      requests: false
    }
  },

  // Configuración para testing
  test: {
    database: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_DEV,
    port: process.env.PORT_TEST || 4001,
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true
    },
    swagger: {
      enabled: false
    },
    logging: {
      level: "silent",
      requests: false
    }
  }
};

// Obtener la configuración actual basada en NODE_ENV
const currentEnv = process.env.NODE_ENV || 'development';
const currentConfig = config[currentEnv];

// Configuración compartida (disponible en todos los entornos)
const sharedConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '30d'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY
  },
  supabase: {
    endpoint: process.env.SUPABASE_S3_ENDPOINT,
    region: process.env.SUPABASE_S3_REGION,
    bucket: process.env.SUPABASE_S3_BUCKET,
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
    apiKey: process.env.SUPABASE_S3_API_KEY
  }
};

// Función helper para logs condicionales
const logger = {
  debug: (message, data) => {
    if (currentConfig.logging.level === 'debug') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  error: (message, error) => {
    if (currentConfig.logging.level !== 'silent') {
      console.error(`[ERROR] ${message}`, error || '');
    }
  },
  info: (message, data) => {
    if (currentConfig.logging.level === 'debug') {
      console.log(`[INFO] ${message}`, data || '');
    }
  }
};

// Función para obtener la URL de la base de datos correcta
const getDatabaseUrl = () => {
  const url = currentConfig.database;
  if (!url) {
    logger.error(`No se encontró DATABASE_URL para el entorno: ${currentEnv}`);
    process.exit(1);
  }
  return url;
};

// Función para verificar variables de entorno críticas
const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'GEMINI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error(`Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (!currentConfig.database) {
    logger.error(`URL de base de datos no configurada para entorno: ${currentEnv}`);
    process.exit(1);
  }

  logger.info(`Entorno validado: ${currentEnv}`);
};

module.exports = {
  env: currentEnv,
  config: currentConfig,
  shared: sharedConfig,
  logger,
  getDatabaseUrl,
  validateEnvironment,
  
  // Helpers útiles
  isDevelopment: () => currentEnv === 'development',
  isProduction: () => currentEnv === 'production',
  isTest: () => currentEnv === 'test'
};
