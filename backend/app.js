// Backend base para Dashboard IA Soporte
// Inicialización Express y Prisma
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const os = require('os');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// Endpoint para el asistente IA (Gemini)

app.use(express.json());
app.use(cors());

app.post('/api/assistant', async (req, res) => {
  try {
    const { messages } = req.body;
    // Filtra y corrige roles: solo 'user' y 'model' permitidos
    const contents = messages
      .map(m => {
        let role = m.role;
        if (role !== 'user' && role !== 'model') role = m.role === 'user' ? 'user' : 'model';
        return { role, parts: [{ text: m.content }] };
      })
      .filter(m => m.role === 'user' || m.role === 'model');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ reply: 'No se encontró la clave de API de Gemini.' });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    const data = await response.json();
    // console.log('Respuesta completa de Gemini:', JSON.stringify(data, null, 2));
    const aiMsg = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener respuesta.';
    res.json({ reply: aiMsg });
  } catch (err) {
    console.error('Error en /api/assistant:', err);
    res.status(500).json({ reply: 'Error al conectar con Gemini.' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend Dashboard IA Soporte funcionando');
});

// Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Registro de usuario
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    // Verifica si el usuario ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    const hashed = await bcrypt.hash(password, 10);
    if (existing) {
      // Si existe, actualiza la clave y mantiene el resto de datos
      const user = await prisma.user.update({
        where: { email },
        data: { password: hashed }
      });
      return res.json({ user, updated: true });
    }
    // Si no existe, crea el usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: email.split('@')[0],
        role: 'user',
      }
    });
    res.json({ user, created: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recursos
app.get('/api/resources', async (req, res) => {
  const recursos = await prisma.resource.findMany({ take: 5 });
  res.json(recursos);
});

// Tickets
app.get('/api/tickets', async (req, res) => {
  const tickets = await prisma.ticket.findMany({ take: 5 });
  res.json(tickets);
});

// Eventos
app.get('/api/events', async (req, res) => {
  const events = await prisma.event.findMany({ take: 5 });
  res.json(events);
});

// Actividades (ejemplo: últimos tickets y recursos)
app.get('/api/actividades', async (req, res) => {
  const tickets = await prisma.ticket.findMany({ take: 3 });
  const recursos = await prisma.resource.findMany({ take: 2 });
  res.json([...tickets, ...recursos]);
});

// Base de conocimientos (Knowledge Base)
app.get('/api/kb', async (req, res) => {
  try {
    const kbArticles = await prisma.KBArticle.findMany();
    res.json(kbArticles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener artículos de la base de conocimientos' });
  }
});

const port = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(port, () => {
    const ifaces = os.networkInterfaces();
    let local = `http://localhost:${port}`;
    let network = '';
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          network = `http://${iface.address}:${port}`;
          break;
        }
      }
      if (network) break;
    }
    console.log('\nBackend corriendo!');
    console.log(`\n  Local:            ${local}`);
    if (network) console.log(`  On Your Network:  ${network}`);
    console.log('\nPuedes acceder a la API en /api/login, /api/tickets, etc.');
    console.log('\nPara detener el servidor usa Ctrl+C.\n');
  });
}

module.exports = app;
