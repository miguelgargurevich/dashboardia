# Arquitectura de Configuración del Dashboard IA

## Resumen de APIs de Configuración

El sistema maneja la configuración dinámica a través de varias APIs especializadas. Cada una tiene un propósito específico y es importante entender las relaciones entre ellas.

## APIs Principales

### 1. `/api/config/temas`
- **Propósito**: Gestión de temas para organizar contenido
- **Fuente de verdad**: Tabla `Tema` en BD
- **Campos importantes**: `nombre`, `descripcion`, `color`, `activo`

### 2. `/api/config/tipos-eventos` 
- **Propósito**: Gestión de tipos de eventos para el calendario
- **Fuente de verdad**: Tabla `TipoEvento` en BD
- **Campos importantes**: `nombre`, `descripcion`, `color`, `icono`, `activo`

### 3. `/api/config/tipos-notas`
- **Propósito**: Gestión de tipos de notas para el knowledge base
- **Fuente de verdad**: Tabla `TipoNota` en BD  
- **Campos importantes**: `nombre`, `descripcion`, `color`, `icono`, `activo`

### 4. `/api/config/tipos-recursos`
- **Propósito**: Gestión de tipos de recursos para archivos y documentos
- **Fuente de verdad**: Tabla `TipoRecurso` en BD
- **Campos importantes**: `nombre`, `descripcion`, `color`, `icono`, `activo`

## API Auxiliar

### `/api/config/colores`
- **Propósito**: Paleta estándar de colores para la interfaz de administración
- **Uso**: Proporciona opciones de colores predefinidos para que los administradores elijan
- **⚠️ IMPORTANTE**: NO es la fuente de verdad para los colores
- **Fuente de verdad real**: Campo `color` en cada tipo individual (temas, eventos, notas, recursos)

## Flujo de Colores

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ API /colores    │───▶│ Panel de Config  │───▶│ Tipo Individual     │
│ (Opciones)      │    │ (Selección)      │    │ (Fuente de Verdad)  │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
     Catálogo              Interfaz                 Base de Datos
```

## Migración Completada

✅ **Antes**: Sistema basado en archivos JSON estáticos
- `public/temas.json`
- `public/tiposEventos.json` 
- `public/tiposNotas.json`
- `public/tiposRecursos.json`

✅ **Ahora**: Sistema dinámico basado en base de datos
- Configuración en tiempo real
- APIs RESTful completas
- Interfaz de administración
- Datos persistentes y escalables

## Uso en Componentes

### Para mostrar datos (lectura):
```typescript
// Usar los hooks de configuración
const { getEventoConfig } = useEventosConfig();
const config = getEventoConfig(tipoEvento);
const color = config.color; // ← Fuente de verdad
```

### Para administrar tipos (escritura):
```typescript
// Cargar paleta de colores para selección
const colores = await fetch('/api/config/colores');
// Guardar el color elegido en el tipo específico
await fetch('/api/config/tipos-eventos', {
  body: JSON.stringify({ 
    nombre: 'Reunión',
    color: colorElegido // ← Se guarda en la BD como fuente de verdad
  })
});
```

## Beneficios de esta Arquitectura

1. **Separación clara**: API de colores para UI, tipos individuales para lógica
2. **Flexibilidad**: Administradores pueden elegir de una paleta o crear colores custom
3. **Consistencia**: Paleta estándar asegura coherencia visual
4. **Escalabilidad**: Fácil agregar nuevos colores o tipos
5. **Mantenibilidad**: Clara separación de responsabilidades
