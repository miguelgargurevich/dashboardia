# 🚀 Backend Dashboard IA Soporte

Sistema de backend con **configuración automática de entornos** para desarrollo, producción y testing.

## 🔧 **Configuración Rápida**

### 1. **Instalar dependencias:**
```bash
npm install
```

### 2. **Configurar variables de entorno:**
```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Editar .env con tus datos
# (PostgreSQL local, API keys, etc.)
```

### 3. **Verificar entorno:**
```bash
# Ver configuración actual
./switch-env.sh status
```

### 4. **Iniciar servidor:**
```bash
npm start
```

## 🌍 **Gestión de Entornos**

### **🛠️ Script de Cambio Automático**

Usa el script `switch-env.sh` para cambiar entre entornos fácilmente:

```bash
# Ver entorno actual
./switch-env.sh status

# Cambiar a desarrollo
./switch-env.sh development

# Cambiar a producción  
./switch-env.sh production

# Cambiar a testing
./switch-env.sh test

# Ver ayuda
./switch-env.sh help
```

### **📊 Configuraciones por Entorno**

| Entorno | Base de Datos | Puerto | Swagger | Logging |
|---------|---------------|--------|---------|---------|
| **Development** | PostgreSQL local | 4000 | ✅ Habilitado | 📝 Completo |
| **Production** | Supabase | Variable | ❌ Deshabilitado | ⚡ Solo errores |
| **Test** | Test DB | 4001 | ❌ Deshabilitado | 🔇 Silenciado |

## 🚀 **API Endpoints**

### **🔐 Autenticación**
```bash
POST /api/login      # Iniciar sesión
POST /api/signup     # Registrar usuario
```

### **🎫 Tickets**
```bash
GET  /api/tickets           # Listar tickets
POST /api/tickets           # Crear ticket
GET  /api/tickets/:id       # Obtener ticket
PUT  /api/tickets/:id       # Actualizar ticket
```

### **📅 Eventos**
```bash
GET  /api/events            # Listar eventos
POST /api/events            # Crear evento
GET  /api/events/:id        # Obtener evento
PUT  /api/events/:id        # Actualizar evento
```

### **📚 Recursos**
```bash
GET  /api/resources         # Listar recursos
POST /api/resources         # Crear recurso
GET  /api/resources/:id     # Obtener recurso
```

### **🤖 Asistente IA**
```bash
POST /api/assistant         # Chat con Gemini AI
```

## 📚 **Documentación API**

### **En Desarrollo:**
```bash
# Swagger UI disponible en:
http://localhost:4000/api-docs
```

### **En Producción:**
```bash
# Swagger deshabilitado por seguridad
# Usa esta documentación en su lugar
```

## 🔍 **Desarrollo Local**

### **Prerequisitos:**
- Node.js 18+
- PostgreSQL (Docker recomendado)
- Variables de entorno configuradas

### **Setup PostgreSQL con Docker:**
```bash
# Crear contenedor PostgreSQL
docker run --name dashboard-postgres \
  -e POSTGRES_USER=dashboard_user \
  -e POSTGRES_PASSWORD=dashboard_pass \
  -e POSTGRES_DB=dashboard_ia_soporte \
  -p 5433:5432 \
  -d postgres:15

# Verificar que funciona
docker ps
```

### **Comandos de desarrollo:**
```bash
# Modo desarrollo
./switch-env.sh development
npm start

# Probar en modo producción localmente
./switch-env.sh production
npm start

# Regresar a desarrollo
./switch-env.sh development
```

## 🚀 **Deploy en Render**

### **1. Variables de entorno en Render:**
```bash
NODE_ENV=production
JWT_SECRET=tu-jwt-secret-super-seguro
GEMINI_API_KEY=tu-gemini-api-key
DATABASE_URL_PROD=tu-url-de-supabase
DATABASE_URL=tu-url-de-supabase-directa
```

### **2. Deploy automático:**
- Push a Git → Render detecta cambios → Deploy automático
- `NODE_ENV=production` activa configuración de producción
- ¡Sin configuración manual adicional!

## 🛠️ **Troubleshooting**

### **Error: Variables de entorno faltantes**
```bash
# Verificar .env
cat .env

# Copiar desde ejemplo si falta
cp .env.example .env
```

### **Error: No se conecta a la base de datos**
```bash
# Verificar entorno
./switch-env.sh status

# En desarrollo: verificar PostgreSQL local
docker ps | grep postgres

# En producción: verificar URL de Supabase
```

### **El script no funciona**
```bash
# Hacer ejecutable
chmod +x switch-env.sh

# Ejecutar desde directorio backend
cd backend
./switch-env.sh status
```

## 📁 **Estructura del Proyecto**

```
backend/
├── src/
│   ├── config.js          # 🔧 Configuración de entornos
│   ├── swagger.js         # 📚 Documentación API
│   └── routes.js          # 🛣️ Rutas adicionales
├── prisma/
│   ├── schema.prisma      # 🗄️ Esquema base de datos
│   └── migrations/        # 📈 Migraciones
├── app.js                 # 🚀 Servidor principal
├── switch-env.sh          # 🛠️ Script de entornos
├── .env.example           # 📄 Plantilla configuración
├── .env                   # 🔐 Configuración local (no subir a Git)
└── README.md             # 📖 Esta documentación
```

## 🎯 **Características Principales**

✅ **Configuración automática** por entorno  
✅ **Scripts de cambio** fáciles de usar  
✅ **Swagger UI** en desarrollo  
✅ **Logging inteligente** según entorno  
✅ **Seguridad** diferenciada por entorno  
✅ **Deploy automático** en Render  
✅ **Documentación completa**  

## 📞 **Soporte**

- **Documentación completa:** `RENDER_SETUP.md`
- **Configuración de ejemplo:** `.env.example`
- **Script de ayuda:** `./switch-env.sh help`

---

**¡Ya tienes un backend profesional con gestión automática de entornos!** 🎉
