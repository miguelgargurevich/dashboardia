import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// Configuración para archivos
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.csv', '.zip', '.rar', '.7z',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.aac'
];

// POST /api/recursos/upload - Subir archivo
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    // Asegurar que el directorio de uploads existe
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const tema = formData.get('tema') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!titulo || !tema) {
      return NextResponse.json(
        { success: false, error: 'Título y tema son requeridos' },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `El archivo es demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validar extensión del archivo
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Tipo de archivo no permitido. Extensiones permitidas: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const publicPath = `/uploads/${fileName}`;

    // Guardar el archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // Procesar tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Determinar tipo de archivo
    const tipoArchivo = determinarTipoArchivo(fileExtension);

    // Crear el recurso en la base de datos
    const recursoData = {
      tipo: 'archivo',
      titulo,
      descripcion,
      filePath: publicPath,
      tags: tagsArray,
      categoria: tema,
      tipoArchivo,
      tamaño: file.size,
      nombreOriginal: file.name
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources`, {
      method: 'POST',
      headers: createAuthHeaders(request),
      body: JSON.stringify(recursoData)
    });

    if (!response.ok) {
      // Si falla la creación en BD, eliminar el archivo subido
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error eliminando archivo después de fallo en BD:', error);
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error creando recurso en base de datos');
    }

    const nuevoRecurso = await response.json();

    return NextResponse.json({
      success: true,
      recurso: {
        ...nuevoRecurso,
        tema: nuevoRecurso.categoria,
        tipoArchivo,
        tamaño: file.size,
        nombreOriginal: file.name,
        rutaArchivo: publicPath
      },
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    );
  }
}

// Función auxiliar para determinar el tipo de archivo
function determinarTipoArchivo(extension: string): string {
  switch (extension.toLowerCase()) {
    case '.pdf':
      return 'pdf';
    case '.doc':
    case '.docx':
      return 'word';
    case '.xls':
    case '.xlsx':
      return 'excel';
    case '.ppt':
    case '.pptx':
      return 'powerpoint';
    case '.txt':
    case '.md':
      return 'texto';
    case '.csv':
      return 'hoja_calculo';
    case '.mp4':
    case '.avi':
    case '.mov':
    case '.wmv':
      return 'video';
    case '.mp3':
    case '.wav':
    case '.aac':
      return 'audio';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.bmp':
    case '.webp':
      return 'imagen';
    case '.zip':
    case '.rar':
    case '.7z':
      return 'archivo_comprimido';
    default:
      return 'desconocido';
  }
}
