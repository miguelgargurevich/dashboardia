
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth.js';
import S3Service from './services/S3Service.js';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB límite
  }
});

// Instancia del servicio S3
const s3Service = new S3Service();

// Proteger solo rutas privadas, NO /api/assistant
// router.use(requireAuth); // Comentado para proteger solo rutas privadas

// System prompt para el asistente IA
const systemPrompt = `
Eres un asistente experto en soporte técnico y gestión de sistemas. Tu objetivo es ayudar a los usuarios a administrar su dashboard de soporte, crear contenido, gestionar recursos y resolver consultas técnicas.

CAPACIDADES PRINCIPALES:
- Crear y gestionar notas organizadas por tipos
- Subir y organizar recursos (documentos, URLs, videos)
- Consultar eventos y calendario
- Proporcionar soporte técnico especializado
- Automatizar tareas administrativas

CONTEXTO DEL SISTEMA:
- Dashboard de soporte con gestión de eventos, recursos y conocimiento
- Usuarios pueden crear notas categorizadas por tipos
- Sistema de etiquetas para organización
- Calendario integrado para eventos
- Base de datos de recursos compartidos

INSTRUCCIONES ESPECIALES PARA CREACIÓN DE NOTAS:
- Cuando el usuario solicite crear una nota, confirma que la nota fue creada exitosamente
- Si el usuario solo dice "crear nota" sin más contexto, pide que especifique el contenido
- Extrae automáticamente el tipo y categoría de la solicitud del usuario
- Genera títulos descriptivos basados en el contenido proporcionado
- Usa un tono confirmativo y positivo cuando las acciones se completen

INSTRUCCIONES GENERALES:
- Responde siempre en español
- Sé conciso pero completo en tus respuestas
- Cuando sugieras crear contenido, proporciona estructura clara
- Para temas técnicos, incluye pasos específicos
- Mantén un tono profesional pero amigable
- Si no tienes información específica, indícalo claramente
- Evita bucles de preguntas repetitivas
`;


// Recursos recientes (archivos, notas, videos)
/**
 * @swagger
 * /api/resources/recent:
 *   get:
 *     summary: Obtener recursos recientes
 *     description: Retorna una lista de recursos ordenados por fecha de carga descendente
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número máximo de recursos a retornar
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de recursos a omitir para paginación
 *     responses:
 *       200:
 *         description: Lista de recursos recientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/resources/recent?limit=10&skip=0
router.get('/api/resources/recent', requireAuth, async (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
  const skip = Math.max(0, parseInt(req.query.skip) || 0);
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { fechaCarga: 'desc' },
      take: limit,
      skip
    });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recursos recientes', details: err.message });
  }
});

// Recursos por tipo
// GET /api/resources?tipo=video|nota|archivo&limit=10&skip=0
router.get('/api/resources', requireAuth, async (req, res) => {
  const { tipo, categoria, page = 1, limit = 50 } = req.query;
  const limitNum = Math.max(1, Math.min(parseInt(limit) || 50, 100));
  const skip = (Math.max(1, parseInt(page)) - 1) * limitNum;
  
  try {
    const where = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    
    const resources = await prisma.resource.findMany({ 
      where, 
      orderBy: { fechaCarga: 'desc' },
      take: limitNum, 
      skip 
    });
    
    const total = await prisma.resource.count({ where });
    
    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recursos', details: err.message });
  }
});

// Crear nuevo recurso
// POST /api/resources
router.post('/api/resources', requireAuth, async (req, res) => {
  try {
    const {
      tipo,
      titulo,
      descripcion,
      url,
      filePath,
      tags = [],
      categoria
    } = req.body;

    // Validaciones básicas
    if (!tipo || !titulo) {
      return res.status(400).json({ 
        error: 'Campos requeridos: tipo, titulo' 
      });
    }

    const nuevoRecurso = await prisma.resource.create({
      data: {
        tipo,
        titulo,
        descripcion,
        url,
        filePath,
        tags,
        categoria: categoria || 'general',
        fechaCarga: new Date()
      }
    });

    res.status(201).json(nuevoRecurso);
  } catch (err) {
    res.status(500).json({ error: 'Error creando recurso', details: err.message });
  }
});

// Obtener recurso por ID
// GET /api/resources/:id
router.get('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await prisma.resource.findUnique({
      where: { id }
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recurso', details: err.message });
  }
});

// Actualizar recurso
// PUT /api/resources/:id
router.put('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      titulo,
      descripcion,
      url,
      filePath,
      tags,
      categoria
    } = req.body;

    const recursoActualizado = await prisma.resource.update({
      where: { id },
      data: {
        tipo,
        titulo,
        descripcion,
        url,
        filePath,
        tags,
        categoria
      }
    });

    res.json(recursoActualizado);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    res.status(500).json({ error: 'Error actualizando recurso', details: err.message });
  }
});

// Eliminar recurso
// DELETE /api/resources/:id
router.delete('/api/resources/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el recurso para ver si tiene archivo en S3
    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Eliminar referencia en notas
    await prisma.note.updateMany({
      where: {
        relatedResources: {
          has: id
        }
      },
      data: {
        relatedResources: {
          set: prisma.raw('array_remove("relatedResources", $1)', id)
        }
      }
    });

    // Eliminar referencia en eventos
    await prisma.event.updateMany({
      where: {
        relatedResources: {
          has: id
        }
      },
      data: {
        relatedResources: {
          set: prisma.raw('array_remove("relatedResources", $1)', id)
        }
      }
    });

    // Si tiene archivo en S3, eliminarlo
    if (resource.filePath && resource.filePath.includes('amazonaws.com')) {
      try {
        // Extraer key de la URL
        const url = new URL(resource.filePath);
        const key = url.pathname.substring(1); // Remover el primer "/"
        await s3Service.deleteFile(key);
      } catch (s3Error) {
        console.error('Error eliminando archivo de S3:', s3Error);
        // Continuar con la eliminación del registro aunque falle S3
      }
    }

    await prisma.resource.delete({
      where: { id }
    });

    res.json({ message: 'Recurso eliminado correctamente' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    res.status(500).json({ error: 'Error eliminando recurso', details: err.message });
  }
});

// ============================================
// RUTAS DE ALMACENAMIENTO S3 PARA RECURSOS
// ============================================

/**
 * @swagger
 * /api/resources/upload:
 *   post:
 *     summary: Subir archivo a S3 y crear recurso
 *     description: Sube un archivo a S3 y crea el registro correspondiente en la base de datos
 *     tags: [Resources, S3]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - titulo
 *               - categoria
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *                 description: Categoría del recurso (recursos, notas, eventos)
 *               subcategoria:
 *                 type: string
 *                 description: Subcategoría opcional
 *               tags:
 *                 type: string
 *                 description: Tags separados por comas
 *     responses:
 *       201:
 *         description: Archivo subido y recurso creado exitosamente
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error del servidor
 */
router.post('/api/resources/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { titulo, descripcion, categoria, subcategoria, tags } = req.body;

    // Validaciones
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
    
    if (!titulo || !categoria) {
      return res.status(400).json({ error: 'Título y categoría son requeridos' });
    }

    // Validar tipo y tamaño de archivo
    if (!s3Service.isAllowedFileType(file.originalname)) {
      return res.status(400).json({ error: 'Tipo de archivo no permitido' });
    }

    if (!s3Service.isAllowedFileSize(file.size)) {
      return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 100MB)' });
    }

    // Generar clave para S3
    const s3Key = s3Service.generateS3Key(file.originalname, categoria, subcategoria);

    // Subir archivo a S3
    const uploadResult = await s3Service.uploadFile(
      file.buffer,
      s3Key,
      file.mimetype,
      {
        titulo,
        categoria,
        originalName: file.originalname
      }
    );

    // Crear registro en la base de datos
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    const nuevoRecurso = await prisma.resource.create({
      data: {
        tipo: 'archivo',
        titulo,
        descripcion: descripcion || '',
        filePath: uploadResult.url,
        tags: tagsArray,
        categoria: categoria || 'general',
        fechaCarga: new Date()
      }
    });

    res.status(201).json({
      success: true,
      recurso: nuevoRecurso,
      s3: {
        key: uploadResult.key,
        url: uploadResult.url,
        size: uploadResult.size
      }
    });

  } catch (error) {
    console.error('Error en upload de recurso:', error);
    res.status(500).json({ error: 'Error subiendo archivo', details: error.message });
  }
});

/**
 * @swagger
 * /api/resources/download/{key}:
 *   get:
 *     summary: Obtener URL de descarga firmada
 *     description: Genera una URL firmada para descargar un archivo de S3
 *     tags: [Resources, S3]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Clave del archivo en S3
 *       - in: query
 *         name: expires
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: Tiempo de expiración en segundos
 *     responses:
 *       200:
 *         description: URL de descarga generada
 *       404:
 *         description: Archivo no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/api/resources/download/:key(*)', requireAuth, async (req, res) => {
  try {
    const key = req.params.key;
    const expires = parseInt(req.query.expires) || 3600;

    console.log('[DOWNLOAD] Key recibido:', key);

    // Verificar que el archivo existe y obtener info
    const fileInfo = await s3Service.getFileInfo(key);

    // Generar URL firmada
    const downloadUrl = await s3Service.getSignedDownloadUrl(key, expires);

    console.log('[DOWNLOAD] URL firmada generada:', downloadUrl);

    res.json({
      success: true,
      downloadUrl,
      fileInfo,
      expiresIn: expires
    });

  } catch (error) {
    console.error('Error generando URL de descarga:', error);
    if (error.message.includes('NoSuchKey')) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    res.status(500).json({ error: 'Error generando URL de descarga', details: error.message });
  }
});

/**
 * @swagger
 * /api/resources/files:
 *   get:
 *     summary: Listar archivos por categoría
 *     description: Obtiene una lista de archivos almacenados en S3 por categoría
 *     tags: [Resources, S3]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *         description: Categoría de archivos a listar
 *       - in: query
 *         name: subcategoria
 *         schema:
 *           type: string
 *         description: Subcategoría opcional
 *     responses:
 *       200:
 *         description: Lista de archivos
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error del servidor
 */
router.get('/api/resources/files', requireAuth, async (req, res) => {
  try {
    const { categoria, subcategoria } = req.query;

    if (!categoria) {
      return res.status(400).json({ error: 'Categoría es requerida' });
    }

    const files = await s3Service.listFiles(categoria, subcategoria);

    res.json({
      success: true,
      files,
      count: files.length
    });

  } catch (error) {
    console.error('Error listando archivos:', error);
    res.status(500).json({ error: 'Error listando archivos', details: error.message });
  }
});

/**
 * @swagger
 * /api/resources/s3/delete:
 *   delete:
 *     summary: Eliminar archivo de S3
 *     description: Elimina un archivo específico de S3 usando su clave
 *     tags: [Resources, S3]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: Clave del archivo en S3
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *       400:
 *         description: Clave no proporcionada
 *       500:
 *         description: Error del servidor
 */
router.delete('/api/resources/s3/delete', requireAuth, async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Clave del archivo es requerida' });
    }

    await s3Service.deleteFile(key);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente de S3',
      key
    });

  } catch (error) {
    console.error('Error eliminando archivo de S3:', error);
    res.status(500).json({ error: 'Error eliminando archivo', details: error.message });
  }
});

// Próximos eventos
/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Obtener próximos eventos
 *     description: Retorna una lista de eventos futuros ordenados por fecha de inicio
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Número máximo de eventos a retornar
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Número de eventos a omitir para paginación
 *     responses:
 *       200:
 *         description: Lista de próximos eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/events/upcoming?limit=5&skip=0
router.get('/api/events/upcoming', async (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 5, 50));
  const skip = Math.max(0, parseInt(req.query.skip) || 0);
  const now = new Date();
  try {
    const events = await prisma.event.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      take: limit,
      skip,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        eventType: true,
        recurrencePattern: true
      }
    });
    res.json(events);
  } catch (err) {
    console.error('Error en /api/events/upcoming:', err);
    res.status(500).json({ error: 'Error obteniendo próximos eventos', details: err.message });
  }
});

// Eventos para calendario
/**
 * @swagger
 * /api/events/calendar:
 *   get:
 *     summary: Obtener eventos para el calendario
 *     description: Retorna eventos filtrados por mes para mostrar en el calendario
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: '^\\d{4}-\\d{2}$'
 *           example: '2025-08'
 *         description: Mes en formato YYYY-MM para filtrar eventos
 *     responses:
 *       200:
 *         description: Lista de eventos del mes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/events/calendar?month=YYYY-MM
router.get('/api/events/calendar', async (req, res) => {
  const month = req.query.month;
  try {
    let start, end;
    if (month) {
      start = new Date(month + '-01T00:00:00');
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    } else {
      // Si no se especifica mes, usar el mes actual
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: start, lt: end }
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        eventType: true,
        recurrencePattern: true,
        modo: true,
        validador: true,
        codigoDana: true,
        diaEnvio: true,
        relatedResources: true
      }
    });
    // Asegurar que todos los campos extendidos existan aunque sean null
    const eventsWithDefaults = events.map(ev => ({
      ...ev,
      modo: ev.modo ?? '',
      validador: ev.validador ?? '',
      codigoDana: ev.codigoDana ?? '',
      diaEnvio: ev.diaEnvio ?? '',
      relatedResources: ev.relatedResources ?? []
    }));
    res.json(eventsWithDefaults);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo eventos para calendario', details: err.message });
  }
});

// Detalles de evento
/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Obtener detalles de un evento específico
 *     description: Retorna los detalles completos de un evento incluyendo recursos relacionados
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del evento
 *     responses:
 *       200:
 *         description: Detalles del evento
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Event'
 *                 - type: object
 *                   properties:
 *                     recursos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Evento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/events/:id
router.get('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const event = await prisma.event.findUnique({
      where: { id }
    });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    
    res.json(event);
  } catch (err) {
    console.error('Error en GET /api/events/:id:', err);
    res.status(500).json({ error: 'Error obteniendo detalles de evento', details: err.message });
  }
});

// GET /api/events - Listar todos los eventos
router.get('/api/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        eventType: true,
        recurrencePattern: true
      }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo eventos', details: err.message });
  }
});

// POST /api/events - Crear evento
router.post('/api/events', async (req, res) => {
  try {
    const event = await prisma.event.create({
      data: req.body,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        eventType: true,
        recurrencePattern: true
      }
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Error creando evento', details: err.message });
  }
});

// PUT /api/events/:id - Actualizar evento
router.put('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const event = await prisma.event.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        createdAt: true,
        eventType: true,
        recurrencePattern: true
      }
    });
    res.json(event);
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.status(500).json({ error: 'Error actualizando evento', details: err.message });
    }
  }
});

// DELETE /api/events/:id - Eliminar evento
router.delete('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.event.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (err) {
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.status(500).json({ error: 'Error eliminando evento', details: err.message });
    }
  }
});

router.post('/api/assistant', async (req, res) => {
  try {
    // LOG de depuración
    // console.log('--- [IA CHAT] Body recibido:', req.body);
    // console.log('--- [IA CHAT] Headers:', req.headers);
    const GEMINI_MODEL = 'gemini-2.5-pro';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: { message: 'La clave de API de IA no está configurada en el servidor. Por favor, contacta al administrador.' } });
    }

    let message = '';
    let context = '';
    let conversationContext = '';
    if (req.body) {
      if (req.body.messages && Array.isArray(req.body.messages)) {
        // Usar el último mensaje como prompt
        const lastMessage = req.body.messages[req.body.messages.length - 1];
        message = lastMessage.content || '';
        // Si hay contexto previo, lo puedes concatenar aquí
        context = req.body.messages.slice(0, -1).map(m => m.content).join('\n');
        conversationContext = context;
      } else {
        message = req.body.message || '';
        context = req.body.context || '';
        conversationContext = req.body.conversationContext || '';
      }
    }
    if (!message) return res.status(400).json({ error: { message: 'El mensaje es obligatorio.' } });

    // Usar el prompt importado
    if (!systemPrompt) {
      return res.status(500).json({ error: 'No se pudo cargar el systemPrompt.' });
    }

    let enhancedPrompt = `${systemPrompt}\n`;
    if (conversationContext) enhancedPrompt += `CONVERSACIÓN PREVIA:\n${conversationContext}\n`;
    enhancedPrompt += `\nMENSAJE DEL USUARIO:\n${message}\n`;

    const body = {
      contents: [
        { role: 'user', parts: [{ text: enhancedPrompt }] }
      ]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response || typeof data !== 'object') {
      return res.status(503).json({ error: {
        code: 503,
        message: 'El servidor de IA no está disponible actualmente. Por favor, asegúrate de que el backend esté en funcionamiento o intenta más tarde.'
      }});
    }
    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: {
          code: 429,
          message: 'La IA está temporalmente saturada o se ha superado la cuota gratuita. Por favor, intenta nuevamente en unos minutos o contáctanos si el problema persiste.'
        }});
      }
      if (response.status === 0 || !response.status) {
        return res.status(503).json({ error: {
          code: 503,
          message: 'No se pudo conectar con el servicio de IA. Por favor, revisa tu conexión o intenta más tarde.'
        }});
      }
      if (data && typeof data === 'object' && 'error' in data && data.error && data.error.message) {
        return res.status(response.status).json({ error: {
          code: response.status,
          message: data.error.message
        }});
      }
      return res.status(response.status).json({ error: {
        code: response.status,
        message: 'El servidor de IA no pudo responder correctamente. Por favor, intenta de nuevo más tarde o contacta soporte si el problema persiste.'
      }});
    }

    let text = '';
    if (data && typeof data === 'object' && 'candidates' in data && Array.isArray(data.candidates)) {
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    text = text.replace(/€(\d+)/g, '$$$1 USD');
    if (!text.trim()) {
      return res.status(503).json({ error: {
        code: 503,
        message: 'El servidor de IA no está disponible actualmente. Por favor, intenta de nuevo más tarde.'
      }});
    }
    return res.status(200).json({ reply: text });
  } catch {
    return res.status(503).json({ error: {
      code: 503,
      message: 'El servidor de IA no está disponible actualmente. Por favor, asegúrate de que el backend esté en funcionamiento o intenta más tarde.'
    }});
  }
});

// =============================================
// ENDPOINTS PARA DASHBOARD ESTADÍSTICO
// =============================================

router.get('/api/eventos/estadisticas-mensuales', requireAuth, async (req, res) => {
  try {
    const ahora = new Date();
    const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    
    const eventos = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: hace6Meses
        }
      },
      select: {
        createdAt: true,
        fechaEvento: true,
        estado: true
      }
    });
    
    // Agrupar por mes
    const meses = [];
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });
      meses.unshift({
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        eventos_creados: 0,
        eventos_completados: 0
      });
    }
    
    eventos.forEach(evento => {
      const mes = evento.createdAt.getMonth();
      const año = evento.createdAt.getFullYear();
      const mesIndex = (año - hace6Meses.getFullYear()) * 12 + (mes - hace6Meses.getMonth());
      
      if (mesIndex >= 0 && mesIndex < 6) {
        meses[mesIndex].eventos_creados++;
        
        // Si el evento está completado o la fecha ya pasó
        if (evento.estado === 'completado' || (evento.fechaEvento && evento.fechaEvento < ahora)) {
          meses[mesIndex].eventos_completados++;
        }
      }
    });
    
    res.json(meses);
  } catch (error) {
    console.error('Error obteniendo estadísticas mensuales de eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/api/daily-notes', requireAuth, async (req, res) => {
  try {
    const { month, date } = req.query;
    let whereClause = {
      date: { not: null } // Filtrar solo notas que tienen fecha (notas diarias)
    };
    
    if (date) {
      whereClause.date = date;
    } else if (month) {
      whereClause.date = {
        startsWith: month // YYYY-MM
      };
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error obteniendo notas diarias (legacy):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/daily-notes - Crear nueva nota diaria
router.post('/api/daily-notes', requireAuth, async (req, res) => {
  try {
    const {
      date,
      title,
      content,
      priority = 'media',
      status = 'pendiente',
      type = 'incidente',
      tags = [],
      relatedResources = [],
      userId
    } = req.body;
    
    // Validaciones básicas
    if (!date || !title || !content) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: date, title, content' 
      });
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
      });
    }
    
    const note = await prisma.note.create({
      data: {
        date,
        title,
        content,
        priority,
        status,
        tipo: type, // Mapear 'type' a 'tipo' del modelo unificado
        tags,
        relatedResources,
        userId
      }
    });
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creando nota diaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/daily-notes/:id - Actualizar nota diaria
router.put('/api/daily-notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      priority,
      status,
      type,
      tags,
      relatedResources,
      userId
    } = req.body;
    
    // Verificar que la nota existe
    const existingNote = await prisma.note.findFirst({
      where: { 
        id,
        date: { not: null } // Solo permitir actualizar notas diarias (que tienen fecha)
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        priority,
        status,
        tipo: type, // Mapear 'type' a 'tipo'
        tags,
        relatedResources,
        userId,
        updatedAt: new Date()
      }
    });
    
    res.json(updatedNote);
  } catch (error) {
    console.error('Error actualizando nota diaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/daily-notes/:id - Eliminar nota diaria
router.delete('/api/daily-notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la nota existe y es una nota diaria
    const existingNote = await prisma.note.findFirst({
      where: { 
        id,
        date: { not: null } // Solo permitir eliminar notas diarias (que tienen fecha)
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    await prisma.note.delete({
      where: { id }
    });
    
    res.json({ message: 'Nota eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando nota diaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/daily-notes/stats - Obtener estadísticas de notas diarias
/**
 * @swagger
 * /api/daily-notes/stats:
 *   get:
 *     summary: Estadísticas de notas diarias
 *     description: Obtiene estadísticas agregadas de las notas diarias del usuario
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de notas diarias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalNotes:
 *                   type: integer
 *                   description: Total de notas creadas
 *                 notesThisWeek:
 *                   type: integer
 *                   description: Notas creadas esta semana
 *                 notesThisMonth:
 *                   type: integer
 *                   description: Notas creadas este mes
 *                 notesByType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 notesByPriority:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       prioridad:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 notesByStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       estado:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/daily-notes/stats', requireAuth, async (req, res) => {
  try {
    const { month } = req.query;
    let whereClause = {
      date: { not: null } // Solo estadísticas de notas diarias (que tienen fecha)
    };
    
    if (month) {
      whereClause.date = {
        startsWith: month // YYYY-MM
      };
    }
    
    // Obtener todas las notas del período
    const notes = await prisma.note.findMany({
      where: whereClause
    });
    
    // Agrupar estadísticas por día
    const statsByDay = {};
    
    notes.forEach(note => {
      if (!statsByDay[note.date]) {
        statsByDay[note.date] = {
          totalNotes: 0,
          completedTasks: 0,
          pendingTasks: 0,
          highPriorityTasks: 0,
          incidents: 0,
          notesTypes: {
            incidente: 0,
            mantenimiento: 0,
            reunion: 0,
            capacitacion: 0,
            otro: 0
          },
          priorities: {
            baja: 0,
            media: 0,
            alta: 0,
            critica: 0
          },
          statuses: {
            pendiente: 0,
            'en-progreso': 0,
            completado: 0,
            cancelado: 0
          }
        };
      }
      
      const dayStats = statsByDay[note.date];
      
      dayStats.totalNotes++;
      
      // Contadores por estado
      if (note.status === 'completado') {
        dayStats.completedTasks++;
      } else if (note.status === 'pendiente') {
        dayStats.pendingTasks++;
      }
      
      // Contadores por prioridad
      if (note.priority === 'alta' || note.priority === 'critica') {
        dayStats.highPriorityTasks++;
      }
      
      // Contadores por tipo - usar 'tipo' en lugar de 'type'
      if (note.tipo === 'incidente') {
        dayStats.incidents++;
      }
      
      // Contadores detallados - usar 'tipo' en lugar de 'type'
      if (dayStats.notesTypes[note.tipo] !== undefined) {
        dayStats.notesTypes[note.tipo]++;
      }

      if (dayStats.priorities[note.priority] !== undefined) {
        dayStats.priorities[note.priority]++;
      }
      
      if (dayStats.statuses[note.status] !== undefined) {
        dayStats.statuses[note.status]++;
      }
    });
    
    res.json(statsByDay);
  } catch (error) {
    console.error('Error obteniendo estadísticas de notas diarias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/daily-notes/search - Búsqueda avanzada de notas diarias
/**
 * @swagger
 * /api/daily-notes/search:
 *   get:
 *     summary: Buscar notas diarias
 *     description: Busca notas diarias por título o contenido
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de nota
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       titulo:
 *                         type: string
 *                       contenido:
 *                         type: string
 *                       fecha:
 *                         type: string
 *                         format: date-time
 *                       tipo:
 *                         type: string
 *                       prioridad:
 *                         type: string
 *                       estado:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResults:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       400:
 *         description: Parámetro de búsqueda requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/daily-notes/search', requireAuth, async (req, res) => {
  try {
    const { 
      q, // término de búsqueda
      priority,
      status,
      type,
      startDate,
      endDate,
      tags
    } = req.query;
    
    let whereClause = {
      date: { not: null } // Solo buscar en notas diarias (que tienen fecha)
    };
    
    // Búsqueda por texto
    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ];
    }
    
    // Filtros específicos
    if (priority) {
      whereClause.priority = priority;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.tipo = type; // Usar 'tipo' en lugar de 'type'
    }
    
    // Filtro por rango de fechas
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = startDate;
      }
      if (endDate) {
        whereClause.date.lte = endDate;
      }
    }
    
    // Filtro por tags
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      whereClause.tags = {
        hasSome: tagList
      };
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error buscando notas diarias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS PARA NOTAS GENERALES (REEMPLAZA ARCHIVOS .MD) =====

// GET /api/notes - Obtener todas las notas
router.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const { tipo, status, search, month } = req.query;
    let whereClause = {};
    
    if (tipo) {
      whereClause.tipo = tipo;
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Filtro por mes para el calendario
    if (month) {
      whereClause.date = {
        startsWith: month // Para fechas en formato YYYY-MM-DD
      };
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/notes/:id - Obtener una nota específica
router.get('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({
      where: { id }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error obteniendo nota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/notes - Crear nueva nota
router.post('/api/notes', requireAuth, async (req, res) => {
  try {
    console.log('🟢 Backend: Creating note with body:', req.body);
    console.log('🔑 Backend: Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('👤 Backend: Authenticated user:', req.user);
    
    const {
      title,
      content,
      tipo = 'nota',
      tags = [],
      context,
      keyPoints = [],
      status = 'activo',
      userId,
      date,
      priority,
      relatedResources = []
    } = req.body;
    
    // Debug específico del campo date
    console.log('🔍 Backend: date field received:', date);
    console.log('🔍 Backend: date type:', typeof date);
    console.log('🔍 Backend: date value details:', JSON.stringify({ date }));
    
    // Validaciones básicas
    if (!title || !content) {
      console.log('❌ Backend: Missing required fields');
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: title, content' 
      });
    }
    
    console.log('🚀 Backend: Creating note in database...');
    const note = await prisma.note.create({
      data: {
        title,
        content,
        tipo,
        tags,
        context,
        keyPoints,
        status,
        userId,
        date,
        priority,
        relatedResources
      }
    });
    
    console.log('✅ Backend: Note created successfully:', note);
    res.status(201).json(note);
  } catch (error) {
    console.error('❌ Backend: Error creating note:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/notes/:id - Actualizar nota
router.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      tipo,
      tags,
      context,
      keyPoints,
      status,
      date,
      priority,
      relatedResources
    } = req.body;
    
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    const note = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        tipo,
        tags,
        context,
        keyPoints,
        status,
        date,
        priority,
        relatedResources,
        updatedAt: new Date()
      }
    });
    
    res.json(note);
  } catch (error) {
    console.error('Error actualizando nota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/notes/:id - Eliminar nota
router.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    await prisma.note.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Nota eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando nota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/notes/stats - Estadísticas de notas (incluye actividades diarias)
router.get('/api/notes/stats', requireAuth, async (req, res) => {
  try {
    const { month, tipo } = req.query;
    let whereClause = {};
    
    // Filtrar por tipo si se especifica
    if (tipo) {
      whereClause.tipo = tipo;
    }
    
    if (month) {
      whereClause.date = {
        startsWith: month // YYYY-MM
      };
    }
    
    // Obtener todas las notas del período
    const notes = await prisma.note.findMany({
      where: whereClause
    });
    
    // Si es tipo de actividades-diarias, agrupar estadísticas por día
    if (tipo === 'actividades-diarias') {
      const statsByDay = {};
      
      notes.forEach(note => {
        if (!statsByDay[note.date]) {
          statsByDay[note.date] = {
            totalNotes: 0,
            completedTasks: 0,
            pendingTasks: 0,
            highPriorityTasks: 0,
            incidents: 0,
            notesTypes: {
              incidente: 0,
              mantenimiento: 0,
              reunion: 0,
              capacitacion: 0,
              otro: 0
            }
          };
        }
        
        const dayStats = statsByDay[note.date];
        dayStats.totalNotes++;
        
        if (note.status === 'completado') {
          dayStats.completedTasks++;
        } else {
          dayStats.pendingTasks++;
        }
        
        if (note.priority === 'alta' || note.priority === 'critica') {
          dayStats.highPriorityTasks++;
        }
        
        if (note.tipo === 'incidente') {
          dayStats.incidents++;
        }
        
        if (dayStats.notesTypes[note.tipo] !== undefined) {
          dayStats.notesTypes[note.tipo]++;
        } else {
          dayStats.notesTypes.otro++;
        }
      });
      
      res.json({
        success: true,
        statsByDay,
        totalNotes: notes.length,
        summary: {
          totalDays: Object.keys(statsByDay).length,
          totalNotes: notes.length,
          avgNotesPerDay: Object.keys(statsByDay).length > 0 ? 
            Math.round((notes.length / Object.keys(statsByDay).length) * 100) / 100 : 0
        }
      });
    } else {
      // Estadísticas generales para otros tipos
      const statsByType = {};
      const statsByPriority = {};
      const statsByStatus = {};
      
      notes.forEach(note => {
        // Por tipo
        if (!statsByType[note.tipo]) {
          statsByType[note.tipo] = 0;
        }
        statsByType[note.tipo]++;
        
        // Por prioridad (si existe)
        if (note.priority) {
          if (!statsByPriority[note.priority]) {
            statsByPriority[note.priority] = 0;
          }
          statsByPriority[note.priority]++;
        }
        
        // Por estado (si existe)
        if (note.status) {
          if (!statsByStatus[note.status]) {
            statsByStatus[note.status] = 0;
          }
          statsByStatus[note.status]++;
        }
      });
      
      res.json({
        success: true,
        totalNotes: notes.length,
        statsByType,
        statsByPriority,
        statsByStatus
      });
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/notes/search - Búsqueda avanzada de notas
router.get('/api/notes/search', requireAuth, async (req, res) => {
  try {
    const { q, tipo, tags, limit = 50 } = req.query;
    
    let whereClause = {};
    
    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ];
    }
    
    if (tipo) {
      whereClause.tipo = tipo;
    }
    
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      whereClause.tags = {
        hasSome: tagsArray
      };
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error buscando notas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// COLORES DISPONIBLES PARA CONFIGURACIÓN
// Propósito: Paleta estándar para que los administradores elijan al configurar tipos
// NOTA: NO es la fuente de verdad - los colores reales están en cada tipo individual
router.get('/api/config/colores', async (req, res) => {
  try {
    // Colores estáticos disponibles como opciones en la interfaz de administración
    const colores = [
      { 
        nombre: "Azul", 
        hex: "#3B82F6", 
        tailwind: "bg-blue-500/20 text-blue-400 border-blue-400/30" 
      },
      { 
        nombre: "Morado", 
        hex: "#8B5CF6", 
        tailwind: "bg-purple-500/20 text-purple-400 border-purple-400/30" 
      },
      { 
        nombre: "Amarillo", 
        hex: "#EAB308", 
        tailwind: "bg-yellow-500/20 text-yellow-400 border-yellow-400/30" 
      },
      { 
        nombre: "Verde", 
        hex: "#10B981", 
        tailwind: "bg-green-500/20 text-green-400 border-green-400/30" 
      },
      { 
        nombre: "Rojo", 
        hex: "#EF4444", 
        tailwind: "bg-red-500/20 text-red-400 border-red-400/30" 
      },
      { 
        nombre: "Cian", 
        hex: "#06B6D4", 
        tailwind: "bg-cyan-500/20 text-cyan-400 border-cyan-400/30" 
      },
      { 
        nombre: "Rosa", 
        hex: "#EC4899", 
        tailwind: "bg-pink-500/20 text-pink-400 border-pink-400/30" 
      },
      { 
        nombre: "Naranja", 
        hex: "#F97316", 
        tailwind: "bg-orange-500/20 text-orange-400 border-orange-400/30" 
      },
      { 
        nombre: "Índigo", 
        hex: "#6366F1", 
        tailwind: "bg-indigo-500/20 text-indigo-400 border-indigo-400/30" 
      }
    ];
    res.json(colores);
  } catch (error) {
    console.error('Error obteniendo colores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// TIPOS DE EVENTOS - CRUD
router.get('/api/config/tipos-eventos', async (req, res) => {
  try {
    const tipos = await prisma.tipoEvento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/api/config/tipos-eventos', requireAuth, async (req, res) => {
  try {
    const { nombre, icono } = req.body;
    
    const tipo = await prisma.tipoEvento.create({
      data: {
        nombre,
        icono,
        activo: true
      }
    });
    
    res.status(201).json(tipo);
  } catch (error) {
    console.error('Error creando tipo de evento:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de evento con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.put('/api/config/tipos-eventos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, icono, activo } = req.body;
    
    const tipo = await prisma.tipoEvento.update({
      where: { id },
      data: {
        nombre,
        icono,
        activo
      }
    });
    
    res.json(tipo);
  } catch (error) {
    console.error('Error actualizando tipo de evento:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de evento no encontrado' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de evento con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.delete('/api/config/tipos-eventos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.tipoEvento.update({
      where: { id },
      data: { activo: false }
    });
    
    res.json({ message: 'Tipo de evento desactivado correctamente' });
  } catch (error) {
    console.error('Error desactivando tipo de evento:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de evento no encontrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// TIPOS DE NOTAS - CRUD
router.get('/api/config/tipos-notas', async (req, res) => {
  try {
    const tipos = await prisma.tipoNota.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de notas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/api/config/tipos-notas', requireAuth, async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    
    const tipo = await prisma.tipoNota.create({
      data: {
        nombre,
        descripcion,
        color,
        activo: true
      }
    });
    
    res.status(201).json(tipo);
  } catch (error) {
    console.error('Error creando tipo de nota:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de nota con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.put('/api/config/tipos-notas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color, activo } = req.body;
    
    const tipo = await prisma.tipoNota.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        color,
        activo
      }
    });
    
    res.json(tipo);
  } catch (error) {
    console.error('Error actualizando tipo de nota:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de nota no encontrado' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de nota con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.delete('/api/config/tipos-notas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.tipoNota.update({
      where: { id },
      data: { activo: false }
    });
    
    res.json({ message: 'Tipo de nota desactivado correctamente' });
  } catch (error) {
    console.error('Error desactivando tipo de nota:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de nota no encontrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// TIPOS DE RECURSOS - CRUD
router.get('/api/config/tipos-recursos', async (req, res) => {
  try {
    const tipos = await prisma.tipoRecurso.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de recursos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/api/config/tipos-recursos', requireAuth, async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    
    const tipo = await prisma.tipoRecurso.create({
      data: {
        nombre,
        descripcion,
        color,
        activo: true
      }
    });
    
    res.status(201).json(tipo);
  } catch (error) {
    console.error('Error creando tipo de recurso:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de recurso con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.put('/api/config/tipos-recursos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, color, activo } = req.body;
    
    const tipo = await prisma.tipoRecurso.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        color,
        activo
      }
    });
    
    res.json(tipo);
  } catch (error) {
    console.error('Error actualizando tipo de recurso:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de recurso no encontrado' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'Ya existe un tipo de recurso con ese nombre' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

router.delete('/api/config/tipos-recursos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.tipoRecurso.update({
      where: { id },
      data: { activo: false }
    });
    
    res.json({ message: 'Tipo de recurso desactivado correctamente' });
  } catch (error) {
    console.error('Error desactivando tipo de recurso:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tipo de recurso no encontrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// 🧪 Endpoint de prueba para S3
router.get('/api/s3/test', (req, res) => {
  try {
    const s3Config = {
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      region: process.env.SUPABASE_S3_REGION,
      bucket: process.env.SUPABASE_S3_BUCKET,
      accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID ? '***CONFIGURED***' : 'NOT SET',
      secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY ? '***CONFIGURED***' : 'NOT SET',
    };

    res.json({
      status: 'ok',
      message: 'S3 configuration loaded successfully',
      config: s3Config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking S3 configuration',
      error: error.message
    });
  }
});

// 🧪 Endpoint de prueba para conectividad S3
router.get('/api/s3/test-connection', async (req, res) => {
  try {
    console.log('Testing S3 connection...');
    const files = await s3Service.listFiles('test', '');
    
    res.json({
      status: 'success',
      message: 'S3 connection successful',
      filesFound: files.length,
      files: files.slice(0, 5), // Solo mostrar primeros 5 archivos
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('S3 Connection Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'S3 connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
