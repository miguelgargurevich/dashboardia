# Documentación de Endpoints Reorganizados

## Nuevos Endpoints con Nombres Descriptivos

### ✅ **Implementados:**

#### 1. `/api/ai/generate-note` 
- **Propósito**: Generación automática de notas usando IA (Gemini)
- **Reemplaza a**: `/api/generar-nota`
- **Método**: POST
- **Funcionalidad**: 
  - Genera contenido markdown usando IA según tipo (procedimiento, manual, guía, checklist)
  - Guarda automáticamente en la base de datos
  - Integrado con AssistantBubble
- **Estado**: ✅ **ACTIVO E INTEGRADO**

#### 2. `/api/calendar/daily-notes/*`
- **Propósito**: Gestión de notas diarias para el calendario
- **Reemplaza a**: `/api/daily-notes/*`
- **Funcionalidad**: 
  - CRUD completo de notas diarias
  - Estadísticas por fecha/mes
  - Gestión de prioridades y estados
- **Estado**: ✅ **COPIADO - PENDIENTE MIGRACIÓN**

#### 3. `/api/knowledge/notes/*`
- **Propósito**: Sistema de base de conocimiento (notas markdown)
- **Reemplaza a**: `/api/notas-md/*`
- **Funcionalidad**:
  - Listado de notas por tema
  - Obtención de contenido individual
  - Sistema de búsqueda y filtrado
- **Estado**: ✅ **COPIADO - PENDIENTE MIGRACIÓN**

## Integración del AssistantBubble

### ✅ **Funcionalidades Implementadas:**

#### 1. **Detección de Comandos**
- `"crear nota"` / `"generar nota"` / `"nueva nota"` → Wizard de creación con IA
- `"agregar url"` / `"nueva url"` → Wizard de gestión de URLs  
- `"subir recurso"` / `"cargar archivo"` → Wizard de upload de archivos

#### 2. **Wizard de Creación de Notas con IA**
- **Paso 1**: Recolección de datos (título, tema, descripción, tipo)
- **Paso 2**: Procesamiento con IA usando Gemini
- **Paso 3**: Guardado automático en base de datos
- **Extracción inteligente**: Detecta automáticamente datos en texto libre

#### 3. **Estados de Wizard**
- `noteWizardStep`: Maneja el flujo de creación de notas
- `urlWizardStep`: Maneja el flujo de URLs
- `resourceWizardStep`: Maneja el flujo de recursos

## Funciones de Parsing Inteligente

### ✅ **Implementadas:**

#### `extractNoteDataFromText()`
Extrae automáticamente de texto libre:
- Título: `titulo: Mi nota`
- Tema: `tema: notificaciones`
- Descripción: `descripcion: Contenido sobre...`
- Tipo: `tipo: procedimiento|manual|guia|checklist`

#### `extractUrlDataFromText()`
Extrae automáticamente:
- URLs válidas con regex
- Títulos y categorías
- Descripciones opcionales

## Endpoints Antiguos vs Nuevos

| Endpoint Antiguo | Endpoint Nuevo | Estado |
|------------------|----------------|---------|
| `/api/generar-nota` | `/api/ai/generate-note` | ✅ Migrado |
| `/api/daily-notes/*` | `/api/calendar/daily-notes/*` | 🟡 Copiado |
| `/api/notas-md/*` | `/api/knowledge/notes/*` | 🟡 Copiado |

## Próximos Pasos

### 🔄 **Migración Pendiente:**

1. **Actualizar Referencias en Frontend:**
   - `/app/calendar/page.tsx` → Cambiar a `/api/calendar/daily-notes`
   - `/app/knowledge/page.tsx` → Cambiar a `/api/knowledge/notes`
   - `lib/config.ts` → Actualizar URLs de endpoints

2. **Pruebas de Integración:**
   - Probar generación de notas con IA
   - Verificar compatibilidad de endpoints migrados
   - Validar funcionamiento de wizards

3. **Limpiar Endpoints Antiguos:**
   - Eliminar `/api/generar-nota` después de confirmar migración
   - Eliminar `/api/daily-notes` después de actualizar frontend
   - Eliminar `/api/notas-md` después de actualizar frontend

## Comandos de Prueba para AssistantBubble

### ✅ **Comandos Funcionando:**

1. **Crear Nota con IA:**
   ```
   crear nota
   titulo: Manual de Procedimientos
   tema: tickets
   descripcion: Manual completo para gestión de tickets
   tipo: manual
   ```

2. **Crear Nota Paso a Paso:**
   ```
   nueva nota
   [Wizard guiará paso a paso]
   ```

3. **Agregar URL:**
   ```
   agregar url
   url: https://ejemplo.com
   titulo: Documentación Externa
   tema: recursos
   ```

4. **Subir Recurso:**
   ```
   subir recurso
   [Primero adjuntar archivos, luego especificar categoría]
   ```

## Arquitectura Mejorada

### **Beneficios de la Reorganización:**

1. **URLs Semánticas**: Más descriptivas y organizadas
2. **Separación de Responsabilidades**: IA, Calendar, Knowledge
3. **Escalabilidad**: Fácil agregar nuevas funcionalidades AI
4. **Mantenibilidad**: Código mejor organizado por dominio
5. **UX Mejorado**: Interacción natural con AssistantBubble

### **Flujo de Trabajo Integrado:**

```
Usuario: "crear nota" 
    ↓
AssistantBubble detecta comando
    ↓
Wizard recolecta información
    ↓
/api/ai/generate-note procesa con IA
    ↓
Contenido guardado en BD
    ↓
Confirmación al usuario
```

---

**Nota**: Esta implementación mantiene compatibilidad total con la funcionalidad existente mientras agrega capacidades de IA avanzadas.
