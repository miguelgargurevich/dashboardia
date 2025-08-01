const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('./auth');
const prisma = new PrismaClient();

// Proteger solo rutas privadas, NO /api/assistant
// router.use(requireAuth); // Comentado para proteger solo rutas privadas

// Endpoint: Estadísticas de tickets agrupadas
// GET /api/tickets/stats?groupBy=tipo|estado|sistema|fecha|usuario
router.get('/api/tickets/stats', async (req, res) => {
  const groupBy = req.query.groupBy || 'tipo';
  let groupField;
  switch (groupBy) {
    case 'estado': groupField = 'estado'; break;
    case 'sistema': groupField = 'sistema'; break;
    case 'fecha': groupField = 'createdAt'; break;
    case 'usuario': groupField = 'userId'; break;
    default: groupField = 'tipo';
  }
  try {
    if (groupBy === 'fecha') {
      // Agrupar por día (YYYY-MM-DD)
      const tickets = await prisma.ticket.findMany({ select: { createdAt: true } });
      const counts = {};
      for (const t of tickets) {
        const fecha = t.createdAt.toISOString().slice(0, 10);
        counts[fecha] = (counts[fecha] || 0) + 1;
      }
      const stats = Object.entries(counts).map(([createdAt, count]) => ({ createdAt, _count: { id: count } }));
      res.json(stats);
    } else if (groupBy === 'usuario') {
      // Para usuarios, necesitamos obtener nombres desde la tabla User
      const stats = await prisma.ticket.groupBy({
        by: ['userId'],
        _count: { id: true }
      });
      
      // Obtener nombres de usuarios
      const userIds = stats.map(s => s.userId).filter(Boolean);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      });
      
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user.name;
      });
      
      const formattedStats = stats.map(stat => ({
        usuario: stat.userId ? userMap[stat.userId] || 'Usuario desconocido' : 'Sin asignar',
        _count: stat._count
      }));
      
      res.json(formattedStats);
    } else {
      const stats = await prisma.ticket.groupBy({
        by: [groupField],
        _count: { id: true }
      });
      res.json(stats);
    }
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas', details: err.message });
  }
});

// Recursos recientes (archivos, notas, videos)
// GET /api/resources/recent?limit=10&skip=0
router.get('/api/resources/recent', async (req, res) => {
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
router.get('/api/resources', async (req, res) => {
  const { tipo, categoria, estado, page = 1, limit = 50 } = req.query;
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
router.post('/api/resources', async (req, res) => {
  try {
    const {
      tipo,
      titulo,
      descripcion,
      url,
      filePath,
      tags = [],
      categoria,
      tipoArchivo,
      tamaño,
      nombreOriginal
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
router.get('/api/resources/:id', async (req, res) => {
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
router.put('/api/resources/:id', async (req, res) => {
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
router.delete('/api/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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

// Próximos eventos
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
        nombreNotificacion: true,
        diaEnvio: true,
        query: true,
        relatedResources: true
      }
    });
    // Asegurar que todos los campos extendidos existan aunque sean null
    const eventsWithDefaults = events.map(ev => ({
      ...ev,
      modo: ev.modo ?? '',
      validador: ev.validador ?? '',
      codigoDana: ev.codigoDana ?? '',
      nombreNotificacion: ev.nombreNotificacion ?? '',
      diaEnvio: ev.diaEnvio ?? '',
      query: ev.query ?? '',
      relatedResources: ev.relatedResources ?? []
    }));
    res.json(eventsWithDefaults);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo eventos para calendario', details: err.message });
  }
});

// Detalles de evento
// GET /api/events/:id
router.get('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
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
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (err) {
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

// === RUTAS PARA GESTIÓN DE URLs ===

// Obtener todas las URLs con filtros opcionales
// GET /api/urls?tema=&estado=&tipoContenido=
router.get('/api/urls', async (req, res) => {
  try {
    const { tema, estado, tipoContenido, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (tema) where.tema = tema;
    if (estado) where.estado = estado;
    if (tipoContenido) where.tipoContenido = tipoContenido;
    
    const urls = await prisma.uRL.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    
    const total = await prisma.uRL.count({ where });
    
    res.json({
      urls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo URLs', details: err.message });
  }
});

// Crear nueva URL
// POST /api/urls
router.post('/api/urls', async (req, res) => {
  try {
    const {
      titulo,
      url,
      descripcion,
      tema,
      tipoContenido,
      estado = 'pendiente',
      prioridad = 'media',
      etiquetas = [],
      agregadoPor,
      comentarios
    } = req.body;

    // Validaciones básicas
    if (!titulo || !url || !tema || !tipoContenido) {
      return res.status(400).json({ 
        error: 'Campos requeridos: titulo, url, tema, tipoContenido' 
      });
    }

    const nuevaUrl = await prisma.uRL.create({
      data: {
        titulo,
        url,
        descripcion,
        tema,
        tipoContenido,
        estado,
        prioridad,
        etiquetas,
        agregadoPor,
        comentarios
      }
    });

    res.status(201).json(nuevaUrl);
  } catch (err) {
    res.status(500).json({ error: 'Error creando URL', details: err.message });
  }
});

// Obtener URL por ID
// GET /api/urls/:id
router.get('/api/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const url = await prisma.uRL.findUnique({
      where: { id }
    });
    
    if (!url) {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    
    res.json(url);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo URL', details: err.message });
  }
});

// Actualizar URL
// PUT /api/urls/:id
router.put('/api/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      url,
      descripcion,
      tema,
      tipoContenido,
      estado,
      prioridad,
      etiquetas,
      agregadoPor,
      comentarios,
      fechaRevision
    } = req.body;

    const urlActualizada = await prisma.uRL.update({
      where: { id },
      data: {
        titulo,
        url,
        descripcion,
        tema,
        tipoContenido,
        estado,
        prioridad,
        etiquetas,
        agregadoPor,
        comentarios,
        fechaRevision: fechaRevision ? new Date(fechaRevision) : undefined,
        updatedAt: new Date()
      }
    });

    res.json(urlActualizada);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    res.status(500).json({ error: 'Error actualizando URL', details: err.message });
  }
});

// Eliminar URL
// DELETE /api/urls/:id
router.delete('/api/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.uRL.delete({
      where: { id }
    });
    
    res.json({ message: 'URL eliminada correctamente' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    res.status(500).json({ error: 'Error eliminando URL', details: err.message });
  }
});

// Marcar URL como revisada
// PATCH /api/urls/:id/revisar
router.patch('/api/urls/:id/revisar', async (req, res) => {
  try {
    const { id } = req.params;
    const { comentarios } = req.body;
    
    const urlRevisada = await prisma.uRL.update({
      where: { id },
      data: {
        estado: 'revisado',
        fechaRevision: new Date(),
        comentarios: comentarios || undefined,
        updatedAt: new Date()
      }
    });
    
    res.json(urlRevisada);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'URL no encontrada' });
    }
    res.status(500).json({ error: 'Error marcando URL como revisada', details: err.message });
  }
});

// Obtener estadísticas de URLs
// GET /api/urls/stats
router.get('/api/urls/stats', async (req, res) => {
  try {
    const estadisticas = await Promise.all([
      prisma.uRL.groupBy({
        by: ['tema'],
        _count: { id: true }
      }),
      prisma.uRL.groupBy({
        by: ['estado'],
        _count: { id: true }
      }),
      prisma.uRL.groupBy({
        by: ['tipoContenido'],
        _count: { id: true }
      }),
      prisma.uRL.count()
    ]);

    res.json({
      porTema: estadisticas[0],
      porEstado: estadisticas[1],
      porTipoContenido: estadisticas[2],
      total: estadisticas[3]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estadísticas de URLs', details: err.message });
  }
});

// === ENDPOINT PARA ASISTENTE IA CON DETECCIÓN DE URLs ===

// Chat con asistente IA usando Gemini
// POST /api/assistant
// Prompt del asistente IA directamente en este archivo
const systemPrompt = [
  'Eres el asistente virtual de **DashboardIA**, la plataforma de gestión y soporte para equipos, usuarios y administradores.',
  'Tu misión es ayudar a los usuarios a navegar, aprovechar y entender todas las funcionalidades del sistema, resolviendo dudas y guiando en el uso de herramientas clave.',
  '',
  '### 🛠️ Tu Rol:',
  '- Asistir en español con explicaciones claras, útiles y guiadas.',
  '- Ser soporte integrado, con tono cercano, paciente y profesional.',
  '- Adaptarte al nivel de experiencia del usuario (novato o avanzado).',
  '',
  '### 👥 Roles de Usuarios:',
  '- **Administrador**: gestiona usuarios, recursos, tickets, eventos y configuraciones.',
  '- **Soporte**: atiende tickets, consulta recursos, agenda eventos y actualiza estados.',
  '- **Usuario**: consulta eventos, notas, recursos, crea tickets y revisa información relevante.',
  '',
  '### 🎯 Funcionalidades principales:',
  '- **Dashboard General**: resumen de eventos próximos, recursos recientes y estadísticas.',
  '- **Recursos y Archivos**: subir, buscar y relacionar archivos, documentos, enlaces y videos.',
  '- **Eventos y Calendario**: ver, crear y editar eventos, reuniones y actividades.',
  '- **Notas y Conocimiento**: agregar notas, consultar base de conocimiento y buscar información.',
  '- **Configuración**: editar perfil, cambiar contraseña, personalizar notificaciones.',
  '',
  '- **Ayuda integrada**:',
  '  - Explicaciones rápidas (“¿Cómo creo un ticket?”, “¿Dónde subo un archivo?”).',
  '  - Respuestas a preguntas frecuentes.',
  '  - Ejemplo: “¿Cómo veo los recursos recientes?” → “Ve al Dashboard y revisa la sección ‘Recursos recientes’.”',
  '',
  '### 🗣️ Instrucciones de conversación:',
  '1. Saluda siempre y pregunta en qué puede ayudar (“¡Hola! Soy tu asistente de DashboardIA. ¿En qué puedo ayudarte hoy?”).',
  '2. Detecta el rol del usuario y ofrece solo funcionalidades relevantes.',
  '3. Responde con explicaciones paso a paso y sugiere acciones (“Puedes ir a…”, “Luego haz clic en…”).',
  '4. Si el usuario está perdido, pregunta si quiere acceder a alguna sección (“¿Quieres ver tus tickets, recursos o eventos?”).',
  '5. Ofrece ejemplos visuales y enlaces internos (como `/dashboard`, `/tickets`, `/recursos`).',
  '6. Si reporta un error, sugiere soluciones comunes: recargar, verificar conexión, contactar soporte.',
  '7. Si pregunta sobre procesos (crear ticket, subir recurso, agendar evento), explica con detalle y paciencia.',
  '8. Usa formato claro y natural, sin tecnicismos excesivos.',
  '9. Finaliza con: “¿Te gustaría que te muestre cómo hacerlo o hacerlo contigo?”',
  '',
  '### ✅ Objetivo:',
  '- Guiar al usuario en el uso de las funcionalidades clave.',
  '- Facilitar la navegación y aumentar la adopción de características.',
  '- Reducir dudas y mejorar la experiencia general.',
  '',
  '### 📘 Ejemplo de usuario → respuesta:',
  '**Usuario:** “¿Cómo subo un archivo para mi equipo?”',
  '**Asistente:** “¡Por supuesto! Ve a la sección ‘Recursos’ y haz clic en ‘Subir archivo’. Selecciona el documento y confirma. ¿Quieres que te muestre el botón ahora?”',
  '',
  '**Usuario:** “¿Dónde veo los eventos próximos?”',
  '**Asistente:** “Puedes ver los eventos en el Dashboard o en la sección ‘Calendario’. Allí encontrarás las actividades programadas. ¿Te gustaría que te guíe paso a paso?”',
  '',
  '### 📝 Formato de respuesta:',
  '- Responde siempre en **Markdown** para que el frontend muestre negritas, listas y títulos.',
  '- Usa **negritas** para palabras clave y títulos de secciones.',
  '- Sé breve y directo: máximo 3-4 frases por respuesta, salvo que el usuario pida más detalle.',
  '- Si la respuesta es larga, resume y ofrece ampliar si el usuario lo solicita.',
  '',
  'Sigue este formato para todas las interacciones.'
].join('\n');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

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
    } catch (jsonErr) {
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
    return res.status(200).json({ response: text });
  } catch (error) {
    return res.status(503).json({ error: {
      code: 503,
      message: 'El servidor de IA no está disponible actualmente. Por favor, asegúrate de que el backend esté en funcionamiento o intenta más tarde.'
    }});
  }
});

// =============================================
// ENDPOINTS PARA DASHBOARD ESTADÍSTICO
// =============================================

// Estadísticas mensuales de tickets por estado
router.get('/api/tickets/estadisticas-mensuales', requireAuth, async (req, res) => {
  try {
    const ahora = new Date();
    const hace6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: hace6Meses
        }
      },
      select: {
        createdAt: true,
        estado: true
      }
    });
    
    // Agrupar por mes y estado
    const meses = [];
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });
      meses.unshift({
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        resueltos: 0,
        pendientes: 0,
        en_proceso: 0
      });
    }
    
    tickets.forEach(ticket => {
      const mes = ticket.createdAt.getMonth();
      const año = ticket.createdAt.getFullYear();
      const mesIndex = (año - hace6Meses.getFullYear()) * 12 + (mes - hace6Meses.getMonth());
      
      if (mesIndex >= 0 && mesIndex < 6) {
        switch (ticket.estado?.toLowerCase()) {
          case 'resuelto':
          case 'cerrado':
            meses[mesIndex].resueltos++;
            break;
          case 'en proceso':
          case 'en_proceso':
            meses[mesIndex].en_proceso++;
            break;
          default:
            meses[mesIndex].pendientes++;
        }
      }
    });
    
    res.json(meses);
  } catch (error) {
    console.error('Error obteniendo estadísticas mensuales de tickets:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas mensuales de eventos
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

// Estadísticas de distribución de tickets (para gráfico pie)
router.get('/api/tickets/distribucion', requireAuth, async (req, res) => {
  try {
    const distribucion = await prisma.ticket.groupBy({
      by: ['tipo'],
      _count: {
        id: true
      }
    });
    
    const datos = distribucion.map(item => ({
      tipo: item.tipo || 'Sin tipo',
      cantidad: item._count.id
    }));
    
    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo distribución de tickets:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Estadísticas de tickets por tipo (para gráfico de barras)
router.get('/api/tickets/por-prioridad', requireAuth, async (req, res) => {
  try {
    const tipos = await prisma.ticket.groupBy({
      by: ['tipo'],
      _count: {
        id: true
      }
    });
    
    const datos = tipos.map(item => ({
      prioridad: item.tipo || 'Sin tipo',
      cantidad: item._count.id
    }));
    
    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo tickets por tipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Tendencia semanal de tickets (para gráfico de líneas)
router.get('/api/tickets/tendencia-semanal', requireAuth, async (req, res) => {
  try {
    const ahora = new Date();
    const hace4Semanas = new Date(ahora.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
    
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: hace4Semanas
        }
      },
      select: {
        createdAt: true
      }
    });
    
    // Agrupar por semana
    const semanas = [];
    for (let i = 0; i < 4; i++) {
      const inicioSemana = new Date(ahora.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
      const finSemana = new Date(ahora.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      
      const ticketsSemana = tickets.filter(ticket => 
        ticket.createdAt >= inicioSemana && ticket.createdAt < finSemana
      );
      
      semanas.unshift({
        semana: `S${4-i}`,
        tickets: ticketsSemana.length
      });
    }
    
    res.json(semanas);
  } catch (error) {
    console.error('Error obteniendo tendencia semanal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS PARA NOTAS GENERALES =====

// GET /api/daily-notes?month=YYYY-MM - LEGACY: Redirige al modelo unificado
router.get('/api/daily-notes', requireAuth, async (req, res) => {
  try {
    const { month, date } = req.query;
    let whereClause = {
      tema: 'actividades-diarias' // Filtrar solo notas de actividades diarias
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
        userId,
        tema: 'actividades-diarias', // Asignar tema específico
        descripcion: `Nota diaria del ${date}` // Descripción automática
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
        tema: 'actividades-diarias' // Solo permitir actualizar notas diarias
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
        tema: 'actividades-diarias' // Solo permitir eliminar notas diarias
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
router.get('/api/daily-notes/stats', requireAuth, async (req, res) => {
  try {
    const { month } = req.query;
    let whereClause = {
      tema: 'actividades-diarias' // Solo estadísticas de notas diarias
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
      tema: 'actividades-diarias' // Solo buscar en notas diarias
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

// GET /api/notes - Obtener todas las notas o filtradas por tema
router.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const { tema, tipo, status, search } = req.query;
    let whereClause = {};
    
    if (tema) {
      whereClause.tema = tema;
    }
    
    if (tipo) {
      whereClause.tipo = tipo;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: [
        { tema: 'asc' },
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
    const {
      title,
      content,
      tema,
      tipo = 'nota',
      descripcion,
      tags = [],
      context,
      keyPoints = [],
      status = 'activo',
      userId
    } = req.body;
    
    // Validaciones básicas
    if (!title || !content || !tema) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: title, content, tema' 
      });
    }
    
    const note = await prisma.note.create({
      data: {
        title,
        content,
        tema,
        tipo,
        descripcion,
        tags,
        context,
        keyPoints,
        status,
        userId
      }
    });
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creando nota:', error);
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
      tema,
      tipo,
      descripcion,
      tags,
      context,
      keyPoints,
      status
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
        tema,
        tipo,
        descripcion,
        tags,
        context,
        keyPoints,
        status,
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
    const { month, tema } = req.query;
    let whereClause = {};
    
    // Filtrar por tema si se especifica
    if (tema) {
      whereClause.tema = tema;
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
    
    // Si es tema de actividades-diarias, agrupar estadísticas por día
    if (tema === 'actividades-diarias') {
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
      // Estadísticas generales para otros temas
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
    const { q, tema, tipo, tags, limit = 50 } = req.query;
    
    let whereClause = {};
    
    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } }
      ];
    }
    
    if (tema) {
      whereClause.tema = tema;
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

module.exports = router;
