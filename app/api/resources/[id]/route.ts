import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// PUT /api/recursos/[id] - Actualizar recurso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(request),
      body: JSON.stringify({
        ...body,
        categoria: body.tema || body.categoria,
        updatedAt: new Date()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error actualizando recurso');
    }

    const recursoActualizado = await response.json();

    return NextResponse.json({
      success: true,
      recurso: {
        ...recursoActualizado,
        tema: recursoActualizado.categoria
      }
    });

  } catch (error) {
    console.error('Error actualizando recurso:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar recurso' },
      { status: 500 }
    );
  }
}

// DELETE /api/recursos/[id] - Eliminar recurso
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

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(request)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error eliminando recurso');
    }

    return NextResponse.json({
      success: true,
      message: 'Recurso eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando recurso:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar recurso' },
      { status: 500 }
    );
  }
}

// GET /api/recursos/[id] - Obtener recurso específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { id } = await params;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources/${id}`, {
      headers: createAuthHeaders(request)
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Recurso no encontrado' },
          { status: 404 }
        );
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error obteniendo recurso');
    }

    const recurso = await response.json();

    return NextResponse.json({
      success: true,
      recurso: {
        ...recurso,
        tema: recurso.categoria
      }
    });

  } catch (error) {
    console.error('Error obteniendo recurso:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener recurso' },
      { status: 500 }
    );
  }
}
