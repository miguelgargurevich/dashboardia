# 🚀 CONFIGURACIÓN DE RENDER PARA DASHBOARD IA

## Variables de Entorno en Render

### 1. En el Dashboard de Render, ve a tu servicio
### 2. En la sección "Environment", agrega estas variables:

```bash
# ⚡ VARIABLE CLAVE - ESTO ACTIVA MODO PRODUCCIÓN
NODE_ENV=production

# 🗄️ BASE DE DATOS (Supabase)
DATABASE_URL_PROD=postgresql://tu-usuario:tu-password@tu-host.supabase.com:puerto/postgres?pgbouncer=true
DATABASE_URL=postgresql://tu-usuario:tu-password@tu-host.supabase.com:puerto/postgres

# 🔐 SEGURIDAD
JWT_SECRET=tu-jwt-secret-super-seguro-aqui

# 🤖 IA
GEMINI_API_KEY=tu-gemini-api-key-aqui

# ☁️ SUPABASE S3 (opcional si usas archivos)
SUPABASE_S3_ENDPOINT=https://tu-proyecto.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-1
SUPABASE_S3_BUCKET=tu-bucket-name
SUPABASE_S3_ACCESS_KEY_ID=tu-access-key-id
SUPABASE_S3_SECRET_ACCESS_KEY=tu-secret-access-key
SUPABASE_S3_API_KEY=tu-api-key

# 🌐 PUERTO (Render lo asigna automáticamente)
PORT=4000
```

## 🚨 **ADVERTENCIA DE SEGURIDAD CRÍTICA**

⚠️ **Los valores mostrados arriba son EJEMPLOS PLACEHOLDER**  
⚠️ **NUNCA uses estos valores reales en producción**  
⚠️ **Reemplaza TODOS los valores con tus claves reales**  
⚠️ **Configura estas variables directamente en Render, NO en código**

### 📝 **Cómo obtener tus valores reales:**
1. **Supabase**: Ve a Settings → Database → Connection string
2. **Gemini**: Ve a Google AI Studio → API Keys
3. **JWT**: Genera uno seguro: `openssl rand -hex 32`
4. **S3**: Ve a Supabase → Storage → Settings → S3 API
```

## 🔄 ¿Cómo funciona el cambio automático?

### Local (NODE_ENV=development):
- 🏠 Base de datos: Tu PostgreSQL local
- 🔧 Swagger: Habilitado para desarrollo
- 📝 Logs: Todos los detalles
- 🌐 CORS: Abierto para localhost

### Render (NODE_ENV=production):
- ☁️ Base de datos: Supabase en la nube
- 🔒 Swagger: Deshabilitado por seguridad
- ⚡ Logs: Solo errores importantes
- 🛡️ CORS: Restringido a dominios permitidos

## 🎯 Ventajas de este sistema:

✅ **Automático**: Solo cambias NODE_ENV y todo se reconfigura
✅ **Seguro**: Configuraciones específicas para cada entorno
✅ **Mantenible**: Un solo código, múltiples entornos
✅ **Profesional**: Estándar de la industria

## 🚀 Deploy automático en Render:

1. Push tu código a Git
2. Render detecta los cambios
3. Lee NODE_ENV=production de las variables de entorno
4. Tu app automáticamente usa configuración de producción
5. ¡Listo! 🎉

## 💡 Tip Pro:

Si quieres probar el modo producción localmente:
```bash
NODE_ENV=production npm start
```
Tu app local usará Supabase en lugar de PostgreSQL local.

## 🛠️ **HERRAMIENTAS DE GESTIÓN DE ENTORNOS**

### 📜 **Script de Cambio Automático: switch-env.sh**

Hemos creado un script que te permite cambiar entre entornos de forma súper fácil:

#### **🔍 Ver el entorno actual:**
```bash
./switch-env.sh status
# O simplemente:
./switch-env.sh
```

**Salida esperada:**
```
📊 Entorno actual: development
🔧 Configuración de desarrollo:
  - Base de datos: PostgreSQL local
  - Puerto: 4000
  - Swagger: Habilitado
  - Logging: Completo
```

#### **🔄 Cambiar a desarrollo:**
```bash
./switch-env.sh development
```

**Salida esperada:**
```
✅ Entorno cambiado a: development

📊 Entorno actual: development
🔧 Configuración de desarrollo:
  - Base de datos: PostgreSQL local
  - Puerto: 4000
  - Swagger: Habilitado
  - Logging: Completo

🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.
```

#### **🚀 Cambiar a producción:**
```bash
./switch-env.sh production
```

**Salida esperada:**
```
✅ Entorno cambiado a: production

📊 Entorno actual: production
🚀 Configuración de producción:
  - Base de datos: Supabase
  - Puerto: 4000
  - Swagger: Deshabilitado
  - Logging: Solo errores

🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.
```

#### **🧪 Cambiar a testing:**
```bash
./switch-env.sh test
```

**Salida esperada:**
```
✅ Entorno cambiado a: test

📊 Entorno actual: test
🧪 Configuración de pruebas:
  - Base de datos: Test DB
  - Puerto: 4001
  - Swagger: Deshabilitado
  - Logging: Silenciado

🎉 ¡Listo! Reinicia el servidor para aplicar los cambios.
```

#### **❓ Ver ayuda del script:**
```bash
./switch-env.sh help
# O:
./switch-env.sh --help
```

### 🔧 **Flujo de Trabajo Recomendado:**

#### **1. Durante el desarrollo:**
```bash
# Asegúrate de estar en modo desarrollo
./switch-env.sh development

# Inicia tu servidor
npm start

# Tu app usa:
# ✅ PostgreSQL local
# ✅ Swagger habilitado en /api-docs
# ✅ Logs completos para debugging
```

#### **2. Para probar en modo producción localmente:**
```bash
# Cambia temporalmente a producción
./switch-env.sh production

# Inicia tu servidor
npm start

# Tu app usa:
# ✅ Supabase (base de datos en la nube)
# ✅ Sin Swagger (más seguro)
# ✅ Solo logs de errores (más rápido)

# Regresa a desarrollo cuando termines
./switch-env.sh development
```

#### **3. Para hacer deploy:**
```bash
# Asegúrate de que tu código está listo
./switch-env.sh development
npm start  # Prueba local

# En Render, simplemente configura:
NODE_ENV=production
# ¡Y automáticamente usará configuración de producción!
```

## 🎯 **EJEMPLOS PRÁCTICOS COMPLETOS**

### **Escenario 1: Nuevo desarrollador en el equipo**
```bash
# 1. Clona el repositorio
git clone https://github.com/miguelgargurevich/dashboardia.git
cd dashboardia/backend

# 2. Copia la configuración de ejemplo
cp .env.example .env

# 3. Edita .env con tus datos locales
# (PostgreSQL local, etc.)

# 4. Verifica el entorno
./switch-env.sh status

# 5. Si no está en desarrollo, cambia
./switch-env.sh development

# 6. Inicia el servidor
npm start

# ✅ Todo configurado automáticamente!
```

### **Escenario 2: Testing antes de deploy**
```bash
# 1. Prueba en modo desarrollo
./switch-env.sh development
npm start
# Haz tus pruebas...

# 2. Prueba en modo producción local
./switch-env.sh production
npm start
# Verifica que todo funcione con Supabase...

# 3. Regresa a desarrollo
./switch-env.sh development

# 4. Haz commit y push
git add .
git commit -m "Feature ready for production"
git push

# 5. En Render se despliega automáticamente con NODE_ENV=production
```

### **Escenario 3: Debugging de problemas de producción**
```bash
# 1. Reproduce el problema localmente en modo producción
./switch-env.sh production
npm start

# 2. El problema aparece? Activa logs de desarrollo temporalmente
# Edita src/config.js temporalmente para más logs

# 3. Una vez resuelto, regresa a desarrollo
./switch-env.sh development

# 4. Haz el fix y despliega
```

## 🔍 **COMANDOS DE VERIFICACIÓN Y TROUBLESHOOTING**

### **🔎 Verificar configuración actual:**
```bash
# Ver entorno actual y configuración
./switch-env.sh status

# Ver todas las variables de entorno cargadas
node -e "require('dotenv').config(); console.log('NODE_ENV:', process.env.NODE_ENV); console.log('Database:', process.env.DATABASE_URL_DEV || process.env.DATABASE_URL_PROD || process.env.DATABASE_URL);"
```

### **🧪 Probar conectividad a bases de datos:**
```bash
# En modo desarrollo (PostgreSQL local)
./switch-env.sh development
npm run test-db  # Si tienes un script de test

# En modo producción (Supabase)
./switch-env.sh production  
npm run test-db
```

### **📋 Checklist antes de deploy:**
```bash
# 1. Verificar que estás en desarrollo
./switch-env.sh status

# 2. Probar localmente
npm start

# 3. Probar en modo producción localmente
./switch-env.sh production
npm start

# 4. Verificar Swagger deshabilitado en producción
curl http://localhost:4000/api-docs
# Debería dar error 404 o no encontrado

# 5. Regresar a desarrollo y hacer commit
./switch-env.sh development
git add .
git commit -m "Ready for production deploy"
git push
```

### **🚨 Solución de problemas comunes:**

#### **Error: "No se encontró DATABASE_URL"**
```bash
# Verifica el entorno actual
./switch-env.sh status

# Si estás en development, verifica DATABASE_URL_DEV
grep "DATABASE_URL_DEV" .env

# Si estás en production, verifica DATABASE_URL_PROD
grep "DATABASE_URL_PROD" .env
```

#### **Error: "Variables de entorno faltantes"**
```bash
# Verifica que tienes todas las variables requeridas
grep -E "(JWT_SECRET|GEMINI_API_KEY)" .env

# Si faltan, copia desde .env.example
cp .env.example .env
# Y completa con tus valores reales
```

#### **El script switch-env.sh no funciona:**
```bash
# Asegúrate de que es ejecutable
chmod +x switch-env.sh

# Ejecuta desde el directorio backend
cd backend
./switch-env.sh status
```

## 📊 **COMPARACIÓN DE ENTORNOS**

| Característica | Development | Production | Test |
|---|---|---|---|
| **Base de datos** | PostgreSQL local | Supabase | Test DB |
| **Puerto** | 4000 | Variable | 4001 |
| **Swagger UI** | ✅ Habilitado | ❌ Deshabilitado | ❌ Deshabilitado |
| **Logging** | 📝 Completo | ⚡ Solo errores | 🔇 Silenciado |
| **CORS** | 🌐 Localhost abierto | 🛡️ Restringido | 🌐 Localhost |
| **Performance** | 🐌 Con debugging | 🚀 Optimizado | ⚡ Rápido |
| **Seguridad** | 🔓 Desarrollo | 🔒 Máxima | 🔓 Test |

## 🎉 **¡YA ESTÁS LISTO!**

Con este sistema tienes:

✅ **Configuración automática** por entorno  
✅ **Scripts fáciles** para cambiar entre entornos  
✅ **Documentación completa** de uso  
✅ **Troubleshooting** para problemas comunes  
✅ **Estándar profesional** de la industria  

### **Comandos esenciales que debes recordar:**
```bash
# Ver entorno actual
./switch-env.sh status

# Cambiar a desarrollo
./switch-env.sh development

# Cambiar a producción
./switch-env.sh production

# Ver ayuda
./switch-env.sh help
```

**¡Ahora puedes trabajar como un profesional con múltiples entornos!** 🚀
