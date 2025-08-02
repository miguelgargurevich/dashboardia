import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// GET /api/tickets/por-prioridad - Obtener tickets agrupados por prioridad
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/por-prioridad`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      // Si el backend no tiene datos, devolver datos de ejemplo
      const defaultData = {
        data: [
          { prioridad: 'Alta', cantidad: 12, color: '#ef4444' },
          { prioridad: 'Media', cantidad: 28, color: '#f59e0b' },
          { prioridad: 'Baja', cantidad: 15, color: '#10b981' },
          { prioridad: 'Crítica', cantidad: 5, color: '#dc2626' }
        ]
      };
      return NextResponse.json(defaultData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener tickets por prioridad:', error);
    // Devolver datos de ejemplo en caso de error
    const defaultData = {
      data: [
        { prioridad: 'Alta', cantidad: 12, color: '#ef4444' },
        { prioridad: 'Media', cantidad: 28, color: '#f59e0b' },
        { prioridad: 'Baja', cantidad: 15, color: '#10b981' },
        { prioridad: 'Crítica', cantidad: 5, color: '#dc2626' }
      ]
    };
    return NextResponse.json(defaultData);
  }
}
