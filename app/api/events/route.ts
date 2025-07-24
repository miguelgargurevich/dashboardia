import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../lib/auth';

// GET /api/events - Obtener todos los eventos
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener eventos' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/events - Crear nuevo evento
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const eventData = await request.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events`, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(request),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al crear evento' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
