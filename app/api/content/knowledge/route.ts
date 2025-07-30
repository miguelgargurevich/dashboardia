import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
    
    // Si se especifica un tema, formatear respuesta para compatibilidad con frontend
    if (tema) {
      const notasDelTema = data.filter((nota: any) => nota.tema === tema);
      
      // Mantener nombre "archivosConInfo" por compatibilidad con frontend,
      // aunque ahora son notas de base de datos
      const archivosConInfo = notasDelTema.map((nota: any) => ({
        id: nota.id,
        nombre: `${nota.title}.md`, // Formato .md por compatibilidad con frontend
        nombreSinExtension: nota.title,
        content: nota.content, // Contenido desde base de datos
        rutaRelativa: `notes/${nota.id}`, // Ruta virtual basada en ID de base de datos
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
        archivos: archivosConInfo, // Nombre mantenido por compatibilidad con frontend
        cantidad: archivosConInfo.length
      });
    }
    
    // Si no se especifica tema, agrupar todas las notas por tema
    // Mantener nombre "archivosPorTema" por compatibilidad con frontend,
    // aunque ahora son notas de base de datos agrupadas por tema
    const archivosPorTema: Record<string, any[]> = {};
    
    data.forEach((nota: any) => {
      if (!archivosPorTema[nota.tema]) {
        archivosPorTema[nota.tema] = [];
      }
      
      archivosPorTema[nota.tema].push({
        id: nota.id,
        nombre: `${nota.title}.md`, // Formato .md por compatibilidad con frontend
        nombreSinExtension: nota.title,
        content: nota.content, // Contenido desde base de datos
        rutaRelativa: `notes/${nota.id}`, // Ruta virtual basada en ID de base de datos
        fechaModificacion: nota.updatedAt,
        tamaño: nota.content?.length || 0,
        tipo: nota.tipo,
        descripcion: nota.descripcion,
        tags: nota.tags,
        status: nota.status
      });
    });
    
    // Estadísticas de notas (no archivos físicos)
    const totalArchivos = data.length; // Nombre mantenido por compatibilidad
    const temas = Object.keys(archivosPorTema);
    
    return NextResponse.json({
      success: true,
      archivosPorTema, // Nombre mantenido por compatibilidad con frontend
      estadisticas: {
        totalArchivos, // Realmente son totalNotas, pero mantenemos nombre
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

export async function DELETE(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    const { id, nombre, tema } = body;

    // Si tenemos ID, eliminar directamente
    if (id) {
      const deleteResponse = await fetch(`${BACKEND_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        return NextResponse.json(
          { error: error.error || 'Error eliminando la nota' },
          { status: deleteResponse.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Nota eliminada exitosamente'
      });
    }

    // Fallback: eliminar por nombre y tema (para compatibilidad)
    if (!nombre) {
      return NextResponse.json(
        { error: 'Se requiere el ID o el nombre de la nota para eliminarla' },
        { status: 400 }
      );
    }

    // Buscar la nota por título y tema en el backend
    const searchUrl = `${BACKEND_URL}/api/notes?search=${encodeURIComponent(nombre)}${tema ? `&tema=${encodeURIComponent(tema)}` : ''}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: 'Error buscando la nota' },
        { status: searchResponse.status }
      );
    }

    const notes = await searchResponse.json();
    
    // Buscar la nota exacta en los resultados
    const noteToDelete = notes.find((note: any) => 
      note.title === nombre || note.title === nombre.replace('.md', '') // Compatibilidad con nombres .md del frontend
    );

    if (!noteToDelete) {
      return NextResponse.json(
        { error: 'Nota no encontrada en la base de datos' },
        { status: 404 }
      );
    }

    // Eliminar la nota del backend
    const deleteResponse = await fetch(`${BACKEND_URL}/api/notes/${noteToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      return NextResponse.json(
        { error: error.error || 'Error eliminando la nota' },
        { status: deleteResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nota eliminada exitosamente',
      deletedNote: {
        id: noteToDelete.id,
        title: noteToDelete.title,
        tema: noteToDelete.tema
      }
    });

  } catch (error) {
    console.error('Error eliminando nota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
