import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const tema = searchParams.get('tema');
    
    // Construir URL para el backend
    const backendUrl = tema 
      ? `${BACKEND_URL}/api/notes?tema=${encodeURIComponent(tema)}`
      : `${BACKEND_URL}/api/notes`;
    
    // Obtener notas desde el backend
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    
    // Si se especifica un tema, formatear respuesta similar a la anterior
    if (tema) {
      const notasDelTema = data.filter((nota: any) => nota.tema === tema);
      
      const archivosConInfo = notasDelTema.map((nota: any) => ({
        id: nota.id,
        nombre: `${nota.title}.md`, // Mantener compatibilidad
        nombreSinExtension: nota.title,
        rutaRelativa: `notes/${nota.id}`, // Nueva ruta basada en ID
        fechaModificacion: nota.updatedAt,
        tamaño: nota.content?.length || 0,
        tipo: nota.tipo,
        descripcion: nota.descripcion,
        tags: nota.tags,
        status: nota.status
      }));
      
      return NextResponse.json({
        success: true,
        tema,
        archivos: archivosConInfo,
        cantidad: archivosConInfo.length
      });
    }
    
    // Si no se especifica tema, agrupar por tema
    const archivosPorTema: Record<string, any[]> = {};
    
    data.forEach((nota: any) => {
      if (!archivosPorTema[nota.tema]) {
        archivosPorTema[nota.tema] = [];
      }
      
      archivosPorTema[nota.tema].push({
        id: nota.id,
        nombre: `${nota.title}.md`,
        nombreSinExtension: nota.title,
        rutaRelativa: `notes/${nota.id}`,
        fechaModificacion: nota.updatedAt,
        tamaño: nota.content?.length || 0,
        tipo: nota.tipo,
        descripcion: nota.descripcion,
        tags: nota.tags,
        status: nota.status
      });
    });
    
    // Estadísticas
    const totalArchivos = data.length;
    const temas = Object.keys(archivosPorTema);
    
    return NextResponse.json({
      success: true,
      archivosPorTema,
      estadisticas: {
        totalArchivos,
        totalTemas: temas.length,
        temas: temas.map(tema => ({
          nombre: tema,
          cantidad: archivosPorTema[tema].length
        }))
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { nombre, tema, contenido, etiquetas } = body;

    // Validaciones básicas
    if (!nombre || !tema || !contenido) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, tema, contenido' },
        { status: 400 }
      );
    }

    // Preparar datos para el backend
    const noteData = {
      title: nombre,
      content: contenido,
      tema: tema,
      tipo: 'nota',
      descripcion: `Nota creada desde Knowledge Base: ${nombre}`,
      tags: etiquetas || [],
      status: 'activo'
    };

    // Crear nota en el backend
    const response = await fetch(`${BACKEND_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      nota: data,
      message: 'Nota creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando nota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
