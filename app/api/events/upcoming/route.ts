import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// GET /api/events/upcoming - Obtener próximos eventos
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';
    const skip = searchParams.get('skip') || '0';
    
    let queryString = `limit=${limit}&skip=${skip}`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/upcoming?${queryString}`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener eventos próximos' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener eventos próximos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
