import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// GET /api/resources/recent - Obtener recursos recientes
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resources?limit=${limit}&sort=fechaCarga&order=desc`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener recursos recientes' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener recursos recientes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
