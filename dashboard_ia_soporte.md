# 📘 Instrucciones para el Asistente de IA: Construcción del Dashboard de Soporte Técnico Personalizado

Este documento describe paso a paso cómo debe proceder el asistente de inteligencia artificial para construir una aplicación web integral que combine gestión técnica, seguimiento de conocimiento y productividad personal. El sistema debe usar React en el frontend, Node.js y Prisma en el backend, PostgreSQL como base de datos y debe permitir funcionalidades potenciadas por IA.

---

## 🧠 Objetivo General

Construir una **aplicación web personal de productividad y soporte técnico**, que integre:

- Dashboard con IA
- Gestión de tickets (Incidentes y Requerimientos)
- Base de conocimientos (KB)
- Recursos (videos, enlaces, archivos)
- Agenda y calendario de eventos
- Asistente IA para registro, organización y búsqueda

---

## 🧩 Módulos de la Aplicación

### 1. 📊 Dashboard Inteligente

- Muestra:q
  - Pendientes del día
  - Últimos recursos agregados
  - Tickets abiertos y su estado
  - Próximos eventos del calendario
  - Actividades recientes

### 2. 🗂️ Gestión de Recursos

- Tipos: Video, Enlace, Archivo, Nota
- Campos: título, descripción, tags, categoría, archivo/enlace
- Relación con tickets y KBs
- Subida y clasificación asistida por IA

### 3. 📚 Base de Conocimientos (KB)

- Campos por artículo:
  - `KB_ID`, título, tipo (Procedimiento, Manual, etc.), categoría, descripción, contenido, archivos, relación con tickets
  - Fecha creación/modificación, historial de uso
- IA puede sugerir KBs basados en contenido, tickets o recursos

### 4. 🎫 Seguimiento de Tickets

- Campos por ticket:
  - `Ticket_ID`, tipo (Incidente o Requerimiento), estado, sistema, descripción, solución, archivos, KBs relacionados
  - Fecha de creación / cierre
- Relación N\:N con KBs, archivos, eventos
- Creación asistida por IA

### 5. 📆 Agenda + Calendario

- Crear eventos: reuniones, tareas, capacitaciones
- Campos:
  - Título, fecha/hora, descripción, lugar, tipo
  - Relación con recursos, tickets, KBs
- Vista calendario semanal/mensual
- IA puede sugerir eventos o crear con texto natural

### 6. 🤖 Asistente con IA

- Entradas:
  - Texto, enlaces, archivos, notas de voz
- Funciones:
  - Clasificar, registrar, sugerir, relacionar, buscar
- Respuestas con contexto útil
- Integración futura con voz y chat

### 7. 🔍 Buscador Inteligente

- Búsqueda por texto, tags, tipo, fecha
- Preguntas naturales tipo:
  - “¿Qué KB usé ayer con SharePoint?”
  - “Muéstrame todos los videos de capacitación con nota”

---

## 📦 Gestión de Información y Archivos

### Tipos de Información

| Tipo             | Ejemplos                                 | Almacenamiento sugerido           |
| ---------------- | ---------------------------------------- | --------------------------------- |
| 📎 Enlaces       | YouTube, documentos en Drive, sitios web | URL + metadatos en base de datos  |
| 📁 Archivos      | PDF, Excel, Word, imágenes, zip, etc.    | Carpeta estructurada + BD         |
| 🎥 Videos        | Grabaciones, tutoriales, Teams/Meet      | Enlace + campos de contexto       |
| 📝 Notas         | Texto libre, resumen, tags               | En base de datos como campo texto |
| 📚 Documentos KB | Artículos técnicos, pasos, etc.          | En BD con referencia a archivos   |

### Estructura del modelo `Resource`

```ts
model Resource {
  id           String   @id @default(cuid())
  tipo         String   // "enlace", "archivo", "nota", "video"
  titulo       String
  descripcion  String?
  url          String?       // para enlaces y videos
  filePath     String?       // ruta si se subió archivo
  tags         String[]
  categoria    String?
  fechaCarga   DateTime @default(now())
  relacionadoCon Ticket[] | KBArticle[] | Event[]
}
```

### Almacenamiento físico

- Carpeta local (`/uploads/yyyy-mm/`) o futura integración con Drive o S3

### Registro

- Manual: Formulario + Relación
- Automático (IA): Recibe input, clasifica, genera título, tags y asociaciones

### Consulta

- Vista general
- Filtro por tipo, fecha, tags
- Búsqueda natural: “Videos con tag 'Azure' de la semana pasada”
- Relacionado a tickets, KBs y eventos

### Subida

- Drag & Drop o input para enlaces
- Backend: `/upload`, `/resource`
- IA: analiza y guarda con contexto

---

## 🛠️ Tecnologías Base

| Área          | Herramienta                    |
| ------------- | ------------------------------ |
| Frontend      | React + Tailwind + Zustand     |
| Backend       | Node.js + Express + Prisma ORM |
| Base de datos | PostgreSQL                     |
| IA            | OpenAI GPT-4o (vía API)        |
| Archivos      | Google Drive API (futuro)      |
| Autenticación | Google OAuth 2.0               |
| Calendario    | FullCalendar.io + date-fns     |

---

## 🧱 Modelo de datos (Nuevos ejemplos)

```ts
model Event {
  id            String   @id @default(cuid())
  title         String
  description   String?
  startDate     DateTime
  endDate       DateTime
  location      String?
  relatedTickets Ticket[]
  relatedKBs     KBArticle[]
  relatedResources Resource[]
  createdAt     DateTime @default(now())
}
```

---

## ✅ Tareas que debe ejecutar la IA paso a paso

1. Generar estructura de carpetas del proyecto (frontend/backend/db)
2. Crear el backend con Express, Prisma y modelos iniciales (User, Ticket, KB, Resource, Event)
3. Generar esquema de base de datos en PostgreSQL
4. Crear el frontend en React con estructura modular y rutas principales
5. Implementar FullCalendar para eventos
6. Configurar integración de IA vía API de OpenAI (clave en .env)
7. Crear componentes inteligentes: subida de archivos con análisis por IA
8. Crear formularios para registro de tickets, KBs, eventos, recursos
9. Implementar buscador con filtro y sugerencias IA
10. Integrar el Dashboard con todas las vistas conectadas

---

## 📌 Notas

- Todo debe estar optimizado para uso personal (modo oscuro, accesibilidad, rapidez)
- Mantener datos organizados con relaciones bien definidas
- Asistente IA debe tener contexto del usuario y sus proyectos

---

Fin del archivo.

