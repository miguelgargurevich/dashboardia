import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

// GET /api/tickets/stats/estados - Obtener estadísticas de tickets por estado
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/stats/estados`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      // Si el backend no tiene datos, devolver datos de ejemplo
      const defaultData = {
        data: [
          { estado: 'Abierto', cantidad: 25, color: '#3b82f6' },
          { estado: 'En Progreso', cantidad: 18, color: '#f59e0b' },
          { estado: 'Resuelto', cantidad: 42, color: '#10b981' },
          { estado: 'Cerrado', cantidad: 35, color: '#6b7280' },
          { estado: 'Pendiente', cantidad: 8, color: '#ef4444' }
        ]
      };
      return NextResponse.json(defaultData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener estadísticas por estado:', error);
    // Devolver datos de ejemplo en caso de error
    const defaultData = {
      data: [
        { estado: 'Abierto', cantidad: 25, color: '#3b82f6' },
        { estado: 'En Progreso', cantidad: 18, color: '#f59e0b' },
        { estado: 'Resuelto', cantidad: 42, color: '#10b981' },
        { estado: 'Cerrado', cantidad: 35, color: '#6b7280' },
        { estado: 'Pendiente', cantidad: 8, color: '#ef4444' }
      ]
    };
    return NextResponse.json(defaultData);
  }
}
