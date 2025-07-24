import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// Definir la interfaz para eventos
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  modo?: 'presencial' | 'virtual' | 'hibrido';
  validador?: string;
  codigoDana?: string;
  nombreNotificacion?: string;
  relatedResources?: string[];
  isRecurring?: boolean;
  recurrencePattern?: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/events/calendar - Obtener eventos para el calendario
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    let queryString = '';
    if (month) {
      queryString = `month=${month}`;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/events/calendar?${queryString}`, {
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
