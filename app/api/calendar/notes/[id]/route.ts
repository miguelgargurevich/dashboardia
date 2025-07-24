// app/api/calendar/notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    
    // Mapear datos del frontend al formato del backend
    const noteData = {
      ...body,
      // Mapear 'type' a 'tipo' si viene del frontend
      tipo: body.type || body.tipo
    };
    
    // Remover el campo 'type' para evitar conflictos
    delete noteData.type;
    
    // Usar el endpoint unificado de notas en lugar del endpoint específico de daily-notes
    const response = await fetch(`${BACKEND_URL}/api/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Adaptar la respuesta al formato esperado por el frontend
    const adaptedResponse = {
      ...data,
      type: data.tipo,
      date: data.date || data.createdAt
    };

    return NextResponse.json(adaptedResponse);
  } catch (error) {
    console.error('Error updating daily note:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;
    // Usar el endpoint unificado de notas en lugar del endpoint específico de daily-notes
    const response = await fetch(`${BACKEND_URL}/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting daily note:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
