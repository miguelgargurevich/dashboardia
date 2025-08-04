import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * GET /api/content/knowledge
 * Obtener notas/contenido de conocimiento
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    console.log('🔍 Knowledge API: Request received');
    console.log('📍 Query string:', queryString);
    
    // Usar el endpoint unificado de notas del backend
    const backendUrl = `${BACKEND_URL}/api/notes?${queryString}`;
    console.log('🎯 Backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Backend response data count:', Array.isArray(data) ? data.length : 'not array');
    
    if (!response.ok) {
      console.error('❌ Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Retornar todas las notas para el panel de conocimiento
    const knowledgeNotes = Array.isArray(data) ? data : [];

    console.log('🔄 Knowledge notes returned:', knowledgeNotes.length);

    return NextResponse.json(knowledgeNotes);
  } catch (error) {
    console.error('Error fetching knowledge content:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content/knowledge
 * Crear nueva nota de conocimiento
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    
    console.log('🟢 Knowledge API: Creating note with body:', body);
    console.log('🔑 Authorization header:', request.headers.get('Authorization') ? 'Present' : 'Missing');
    
    // Preparar datos de la nota
    const noteData = {
      ...body,
      tipo: body.tipo || 'nota',
      status: body.status || 'activo'
    };
    
    console.log('🚀 Knowledge API: Sending to backend:', noteData);
    
    const response = await fetch(`${BACKEND_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    console.log('📡 Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Backend response data:', data);
    
    if (!response.ok) {
      console.error('❌ Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Knowledge API: Success, returning:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌ Knowledge API: Error creating note:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/knowledge
 * Eliminar múltiples notas de conocimiento
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];
    
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron IDs para eliminar' },
        { status: 400 }
      );
    }

    console.log('🗑️ Knowledge API: Deleting notes with IDs:', ids);
    
    const deletePromises = ids.map(id => 
      fetch(`${BACKEND_URL}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json',
        },
      })
    );

    const responses = await Promise.all(deletePromises);
    const results = await Promise.all(
      responses.map(async (response, index) => ({
        id: ids[index],
        success: response.ok,
        status: response.status,
        data: response.ok ? await response.json() : await response.text()
      }))
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ Knowledge API: Deleted ${successCount} notes, ${failureCount} failures`);

    return NextResponse.json({
      success: true,
      deleted: successCount,
      failed: failureCount,
      results
    });
  } catch (error) {
    console.error('❌ Knowledge API: Error deleting notes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
