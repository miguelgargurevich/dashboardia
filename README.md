# Dashboard IA Soporte - Frontend

Frontend moderno construido con **Next.js 15**, **React 18**, **TypeScript** y **Tailwind CSS**.

## Estructura principal

...pendiente de actualizar

## Tecnologías


## Instalación y uso

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el frontend:
   ```bash
   npm run dev
   ```
3. El frontend estará disponible en `http://localhost:3000`

## Autenticación

  - **admin@soporte.com / admin123**
  - **usuario@soporte.com / user123**
  - **miguel@soporte.com / miguel123**
  - **sofia@soporte.com / sofia456**
  - **carlos@soporte.com / carlos789**

## Personalización de estilos


## Asistente IA (Chatbot)


## Estructura recomendada


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
