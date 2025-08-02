import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

// PUT /api/config/tipos-recursos/[id] - Actualizar tipo de recurso
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config/tipos-recursos/${id}`, {
      method: 'PUT',
      headers: {
        ...createAuthHeaders(request),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al actualizar tipo de recurso' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error actualizando tipo de recurso:', error);
    return NextResponse.json(
      { error: 'Error actualizando tipo de recurso' },
      { status: 500 }
    );
  }
}

// DELETE /api/config/tipos-recursos/[id] - Eliminar tipo de recurso
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config/tipos-recursos/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al eliminar tipo de recurso' }, { status: response.status });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando tipo de recurso:', error);
    return NextResponse.json(
      { error: 'Error eliminando tipo de recurso' },
      { status: 500 }
    );
  }
}
