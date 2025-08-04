import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// GET /api/config/tipos-recursos - Obtener todos los tipos de recursos
export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config/tipos-recursos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener tipos de recursos' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error obteniendo tipos de recursos:', error);
    return NextResponse.json(
      { error: 'Error obteniendo tipos de recursos' },
      { status: 500 }
    );
  }
}

// POST /api/config/tipos-recursos - Crear nuevo tipo de recurso
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config/tipos-recursos`, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(request),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al crear tipo de recurso' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creando tipo de recurso:', error);
    return NextResponse.json(
      { error: 'Error creando tipo de recurso' },
      { status: 500 }
    );
  }
}
