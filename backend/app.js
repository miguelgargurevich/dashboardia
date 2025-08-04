// Backend base para Dashboard IA Soporte
// Inicialización Express y Prisma
import express from 'express';

const app = express();
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import os from 'os';
import dotenv from 'dotenv';
dotenv.config();

// Importar configuración de entorno
import envConfig from './src/config.js';

// Validar entorno al inicio
envConfig.validateEnvironment();

// Inicializar Prisma con la URL correcta según el entorno
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: envConfig.getDatabaseUrl()
    }
  }
});

const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

// Swagger configuration (solo en desarrollo)
let swaggerUi, specs;
if (envConfig.config.swagger.enabled) {
  const swagger = await import('./src/swagger.js');
  swaggerUi = swagger.swaggerUi;
  specs = swagger.specs;
}

envConfig.logger.info(`Iniciando aplicación en modo: ${envConfig.env}`);

// Endpoint para el asistente IA (Gemini)


app.use(express.json());

// Configurar CORS según el entorno
app.use(cors(envConfig.config.cors));

// Manejar preflight requests explícitamente
app.options('*', cors(envConfig.config.cors));

// Middleware de logging (solo en desarrollo)
if (envConfig.config.logging.requests) {
  app.use((req, res, next) => {
    envConfig.logger.debug(`${req.method} ${req.path}`, { body: req.body });
    next();
  });
}

// Swagger UI endpoint (solo si está habilitado)
if (envConfig.config.swagger.enabled && swaggerUi && specs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Dashboard IA Soporte API'
  }));
  envConfig.logger.info('Swagger UI habilitado en /api-docs');
}

// Rutas avanzadas del dashboard (protegidas y agrupadas)
import dashboardRoutes from './src/routes.js';

// Endpoints de autenticación deben ir antes de las rutas avanzadas
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Autenticar usuario
 *     description: Autentica un usuario con email y contraseña, retorna un JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: miguel.gargurevich@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token para autenticación
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/login', async (req, res) => {
  envConfig.logger.debug('Login attempt', { email: req.body.email });
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    envConfig.logger.debug('User not found', { email });
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    envConfig.logger.debug('Invalid password', { email });
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, 
    envConfig.shared.jwt.secret, 
    { expiresIn: envConfig.shared.jwt.expiresIn }
  );
  
  envConfig.logger.debug('Login successful', { userId: user.id });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: Crea un nuevo usuario o actualiza la contraseña si ya existe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Usuario registrado o actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 created:
 *                   type: boolean
 *                   description: Indica si el usuario fue creado
 *                 updated:
 *                   type: boolean
 *                   description: Indica si el usuario fue actualizado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

app.use(dashboardRoutes);

/**
 * @swagger
 * /api/assistant:
 *   post:
 *     summary: Asistente AI conversacional
 *     description: Interactúa con el asistente AI usando el modelo Gemini
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model, assistant]
 *                       description: Rol del mensaje
 *                     content:
 *                       type: string
 *                       description: Contenido del mensaje
 *                 description: Array de mensajes de la conversación
 *                 example:
 *                   - role: "user"
 *                     content: "¿Cuáles son los tickets pendientes?"
 *     responses:
 *       200:
 *         description: Respuesta del asistente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   description: Respuesta del asistente AI
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor o API de Gemini
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    
    const apiKey = envConfig.shared.gemini.apiKey;
    if (!apiKey) {
      envConfig.logger.error('Gemini API key not found');
      return res.status(500).json({ reply: 'No se encontró la clave de API de Gemini.' });
    }
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    
    const data = await response.json();
    envConfig.logger.debug('Gemini response received');
    const aiMsg = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo obtener respuesta.';
    res.json({ reply: aiMsg });
  } catch (err) {
    envConfig.logger.error('Error in /api/assistant:', err);
    res.status(500).json({ reply: 'Error al conectar con Gemini.' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend Dashboard IA Soporte funcionando');
});

// Health check endpoint para Render
app.get('/healthz', async (req, res) => {
  try {
    // Verificar conexión a la base de datos con una consulta simple
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
      database: 'connected'
    });
  } catch (error) {
    envConfig.logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
      database: 'disconnected',
      error: error.message
    });
  }
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

const port = envConfig.config.port;
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
  envConfig.logger.info(`Backend running in ${envConfig.env} mode`);
  console.log('\n🚀 Backend Dashboard IA Soporte');
  console.log(`📦 Entorno: ${envConfig.env.toUpperCase()}`);
  console.log(`🌐 Puerto: ${port}`);
  console.log(`\n  Local:            ${local}`);
  if (network) console.log(`  Network:          ${network}`);
  if (envConfig.config.swagger.enabled) {
    console.log(`\n📚 Swagger UI:       ${local}/api-docs`);
  }
  console.log('\n🔗 Endpoints disponibles:');
  console.log('  /api/login, /api/tickets, /api/events, etc.');
  console.log('\n⚡ Database:', envConfig.isDevelopment() ? 'Local PostgreSQL' : 'Supabase');
  console.log('\n🛑 Para detener el servidor usa Ctrl+C\n');
});

// export default app; // Uncomment if you need to import app elsewhere
