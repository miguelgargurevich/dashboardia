# Dashboard IA Soporte - Frontend

Frontend moderno construido con **Next.js 15**, **React 18**, **TypeScript** y **Tailwind CSS**.

## Estructura principal

- `/app` : Páginas y componentes del frontend (app router)
  - `/app/page.tsx` : Redirección automática según autenticación
  - `/app/login/page.tsx` : Login con estilos modernos y validación
  - `/app/dashboard/page.tsx` : Dashboard protegido y botón de logout
  - `/app/layout.tsx` : Layout global e importación de estilos
  - `/app/globals.css` : Estilos globales con Tailwind

## Tecnologías

- Next.js 15 (app router)
- React 18
- TypeScript
- Tailwind CSS (con colores y fuentes personalizadas)
- Prisma ORM (backend)
- PostgreSQL (backend)

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

- El login utiliza los usuarios del seed del backend:
  - **admin@soporte.com / admin123**
  - **usuario@soporte.com / user123**
  - **miguel@soporte.com / miguel123**
  - **sofia@soporte.com / sofia456**
  - **carlos@soporte.com / carlos789**

## Personalización de estilos

- Los colores y fuentes se configuran en `tailwind.config.js`.
- El layout global y los estilos base están en `app/layout.tsx` y `app/globals.css`.

## Asistente IA (Chatbot)

- Flotante en el dashboard, solo visible si el usuario está logueado.
- Permite consultas técnicas, registro guiado y ayuda sobre el sistema.
- Soporta adjuntar **múltiples archivos** (PDF, Word, Excel, videos, imágenes, texto) por drag & drop o selector, asociados a un tema.
- Los archivos se envían al backend por el endpoint `/api/upload`.
- El asistente guía el registro y puede enviar credenciales por correo.

## Estructura recomendada

- Mantén solo la carpeta `app` en la raíz para el frontend.
- El backend se encuentra en la carpeta `backend`.

---
Autor: Miguel F. Gargurevich
