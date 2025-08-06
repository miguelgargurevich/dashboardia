# Dashboard IA Soporte

**Dashboard IA Soporte** es una solución integral para la gestión de soporte técnico, productividad y conocimiento, combinando un frontend robusto en Next.js/React con un backend Node.js/Prisma y PostgreSQL. Incluye autenticación, paneles de visualización, gestión de tickets, recursos, eventos, notas, base de conocimiento y un asistente IA (chatbot) con soporte para archivos adjuntos.

---

## 🧠 Propósito de la Aplicación

Centralizar la gestión de soporte técnico, recursos, eventos, tickets y conocimiento en una sola plataforma, potenciando la productividad personal y de equipos con ayuda de IA.

---

## 📦 Estructura del Proyecto

```
├── app/                  # Frontend principal (Next.js App Router)
│   ├── api/              # Endpoints API (auth, calendar, content, events, resources, tickets, IA, etc.)
│   ├── components/       # Componentes reutilizables (dashboard, charts, IA, modales, etc.)
│   ├── configuracion/    # Configuración y ajustes
│   ├── dashboard/        # Página principal del dashboard
│   ├── knowledge/        # Base de conocimiento
│   ├── lib/              # Librerías utilitarias (auth, gemini, etc.)
│   ├── login/            # Página de login
│   ├── calendar/         # Calendario de eventos y notas
│   ├── globals.css       # Estilos globales
│   ├── layout.tsx        # Layout global
│   └── page.tsx          # Página raíz
├── backend/              # Backend Node.js (API REST, Prisma, seed, migraciones)
│   ├── app.js            # Servidor principal
│   ├── prisma/           # Esquema y migraciones de base de datos
│   └── src/              # Rutas y lógica de backend
├── lib/                  # Configuración compartida
├── public/               # Archivos públicos y base de conocimiento en markdown
│   └── notas-md/         # Manuales y procedimientos en markdown
├── tailwind.config.js    # Configuración de Tailwind CSS
├── postcss.config.js     # Configuración de PostCSS
├── tsconfig*.json        # Configuración de TypeScript
├── package.json          # Dependencias y scripts
└── README.md             # Documentación del proyecto
```

---

## 🗄️ Esquema de Base de Datos (Prisma/PostgreSQL)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
}

model Resource {
  id          String   @id @default(cuid())
  tipo        String
  titulo      String
  descripcion String?
  url         String?
  filePath    String?
  tags        String[]
  categoria   String?
  fechaCarga  DateTime @default(now())
}

model Event {
  id                 String   @id @default(cuid())
  title              String
  description        String?
  startDate          DateTime
  endDate            DateTime
  location           String?
  createdAt          DateTime @default(now())
  codigoDana         String?
  diaEnvio           String?
  modo               String?
  validador          String?
  eventType          String
  recurrencePattern  String
  relatedResources   String[]
}

model Note {
  id          String   @id @default(cuid())
  title       String
  content     String
  tipo        String   @default("nota")
  tags        String[]
  context     String?
  keyPoints   String[]
  status      String   @default("activo")
  date        String?
  priority    String?
  relatedResources String[]
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TipoEvento {
  id          String   @id @default(cuid())
  nombre      String   @unique
  icono       String
  color       String
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TipoNota {
  id          String   @id @default(cuid())
  nombre      String   @unique
  descripcion String
  icono       String
  color       String
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TipoRecurso {
  id          String   @id @default(cuid())
  nombre      String   @unique
  descripcion String
  icono       String
  color       String
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## ⚙️ Especificaciones Técnicas

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Autenticación:** JWT, seed de usuarios
- **IA:** Google Gemini API u OpenAI (configurable)
- **Archivos:** Soporte para PDF, Word, Excel, imágenes, videos, texto
- **Infraestructura:** Deploy automático en Vercel (frontend) y Render (backend)

---

## 🚀 Especificaciones Funcionales

- Dashboard interactivo con métricas y gráficas
- Gestión de tickets (incidentes y requerimientos)
- Base de conocimiento (manuales, procedimientos, artículos)
- Gestión de recursos (archivos, enlaces, videos, notas)
- Calendario de eventos y notas diarias
- Asistente IA (chatbot) con soporte para archivos adjuntos
- Personalización de colores, iconos y configuración
- Búsqueda inteligente y filtros avanzados
- Relación entre tickets, eventos, recursos y notas

---

## 📝 Prompt para crear otra versión de la app

```
Eres un asistente experto en desarrollo de dashboards de soporte técnico y productividad. Quiero que generes una nueva versión de la aplicación "Dashboard IA Soporte" con las siguientes características:

- Frontend en Next.js (App Router), React, TypeScript y Tailwind CSS
- Backend en Node.js, Express, Prisma y PostgreSQL
- Módulos: Dashboard, Tickets, Base de Conocimiento, Recursos, Eventos, Notas, Asistente IA
- Autenticación JWT y seed de usuarios
- Soporte para archivos adjuntos y subida a S3 o local
- IA integrada para sugerencias, clasificación y búsqueda
- Personalización de colores, iconos y configuración
- Búsqueda avanzada y filtros
- Relación entre tickets, eventos, recursos y notas
- Documentación técnica y funcional clara

Incluye la estructura de carpetas, el esquema de la base de datos, y especificaciones técnicas y funcionales. Optimiza para accesibilidad, rendimiento y escalabilidad.
```

---

Autor: Miguel F. Gargurevich

# Dashboard IA Soporte



---

## Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Principales](#tecnologías-principales)
- [Instalación y Uso](#instalación-y-uso)
- [Autenticación](#autenticación)
- [Funcionalidades Destacadas](#funcionalidades-destacadas)
- [Personalización de Estilos](#personalización-de-estilos)
- [Recomendaciones de Organización](#recomendaciones-de-organización)
- [Autor](#autor)

---

## Descripción General

Dashboard IA Soporte es una solución moderna para la gestión de soporte técnico, combinando un frontend robusto en Next.js/React con un backend Node.js/Prisma y PostgreSQL. Incluye autenticación, paneles de visualización, gestión de tickets, recursos, eventos, notas, base de conocimiento y un asistente IA (chatbot) con soporte para archivos adjuntos.

---

## Estructura del Proyecto

```
├── app/                  # Frontend principal (Next.js App Router)
│   ├── api/              # Endpoints API (auth, calendar, content, events, resources, tickets, IA, etc.)
│   ├── components/       # Componentes reutilizables (dashboard, charts, IA, modales, etc.)
│   ├── configuracion/    # Configuración y ajustes
│   ├── dashboard/        # Página principal del dashboard
│   ├── knowledge/        # Base de conocimiento
│   ├── lib/              # Librerías utilitarias (auth, gemini, etc.)
│   ├── login/            # Página de login
│   ├── calendar/         # Calendario de eventos y notas
│   ├── globals.css       # Estilos globales
│   ├── layout.tsx        # Layout global
│   └── page.tsx          # Página raíz
├── backend/              # Backend Node.js (API REST, Prisma, seed, migraciones)
│   ├── app.js            # Servidor principal
│   ├── prisma/           # Esquema y migraciones de base de datos
│   └── src/              # Rutas y lógica de backend
├── lib/                  # Configuración compartida
├── public/               # Archivos públicos y base de conocimiento en markdown
│   └── notas-md/         # Manuales y procedimientos en markdown
├── tailwind.config.js    # Configuración de Tailwind CSS
├── postcss.config.js     # Configuración de PostCSS
├── tsconfig*.json        # Configuración de TypeScript
├── package.json          # Dependencias y scripts
└── README.md             # Documentación del proyecto
```

---

## Tecnologías Principales

- **Frontend:**
  - Next.js 15 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS (colores y fuentes personalizadas)

- **Backend:**
  - Node.js
  - Prisma ORM
  - PostgreSQL

- **Otros:**
  - Autenticación personalizada
  - Asistente IA (Google Gemini API u OpenAI, según configuración)
  - Visualización de datos (gráficas, calendarios, etc.)
  - Soporte para archivos adjuntos (PDF, Word, Excel, imágenes, videos, texto)

---

## Instalación y Uso

1. Clona el repositorio y entra en la carpeta principal.
2. Instala las dependencias del frontend:
   ```bash
   npm install
   ```
3. Inicia el frontend:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en [http://localhost:3000](http://localhost:3000)
4. (Opcional) Inicia el backend desde la carpeta `backend`:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

---

## Autenticación

El login utiliza los usuarios del seed del backend:

- **admin@soporte.com / admin123**
- **usuario@soporte.com / user123**
- **miguel@soporte.com / miguel123**
- **sofia@soporte.com / sofia456**
- **carlos@soporte.com / carlos789**

---

## Funcionalidades Destacadas

- **Dashboard interactivo:** Panel principal con gráficas de tickets, eventos, recursos recientes y estadísticas semanales.
- **Gestión de tickets:** Visualización, filtrado, estadísticas y tendencias de tickets por prioridad, departamento y tiempo.
- **Eventos y calendario:** Gestión de eventos, calendario interactivo, notas diarias y eventos próximos.
- **Base de conocimiento:** Acceso a manuales, procedimientos y recursos en markdown.
- **Recursos:** Subida, consulta y gestión de archivos recientes.
- **Notas diarias:** Registro y consulta de notas diarias asociadas a eventos o usuarios.
- **Asistente IA (Chatbot):**
  - Flotante en el dashboard, visible solo para usuarios autenticados.
  - Consultas técnicas, ayuda guiada y registro de información.
  - Soporte para adjuntar múltiples archivos (PDF, Word, Excel, imágenes, videos, texto) por drag & drop o selector.
  - Los archivos se envían al backend por el endpoint `/api/upload`.
  - El asistente puede guiar el registro y enviar credenciales por correo.
- **Personalización de Colores e Iconos:** Configuración de colores y fuentes desde el panel de configuración.

---

## Personalización de Estilos

- Los colores y fuentes se configuran en `tailwind.config.js`.
- El layout global y los estilos base están en `app/layout.tsx` y `app/globals.css`.

---

## Recomendaciones de Organización

- Mantén solo la carpeta `app` en la raíz para el frontend.
- El backend se encuentra en la carpeta `backend`.
- Los manuales y procedimientos deben estar en `public/notas-md/` en formato markdown.

---

## Autor

Miguel F. Gargurevich
