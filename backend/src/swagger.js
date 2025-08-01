const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dashboard IA Soporte API',
      version: '1.0.0',
      description: 'API para el sistema de Dashboard de Soporte con IA',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'miguel.gargurevich@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y autorización'
      },
      {
        name: 'Events',
        description: 'Gestión de eventos del calendario'
      },
      {
        name: 'Resources',
        description: 'Gestión de recursos y archivos'
      },
      {
        name: 'Tickets',
        description: 'Sistema de tickets y soporte'
      },
      {
        name: 'Notes',
        description: 'Gestión de notas diarias y documentos'
      },
      {
        name: 'AI Assistant',
        description: 'Asistente de inteligencia artificial'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Event: {
          type: 'object',
          required: ['title', 'startDate', 'endDate'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único del evento'
            },
            title: {
              type: 'string',
              description: 'Título del evento'
            },
            description: {
              type: 'string',
              description: 'Descripción del evento'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de inicio'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de fin'
            },
            location: {
              type: 'string',
              description: 'Ubicación del evento'
            },
            eventType: {
              type: 'string',
              enum: ['mantenimiento', 'incidente', 'reunion', 'otro'],
              description: 'Tipo de evento'
            },
            recurrencePattern: {
              type: 'string',
              enum: ['ninguno', 'diario', 'semanal', 'mensual', 'anual'],
              description: 'Patrón de recurrencia'
            },
            codigoDana: {
              type: 'string',
              description: 'Código DANA'
            },
            diaEnvio: {
              type: 'string',
              description: 'Día de envío'
            },
            modo: {
              type: 'string',
              description: 'Modo de ejecución'
            },
            nombreNotificacion: {
              type: 'string',
              description: 'Nombre de la notificación'
            },
            query: {
              type: 'string',
              description: 'Query asociado al evento'
            },
            validador: {
              type: 'string',
              description: 'Validador del evento'
            },
            relatedResources: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'IDs de recursos relacionados'
            }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del ticket'
            },
            title: {
              type: 'string',
              description: 'Título del ticket'
            },
            description: {
              type: 'string',
              description: 'Descripción del ticket'
            },
            status: {
              type: 'string',
              enum: ['abierto', 'en_progreso', 'resuelto', 'cerrado'],
              description: 'Estado del ticket'
            },
            priority: {
              type: 'string',
              enum: ['baja', 'media', 'alta', 'critica'],
              description: 'Prioridad del ticket'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        Resource: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del recurso'
            },
            titulo: {
              type: 'string',
              description: 'Título del recurso'
            },
            tipo: {
              type: 'string',
              description: 'Tipo de recurso'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del recurso'
            },
            url: {
              type: 'string',
              description: 'URL del recurso'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tags del recurso'
            },
            fechaCarga: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de carga'
            }
          }
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la nota'
            },
            titulo: {
              type: 'string',
              description: 'Título de la nota'
            },
            contenido: {
              type: 'string',
              description: 'Contenido de la nota'
            },
            fecha: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            tipo: {
              type: 'string',
              description: 'Tipo de nota'
            },
            prioridad: {
              type: 'string',
              enum: ['Baja', 'Media', 'Alta', 'Crítica'],
              description: 'Prioridad de la nota'
            },
            estado: {
              type: 'string',
              enum: ['Pendiente', 'En Progreso', 'Completada', 'Cancelada'],
              description: 'Estado de la nota'
            },
            userId: {
              type: 'string',
              description: 'ID del usuario propietario'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error'
            },
            details: {
              type: 'string',
              description: 'Detalles del error'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
