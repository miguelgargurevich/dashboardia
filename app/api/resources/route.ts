import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../lib/auth';

// Definir los tipos de recursos que soportamos
export interface Recurso {
  id: string;
  tipo: string; // 'url', 'archivo', 'video', 'documento'
  titulo: string;
  descripcion?: string;
  url?: string;
  filePath?: string;
  tags: string[];
  categoria?: string;
  fechaCarga: Date;
  tipoArchivo?: string; // 'pdf', 'word', 'excel', 'video', 'imagen', etc.
  tamaño?: number; // en bytes
  estado?: string; // 'activo', 'archivado', 'pendiente'
}

// GET /api/recursos - Obtener todos los recursos con filtros

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener recursos' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener recursos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/recursos - Crear nuevo recurso
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const {
      tipo,
      titulo,
      descripcion,
      url,
      filePath,
      tags = [],
      categoria,
      tipoArchivo,
      tamaño
    } = body;

    // Validaciones básicas
    if (!tipo || !titulo) {
      return NextResponse.json(
        { success: false, error: 'Tipo y título son requeridos' },
        { status: 400 }
      );
    }

    if (tipo === 'url' && !url) {
      return NextResponse.json(
        { success: false, error: 'URL es requerida para recursos de tipo URL' },
        { status: 400 }
      );
    }

    if (tipo === 'archivo' && !filePath) {
      return NextResponse.json(
        { success: false, error: 'Ruta de archivo es requerida para recursos de tipo archivo' },
        { status: 400 }
      );
    }

    // Preparar datos para el backend
    const datosRecurso = {
      tipo,
      titulo,
      descripcion,
      url,
      filePath,
      tags,
      categoria: categoria || 'general', // Usar categoria directamente
      fechaCarga: new Date()
    };

    // Enviar al backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources`, {
      method: 'POST',
      headers: createAuthHeaders(request),
      body: JSON.stringify(datosRecurso)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en el backend');
    }

    const nuevoRecurso = await response.json();

    return NextResponse.json({
      success: true,
      recurso: {
        ...nuevoRecurso,
        tipoArchivo: tipoArchivo || determinarTipoArchivo(filePath || url),
        tamaño,
        estado: 'activo'
      }
    });

  } catch (error) {
    console.error('Error creando recurso:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear recurso' },
      { status: 500 }
    );
  }
}

// Función auxiliar para determinar el tipo de archivo
function determinarTipoArchivo(rutaOUrl?: string): string {
  if (!rutaOUrl) return 'desconocido';

  const extension = rutaOUrl.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'powerpoint';
    case 'txt':
      return 'texto';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'aac':
      return 'audio';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'imagen';
    case 'zip':
    case 'rar':
    case '7z':
      return 'archivo_comprimido';
    default:
      // Si es una URL, determinar por contenido
      if (rutaOUrl.includes('youtube.com') || rutaOUrl.includes('vimeo.com')) {
        return 'video';
      } else if (rutaOUrl.startsWith('http')) {
        return 'url';
      }
      return 'desconocido';
  }
}
