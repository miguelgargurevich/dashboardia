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

module.exports = router;
