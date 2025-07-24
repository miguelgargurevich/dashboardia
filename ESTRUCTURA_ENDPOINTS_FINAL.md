# 📋 Estructura de Endpoints Reorganizada

## ✅ **Nuevos Endpoints con Nombres Descriptivos:**

### 🤖 **AI & Content Generation**
```
/api/ai/content-generator/     # Generación de contenido con IA (Gemini)
├── POST: Generar notas, procedimientos, manuales con IA
└── Integrado con AssistantBubble
```

### 📅 **Calendar & Daily Notes**
```
/api/calendar/notes/           # Gestión de notas diarias para calendario
├── GET: Listar notas por fecha/mes
├── POST: Crear nueva nota diaria
├── [id]/
│   ├── GET: Obtener nota específica
│   ├── PUT: Actualizar nota
│   └── DELETE: Eliminar nota
└── stats/
    └── GET: Estadísticas de notas diarias
```

### 📚 **Knowledge Base & Content**
```
/api/content/knowledge/        # Base de conocimiento (notas markdown)
├── GET: Listar notas por tema/categoría
├── [filename]/
│   └── GET: Obtener contenido de nota específica
└── Reemplaza: /api/notas-md/
```

### 📁 **Resources Management**
```
/api/resources/                # Gestión de recursos y archivos
├── GET: Listar recursos
├── POST: Crear nuevo recurso
├── [id]/
│   ├── GET: Obtener recurso específico
│   ├── PUT: Actualizar recurso
│   └── DELETE: Eliminar recurso
└── upload/
    └── POST: Subir archivos
```

### 🤖 **Artificial Intelligence**
```
/api/ai/
├── content-generator/         # Generación de contenido con IA
│   └── POST: Generar documentación y notas
└── url-processor/            # Procesamiento inteligente de URLs
    └── POST: Analizar y categorizar URLs con IA
```

### 🔐 **Authentication**
```
/api/auth/login/               # Sistema de autenticación
└── POST: Iniciar sesión
```

---

## 🗑️ **Endpoints Obsoletos (Para Eliminar):**

### ❌ **Endpoints en Español (Deprecated)**
```
/api/generar-nota/            → /api/ai/content-generator/
/api/notas-md/                → /api/content/knowledge/
/api/daily-notes/             → /api/calendar/notes/
/api/recursos/                → /api/resources/
/api/procesar-url/            → /api/ai/url-processor/
```

---

## 🔄 **Comandos del AssistantBubble Actualizados:**

### ✅ **Funcionalidades Disponibles:**

#### 1. **Crear Nota con IA:**
```
Usuario: "crear nota"
Endpoint: /api/ai/content-generator/
Resultado: Nota generada y guardada automáticamente
```

#### 2. **Agregar URL:**
```
Usuario: "agregar url"
Endpoint: /api/ai/url-processor/
Resultado: URL procesada y categorizada con IA
```

#### 3. **Subir Recurso:**
```
Usuario: "subir recurso"
Endpoint: /api/resources/upload/
Resultado: Archivos subidos y categorizados
```

---

## 📊 **Ventajas de la Nueva Estructura:**

### 🎯 **Organización Semántica:**
- **`/api/ai/`**: Todo relacionado con inteligencia artificial
- **`/api/calendar/`**: Funcionalidades del calendario
- **`/api/content/`**: Gestión de contenido y conocimiento
- **`/api/resources/`**: Manejo de archivos y recursos

### 🌐 **Estándares Internacionales:**
- **Nombres en inglés**: Mejor para APIs internacionales
- **RESTful**: Sigue convenciones REST estándar
- **Descriptivos**: URLs auto-explicativas

### 🔧 **Mantenibilidad:**
- **Separación clara**: Cada dominio en su carpeta
- **Escalabilidad**: Fácil agregar nuevas funcionalidades
- **Consistencia**: Nomenclatura uniforme

### 📈 **Experiencia de Usuario:**
- **AssistantBubble integrado**: Comandos naturales funcionando
- **Compatibilidad**: Sistema funciona con nuevos endpoints
- **Performance**: Estructura optimizada

---

## 🎯 **Próximos Pasos:**

### 1. **Actualizar Frontend** (Opcional - cuando esté listo):
```bash
# En app/calendar/page.tsx cambiar:
/api/daily-notes → /api/calendar/notes

# En app/knowledge/page.tsx cambiar:  
/api/notas-md → /api/content/knowledge
```

### 2. **Limpiar Endpoints Antiguos:**
```bash
# Después de confirmar que todo funciona:
rm -rf /api/generar-nota/
rm -rf /api/notas-md/
rm -rf /api/daily-notes/
rm -rf /api/recursos/
rm -rf /api/procesar-url/
```

### 3. **Actualizar Configuración:**
```typescript
// En lib/config.ts actualizar URLs si es necesario
```

---

## ✅ **Estado Actual - ACTUALIZADO:**

### 🟢 **Frontend Actualizado:**
- **✅ calendar/page.tsx**: Todas las llamadas `/api/daily-notes` cambiadas a `/api/calendar/notes`
- **✅ knowledge/page.tsx**: Todas las llamadas `/api/recursos` cambiadas a `/api/resources`
- **✅ knowledge/page.tsx**: Todas las llamadas `/api/notas-md` cambiadas a `/api/content/knowledge`

### 🟢 **Nuevos Endpoints Creados:**
- **✅ /api/resources/recent**: Endpoint para recursos recientes (usado en RecentResources.tsx)

### 🟡 **Pendientes de Crear:**
- **❌ /api/events**: Para gestión de eventos (calendario, [id])
- **❌ /api/tickets**: Para gráficos del dashboard (estadísticas, tendencias)

### 🎯 **Próximos Pasos:**

### 1. **Crear Endpoints Faltantes:**
```bash
# Crear endpoints para eventos
mkdir -p app/api/events/calendar
mkdir -p app/api/events/[id]

# Crear endpoints para tickets  
mkdir -p app/api/tickets/por-prioridad
mkdir -p app/api/tickets/tendencia-semanal
mkdir -p app/api/tickets/stats/estados
mkdir -p app/api/tickets/stats/departamentos
```

### 2. **Limpiar Endpoints Antiguos:**
```bash
# Estos ya no se usan en el frontend:
rm -rf app/api/daily-notes/
rm -rf app/api/recursos/
rm -rf app/api/notas-md/
```
