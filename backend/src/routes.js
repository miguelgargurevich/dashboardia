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

// Chat con asistente IA que puede gestionar URLs, recursos y notas
// POST /api/assistant
router.post('/api/assistant', async (req, res) => {
  try {
    const { messages } = req.body;
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content.toLowerCase();

    // === DETECCIÓN DE CREACIÓN DE NOTAS ===
    if (userMessage.includes('crear nota') || userMessage.includes('nueva nota') || userMessage.includes('agregar nota')) {
      const respuesta = `📝 **¡Perfecto! Te ayudo a crear una nueva nota.**

Para crear la nota, necesito la siguiente información:

**Datos requeridos:**
1. **Título**: ¿Cómo se va a llamar la nota?
2. **Tema**: ¿A qué tema pertenece?
   - 🔔 notificaciones
   - 📄 polizas
   - 🎫 tickets
   - ⏰ actividades-diarias
   - 🚨 emergencias
   - 🧠 kb-conocidos
3. **Contenido**: ¿Cuál es el contenido de la nota? (puedes usar formato Markdown)
4. **Etiquetas** (opcional): Lista de etiquetas separadas por comas

**Responde con el formato:**
\`\`\`
Título: [Tu título aquí]
Tema: [notificaciones/polizas/tickets/actividades-diarias/emergencias/kb-conocidos]
Contenido: [El contenido de la nota en Markdown]
Etiquetas: [etiqueta1, etiqueta2, etiqueta3]
\`\`\``;

      return res.json({ reply: respuesta });
    }

    // === DETECCIÓN DE CREACIÓN DE RECURSOS ===
    if (userMessage.includes('crear recurso') || userMessage.includes('agregar recurso') || userMessage.includes('subir recurso')) {
      const respuesta = `📁 **¡Excelente! Te ayudo a agregar un nuevo recurso.**

Para crear el recurso, necesito la siguiente información:

**Datos requeridos:**
1. **Título**: ¿Cómo se va a llamar el recurso?
2. **Tipo**: ¿Qué tipo de recurso es?
   - 🔗 url (enlace web)
   - 📁 archivo (archivo subido)
   - 🎥 video
   - 📋 documento
3. **Tema**: ¿A qué tema pertenece?
   - 🔔 notificaciones
   - 📄 polizas
   - 🎫 tickets
   - ⏰ actividades-diarias
   - 🚨 emergencias
   - 🧠 kb-conocidos
4. **Descripción** (opcional): Describe brevemente el recurso
5. **URL** (si es tipo URL): La dirección del enlace
6. **Etiquetas** (opcional): Lista de etiquetas separadas por comas

**Responde con el formato:**
\`\`\`
Título: [Tu título aquí]
Tipo: [url/archivo/video/documento]
Tema: [notificaciones/polizas/tickets/actividades-diarias/emergencias/kb-conocidos]
Descripción: [Descripción opcional]
URL: [Si es tipo URL, la dirección]
Etiquetas: [etiqueta1, etiqueta2, etiqueta3]
\`\`\``;

      return res.json({ reply: respuesta });
    }

    // === PROCESAMIENTO DE DATOS ESTRUCTURADOS PARA NOTAS ===
    if (userMessage.includes('título:') && userMessage.includes('tema:') && userMessage.includes('contenido:')) {
      try {
        const titleMatch = lastMessage.content.match(/título:\s*(.+)/i);
        const temaMatch = lastMessage.content.match(/tema:\s*(.+)/i);
        const contenidoMatch = lastMessage.content.match(/contenido:\s*([\s\S]+?)(?=etiquetas:|$)/i);
        const etiquetasMatch = lastMessage.content.match(/etiquetas:\s*(.+)/i);

        if (titleMatch && temaMatch && contenidoMatch) {
          const titulo = titleMatch[1].trim();
          const tema = temaMatch[1].trim();
          const contenido = contenidoMatch[1].trim();
          const etiquetas = etiquetasMatch ? etiquetasMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];

          // Crear contenido de la nota en formato markdown
          const contenidoCompleto = `# ${titulo}

${contenido}

${etiquetas.length > 0 ? `\n**Etiquetas:** ${etiquetas.join(', ')}` : ''}

---
*Nota creada mediante Asistente IA del Dashboard de Soporte*
*Fecha: ${new Date().toLocaleDateString('es-ES')}*`;

          // Hacer petición al endpoint de creación de notas
          const fs = require('fs').promises;
          const path = require('path');
          
          // Crear nombre de archivo
          const nombreArchivo = `${titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.md`;
          
          // Crear ruta de directorio (ajustar para el contexto del backend)
          const directorioTema = path.join(__dirname, '../../public', 'notas-md', tema);
          const rutaArchivo = path.join(directorioTema, nombreArchivo);

          // Crear directorio si no existe
          if (!require('fs').existsSync(directorioTema)) {
            await fs.mkdir(directorioTema, { recursive: true });
          }

          // Guardar archivo
          await fs.writeFile(rutaArchivo, contenidoCompleto, 'utf-8');

          const respuesta = `✅ **¡Nota creada exitosamente!**

📋 **Detalles guardados:**
- **Título**: ${titulo}
- **Tema**: ${tema}
- **Archivo**: ${nombreArchivo}
- **Ubicación**: \`notas-md/${tema}/${nombreArchivo}\`
- **Etiquetas**: ${etiquetas.length > 0 ? etiquetas.join(', ') : 'Sin etiquetas'}
- **Contenido**: ${contenido.substring(0, 100)}${contenido.length > 100 ? '...' : ''}

La nota ha sido creada y está disponible en la sección "Base de Conocimiento" bajo el tema "${tema}".

¿Hay algo más en lo que pueda ayudarte?`;

          return res.json({ reply: respuesta });
        }
      } catch (error) {
        console.error('Error creando nota:', error);
        return res.json({ 
          reply: 'Hubo un error al crear la nota. Por favor, intenta nuevamente o créala manualmente desde la interfaz.' 
        });
      }
    }

    // === PROCESAMIENTO DE DATOS ESTRUCTURADOS PARA RECURSOS ===
    if (userMessage.includes('título:') && userMessage.includes('tipo:') && userMessage.includes('tema:')) {
      try {
        const titleMatch = lastMessage.content.match(/título:\s*(.+)/i);
        const tipoMatch = lastMessage.content.match(/tipo:\s*(.+)/i);
        const temaMatch = lastMessage.content.match(/tema:\s*(.+)/i);
        const descMatch = lastMessage.content.match(/descripción:\s*(.+)/i);
        const urlMatch = lastMessage.content.match(/url:\s*(.+)/i);
        const etiquetasMatch = lastMessage.content.match(/etiquetas:\s*(.+)/i);

        if (titleMatch && tipoMatch && temaMatch) {
          const etiquetas = etiquetasMatch ? etiquetasMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];
          
          // Crear el recurso en la base de datos
          const nuevoRecurso = await prisma.resource.create({
            data: {
              titulo: titleMatch[1].trim(),
              tipo: tipoMatch[1].trim().toLowerCase(),
              tema: temaMatch[1].trim().toLowerCase(),
              descripcion: descMatch ? descMatch[1].trim() : '',
              url: urlMatch ? urlMatch[1].trim() : null,
              tags: etiquetas,
              fechaCarga: new Date().toISOString()
            }
          });

          const respuesta = `✅ **¡Recurso creado exitosamente!**

📋 **Detalles guardados:**
- **Título**: ${nuevoRecurso.titulo}
- **Tipo**: ${nuevoRecurso.tipo}
- **Tema**: ${nuevoRecurso.tema}
- **Descripción**: ${nuevoRecurso.descripcion || 'Sin descripción'}
${nuevoRecurso.url ? `- **URL**: ${nuevoRecurso.url}` : ''}
- **Etiquetas**: ${etiquetas.length > 0 ? etiquetas.join(', ') : 'Sin etiquetas'}

El recurso ha sido agregado a la base de conocimiento y está disponible en la sección "Recursos".

¿Hay algo más en lo que pueda ayudarte?`;

          return res.json({ reply: respuesta });
        }
      } catch (error) {
        console.error('Error creando recurso:', error);
        return res.json({ 
          reply: 'Hubo un error al crear el recurso. Por favor, intenta nuevamente o créalo manualmente desde la interfaz.' 
        });
      }
    }

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
- � **Crear Notas**: Te guío paso a paso para crear notas organizadas
- 📁 **Gestionar Recursos**: Te ayudo a agregar archivos, videos y documentos
- �🔗 **Gestión de URLs**: Envíame cualquier enlace y te ayudo a agregarlo
- 📊 **Estadísticas**: Pregúntame sobre el estado de URLs, tickets o eventos
- 📚 **Base de conocimiento**: Te puedo orientar sobre cómo usar las diferentes secciones
- 🎫 **Soporte**: Preguntas sobre procedimientos y procesos

**Ejemplos de lo que puedes hacer:**
- 📝 "Crear nota", "Nueva nota sobre procedimientos"
- 📁 "Agregar recurso", "Subir documento de emergencias"
- 🔗 "Agrega este enlace: https://example.com"
- 📊 "¿Cuántas URLs tenemos pendientes?"
- 🚨 "Ayúdame con los procedimientos de emergencia"

¡Solo escribe tu consulta y te ayudo a crear contenido paso a paso!`;

    return res.json({ reply: respuestaGeneral });
    
  } catch (err) {
    console.error('Error en asistente:', err);
    res.status(500).json({ 
      reply: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.' 
    });
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

// Estadísticas de tickets por prioridad (para gráfico de barras)
router.get('/api/tickets/por-prioridad', requireAuth, async (req, res) => {
  try {
    const prioridades = await prisma.ticket.groupBy({
      by: ['prioridad'],
      _count: {
        id: true
      }
    });
    
    const datos = prioridades.map(item => ({
      prioridad: item.prioridad || 'Sin prioridad',
      cantidad: item._count.id
    }));
    
    res.json(datos);
  } catch (error) {
    console.error('Error obteniendo tickets por prioridad:', error);
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

// =====================================================
// ENDPOINTS PARA NOTAS DIARIAS
// =====================================================

// GET /api/daily-notes?month=YYYY-MM - Obtener notas de un mes específico
router.get('/api/daily-notes', requireAuth, async (req, res) => {
  try {
    const { month, date } = req.query;
    let whereClause = {};
    
    if (date) {
      // Buscar notas de una fecha específica
      whereClause.date = date;
    } else if (month) {
      // Buscar notas de un mes específico
      whereClause.date = {
        startsWith: month // YYYY-MM
      };
    }
    
    const notes = await prisma.dailyNote.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json(notes);
  } catch (error) {
    console.error('Error obteniendo notas diarias:', error);
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
    
    const note = await prisma.dailyNote.create({
      data: {
        date,
        title,
        content,
        priority,
        status,
        type,
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
    const existingNote = await prisma.dailyNote.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    const updatedNote = await prisma.dailyNote.update({
      where: { id },
      data: {
        title,
        content,
        priority,
        status,
        type,
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
    
    // Verificar que la nota existe
    const existingNote = await prisma.dailyNote.findUnique({
      where: { id }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    await prisma.dailyNote.delete({
      where: { id }
    });
    
    res.json({ message: 'Nota eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando nota diaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/daily-notes/stats - Obtener estadísticas de notas diarias
// GET /api/daily-notes/stats - Estadísticas de notas diarias
router.get('/api/daily-notes/stats', requireAuth, async (req, res) => {
  try {
    const { month } = req.query;
    let whereClause = {};
    
    if (month) {
      whereClause.date = {
        startsWith: month // YYYY-MM
      };
    }
    
    // Obtener todas las notas del período
    const notes = await prisma.dailyNote.findMany({
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
          types: {
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
      
      // Contadores por tipo
      if (note.type === 'incidente') {
        dayStats.incidents++;
      }
      
      // Contadores detallados
      if (dayStats.types[note.type] !== undefined) {
        dayStats.types[note.type]++;
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

// GET /api/daily-notes/search - Buscar notas diarias
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
    
    let whereClause = {};
    
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
      whereClause.type = type;
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
    
    const notes = await prisma.dailyNote.findMany({
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

module.exports = router;
