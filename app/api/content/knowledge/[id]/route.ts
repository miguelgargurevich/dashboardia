import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// PUT /api/content/knowledge/[id] - Actualizar nota de conocimiento
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }
    const { id } = context.params;
    const body = await request.json();
    // Mapear datos del frontend al formato del backend
    const noteData = {
      ...body,
      tipo: body.tipo || body.type || 'nota',
    };
    delete noteData.type;
    const response = await fetch(`${BACKEND_URL}/api/notes/${id}` , {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Knowledge API: Error updating note:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
