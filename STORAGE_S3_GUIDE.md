# 📁 Sistema de Almacenamiento S3 para Recursos

## 🌟 Resumen

Hemos implementado un sistema completo de almacenamiento en la nube usando **Supabase S3** para gestionar todos los archivos adjuntos en el Dashboard IA. Esto permite que usuarios puedan subir, ver, descargar y gestionar archivos desde cualquier sección del sistema.

## 📋 Funcionalidades Implementadas

### ✅ **Backend (Node.js + Express)**

#### 🛠️ **Servicio S3 (`S3Service.js`)**
- **Clase centralizada** para todas las operaciones con S3
- **Generación automática** de claves únicas organizadas por categoría/fecha
- **Validación** de tipos y tamaños de archivos
- **URLs firmadas** para descargas seguras
- **Metadatos** personalizados para cada archivo

#### 🌐 **Nuevas API Routes**
- `POST /api/resources/upload` - Subir archivo y crear recurso
- `GET /api/resources/download/:key` - Obtener URL de descarga firmada
- `GET /api/resources/files` - Listar archivos por categoría
- `DELETE /api/resources/s3/delete` - Eliminar archivo de S3
- `DELETE /api/resources/:id` - Eliminar recurso completo (BD + S3)

### ✅ **Frontend (Next.js + React)**

#### 🧩 **Componentes**
- **`FileUploadS3`** - Componente drag & drop para subida de archivos
- **`RecursoFormS3`** - Formulario mejorado que integra S3
- **Hook `useRecursosS3`** - Gestión de estado y operaciones S3

#### 🔗 **API Routes Proxy**
- Rutas del frontend que actúan como proxy al backend
- Manejo centralizado de autenticación
- Gestión de errores consistente

## 🗂️ Organización de Archivos en S3

### 📂 Estructura de Carpetas
```
bucket-name/
├── recursos/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── documentacion/
│   │   │   ├── herramientas/
│   │   │   └── ...
│   │   └── 02/
│   └── ...
├── notas/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── actividades-diarias/
│   │   │   ├── emergencias/
│   │   │   └── ...
│   │   └── 02/
│   └── ...
└── eventos/
    ├── 2025/
    │   ├── 01/
    │   │   ├── mantenimiento/
    │   │   ├── capacitacion/
    │   │   └── ...
    │   └── 02/
    └── ...
```

### 🏷️ Nomenclatura de Archivos
- **Patrón**: `categoria/año/mes/subcategoria/uuid_nombre-limpio.ext`
- **Ejemplo**: `recursos/2025/01/documentacion/a1b2c3d4_manual-usuario.pdf`

## 🚀 Cómo Usar el Sistema

### 1. **Desde Recursos**
```typescript
import FileUploadS3 from '@/components/FileUploadS3';

<FileUploadS3
  categoria="recursos"
  subcategoria="documentacion"
  onUploadComplete={(result) => {
    console.log('Archivo subido:', result);
    // Actualizar lista de recursos
  }}
  multiple={true}
  maxFileSize={100} // 100MB
/>
```

### 2. **Desde Notas del Calendario**
```typescript
import useRecursosS3 from '@/hooks/useRecursosS3';

const { uploadRecurso } = useRecursosS3();

const handleFileUpload = async (file: File) => {
  const result = await uploadRecurso(
    file,
    'Adjunto de nota',
    'Archivo adjunto a nota diaria',
    'notas',
    'actividades-diarias',
    ['nota', 'adjunto']
  );
  
  if (result) {
    // Agregar ID del recurso a la nota
    noteData.relatedResources.push(result.recurso.id);
  }
};
```

### 3. **Desde Eventos**
```typescript
const handleEventFileUpload = async (file: File, eventData: any) => {
  const result = await uploadRecurso(
    file,
    `Recurso para ${eventData.title}`,
    `Archivo relacionado al evento ${eventData.title}`,
    'eventos',
    eventData.eventType,
    ['evento', eventData.eventType]
  );
  
  if (result) {
    eventData.relatedResources.push(result.recurso.id);
  }
};
```

## 🔧 Configuración Requerida

### Environment Variables
```bash
# Supabase S3 Configuration
SUPABASE_S3_ENDPOINT=https://xxxx.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=us-east-1
SUPABASE_S3_BUCKET=your-bucket-name
SUPABASE_S3_ACCESS_KEY_ID=your-access-key
SUPABASE_S3_SECRET_ACCESS_KEY=your-secret-key
SUPABASE_S3_API_KEY=your-api-key
```

### Dependencias Necesarias
```bash
# Backend
npm install multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Frontend (ya incluidas en Next.js)
# No requiere dependencias adicionales
```

## 🛡️ Seguridad y Validaciones

### ✅ **Validaciones de Archivos**
- **Tamaño máximo**: 100MB por archivo
- **Tipos permitidos**: 
  - Documentos: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, md
  - Imágenes: jpg, jpeg, png, gif, bmp, webp, svg
  - Videos: mp4, avi, mov, wmv, mkv, webm
  - Audio: mp3, wav, aac, m4a, ogg
  - Archivos: zip, rar, 7z, tar, gz
  - Otros: csv, json, xml, html, css, js

### 🔒 **Seguridad**
- **Autenticación obligatoria** en todas las rutas
- **URLs firmadas** para descargas (expiración configurable)
- **Validación** de tipos de archivo en frontend y backend
- **Nombres únicos** para evitar conflictos
- **Eliminación automática** de S3 al eliminar recurso

## 📊 Flujo de Trabajo

### Subir Archivo
1. Usuario selecciona archivo en componente `FileUploadS3`
2. Validaciones en frontend (tipo, tamaño)
3. Formulario con metadatos (título, descripción, tags)
4. Envío a `/api/resources/upload`
5. Backend valida y sube a S3
6. Se crea registro en base de datos
7. Retorna información completa del recurso

### Descargar Archivo
1. Usuario hace clic en enlace de descarga
2. Solicitud a `/api/resources/download/:key`
3. Backend genera URL firmada con expiración
4. Usuario es redirigido a URL de descarga

### Eliminar Archivo
1. Usuario elimina recurso
2. Backend obtiene información del archivo
3. Elimina archivo de S3
4. Elimina registro de base de datos

## 🎯 Próximos Pasos

### Mejoras Planificadas
- [ ] **Vista previa** de archivos (PDF, imágenes)
- [ ] **Compresión automática** de imágenes
- [ ] **Generación de thumbnails** para videos
- [ ] **Búsqueda de texto** en documentos PDF
- [ ] **Versionado** de archivos
- [ ] **Papelera** de reciclaje para archivos eliminados
- [ ] **Sincronización** con servicios externos (Google Drive, OneDrive)

### Integraciones Futuras
- [ ] **OCR** para extraer texto de imágenes
- [ ] **IA** para categorización automática
- [ ] **Análisis de contenido** para tags automáticos
- [ ] **Detección de duplicados**

## 🐛 Resolución de Problemas

### Problemas Comunes

#### Error: "Archivo demasiado grande"
- **Causa**: Archivo excede 100MB
- **Solución**: Comprimir archivo o dividir en partes

#### Error: "Tipo de archivo no permitido"
- **Causa**: Extensión no está en lista permitida
- **Solución**: Convertir a formato permitido

#### Error: "Error subiendo a S3"
- **Causa**: Configuración incorrecta de S3
- **Solución**: Verificar variables de entorno

#### Error: "Token de autenticación inválido"
- **Causa**: Usuario no autenticado
- **Solución**: Renovar sesión

### Logs y Debugging
```bash
# Ver logs del backend
tail -f backend/logs/app.log

# Verificar configuración S3
node -e "console.log(process.env.SUPABASE_S3_ENDPOINT)"
```

## 📞 Soporte

Para problemas o dudas sobre el sistema de archivos S3:
1. Revisar esta documentación
2. Verificar configuración de environment variables
3. Revisar logs del backend
4. Contactar al equipo de desarrollo
