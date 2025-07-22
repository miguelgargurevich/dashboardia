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
  const tipo = req.query.tipo;
  const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10, 50));
  const skip = Math.max(0, parseInt(req.query.skip) || 0);
  try {
    const where = tipo ? { tipo } : {};
    const resources = await prisma.resource.findMany({ where, take: limit, skip });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recursos', details: err.message });
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
      skip
    });
    res.json(events);
  } catch (err) {
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
      start = new Date();
      end = new Date();
      end.setMonth(end.getMonth() + 1);
    }
    const events = await prisma.event.findMany({
      where: {
        startDate: { gte: start, lt: end }
      },
      orderBy: { startDate: 'asc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo eventos para calendario', details: err.message });
  }
});

// Detalles de evento
// GET /api/events/:id
router.get('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo detalles de evento', details: err.message });
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

// Chat con asistente IA que puede gestionar URLs
// POST /api/assistant
router.post('/api/assistant', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content.toLowerCase();

    // Detectar si el usuario quiere agregar una URL
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = lastMessage.content.match(urlRegex);

    if (urls && (userMessage.includes('agregar') || userMessage.includes('añadir') || userMessage.includes('guardar') || userMessage.includes('url') || userMessage.includes('enlace'))) {
      // Extraer la primera URL encontrada
      const url = urls[0];
      
      // Crear una respuesta interactiva para recopilar información
      const respuesta = `🔗 **He detectado una URL en tu mensaje**: ${url}

¡Perfecto! Te ayudo a agregarla a la base de conocimiento. Necesito algunos datos adicionales:

**Por favor, proporciona la siguiente información:**

1. **Título**: ¿Cómo quieres que se llame este enlace?
2. **Descripción**: ¿Puedes describir brevemente el contenido?
3. **Tema**: ¿A qué tema pertenece?
   - 🔔 Notificaciones
   - 📄 Pólizas y Reimpresión  
   - 🎫 Gestión de Tickets
   - ⏰ Actividades Diarias
   - 🚨 Procedimientos de Emergencia
4. **Tipo de contenido**: ¿Qué tipo de contenido es?
   - 🎥 Video
   - 📋 Documento
   - 📁 Página de contenidos
   - 📚 Tutorial
   - 📖 Referencia
5. **Prioridad**: ¿Qué prioridad tiene? (alta/media/baja)

Responde con el formato:
\`\`\`
Título: [Tu título aquí]
Descripción: [Tu descripción aquí]
Tema: [notificaciones/polizas/tickets/actividades-diarias/emergencias]
Tipo: [video/documento/pagina-contenidos/tutorial/referencia]
Prioridad: [alta/media/baja]
\`\`\``;

      return res.json({ reply: respuesta });
    }

    // Detectar si el usuario está proporcionando información estructurada para una URL
    if (userMessage.includes('título:') && userMessage.includes('tema:')) {
      try {
        // Extraer información del mensaje estructurado
        const titleMatch = lastMessage.content.match(/título:\s*(.+)/i);
        const descMatch = lastMessage.content.match(/descripción:\s*(.+)/i);
        const temaMatch = lastMessage.content.match(/tema:\s*(.+)/i);
        const tipoMatch = lastMessage.content.match(/tipo:\s*(.+)/i);
        const prioridadMatch = lastMessage.content.match(/prioridad:\s*(.+)/i);

        if (titleMatch && temaMatch && tipoMatch) {
          // Buscar URL en mensajes anteriores
          let urlEncontrada = null;
          for (let i = messages.length - 2; i >= 0; i--) {
            const urls = messages[i].content.match(urlRegex);
            if (urls) {
              urlEncontrada = urls[0];
              break;
            }
          }

          if (urlEncontrada) {
            // Crear la URL en la base de datos
            const nuevaUrl = await prisma.uRL.create({
              data: {
                titulo: titleMatch[1].trim(),
                url: urlEncontrada,
                descripcion: descMatch ? descMatch[1].trim() : '',
                tema: temaMatch[1].trim().toLowerCase(),
                tipoContenido: tipoMatch[1].trim().toLowerCase(),
                prioridad: prioridadMatch ? prioridadMatch[1].trim().toLowerCase() : 'media',
                estado: 'pendiente',
                agregadoPor: 'Asistente IA',
                etiquetas: []
              }
            });

            const respuesta = `✅ **¡URL agregada exitosamente!**

📋 **Detalles guardados:**
- **Título**: ${nuevaUrl.titulo}
- **URL**: ${nuevaUrl.url}
- **Descripción**: ${nuevaUrl.descripcion || 'Sin descripción'}
- **Tema**: ${nuevaUrl.tema}
- **Tipo**: ${nuevaUrl.tipoContenido}
- **Prioridad**: ${nuevaUrl.prioridad}
- **Estado**: ${nuevaUrl.estado}

La URL ha sido agregada a la base de conocimiento y está lista para ser revisada. Puedes verla en la sección "Enlaces y URLs" de la base de conocimiento.

¿Hay algo más en lo que pueda ayudarte?`;

            return res.json({ reply: respuesta });
          }
        }
      } catch (error) {
        console.error('Error creando URL:', error);
        return res.json({ 
          reply: 'Hubo un error al guardar la URL. Por favor, intenta nuevamente o agrégala manualmente desde la interfaz.' 
        });
      }
    }

    // Detectar consultas sobre URLs existentes
    if (userMessage.includes('urls') || userMessage.includes('enlaces') || userMessage.includes('links')) {
      try {
        const stats = await Promise.all([
          prisma.uRL.count(),
          prisma.uRL.count({ where: { estado: 'pendiente' } }),
          prisma.uRL.count({ where: { estado: 'revisado' } }),
          prisma.uRL.groupBy({
            by: ['tema'],
            _count: { id: true }
          })
        ]);

        const [total, pendientes, revisados, porTema] = stats;

        const temaStats = porTema.map(t => `- ${t.tema}: ${t._count.id}`).join('\n');

        const respuesta = `📊 **Estadísticas de URLs en la Base de Conocimiento:**

📈 **Resumen general:**
- **Total de URLs**: ${total}
- **Pendientes de revisión**: ${pendientes}
- **Ya revisadas**: ${revisados}

📋 **URLs por tema:**
${temaStats}

Para ver todas las URLs o agregar nuevas, ve a la sección "Enlaces y URLs" en la base de conocimiento.

¿Quieres que te ayude con algo específico sobre las URLs?`;

        return res.json({ reply: respuesta });
      } catch (error) {
        console.error('Error obteniendo estadísticas de URLs:', error);
        return res.json({ 
          reply: 'No pude obtener las estadísticas de URLs en este momento. Intenta nuevamente más tarde.' 
        });
      }
    }

    // Respuesta general para otros mensajes
    const respuestaGeneral = `¡Hola! Soy tu asistente IA del Dashboard de Soporte. 

🤖 **¿En qué puedo ayudarte hoy?**

📋 **Funcionalidades disponibles:**
- 🔗 **Gestión de URLs**: Envíame cualquier enlace y te ayudo a agregarlo a la base de conocimiento
- 📊 **Estadísticas**: Pregúntame sobre el estado de URLs, tickets o eventos
- 📚 **Base de conocimiento**: Te puedo orientar sobre cómo usar las diferentes secciones
- 🎫 **Soporte**: Preguntas sobre procedimientos y procesos

**Ejemplos de lo que puedes hacer:**
- "Agrega este enlace: https://example.com"
- "¿Cuántas URLs tenemos pendientes?"
- "Ayúdame con los procedimientos de emergencia"

¡Solo escribe tu consulta y te ayudo!`;

    return res.json({ reply: respuestaGeneral });
    
  } catch (err) {
    console.error('Error en asistente:', err);
    res.status(500).json({ 
      reply: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.' 
    });
  }
});

module.exports = router;
