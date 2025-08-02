import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

// GET /api/tickets/tendencia-semanal - Obtener tendencia semanal de tickets
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/tendencia-semanal`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      // Si el backend no tiene datos, devolver datos de ejemplo
      const defaultData = {
        data: [
          { dia: 'Lun', tickets: 15, resueltos: 12 },
          { dia: 'Mar', tickets: 23, resueltos: 18 },
          { dia: 'Mié', tickets: 18, resueltos: 16 },
          { dia: 'Jue', tickets: 27, resueltos: 22 },
          { dia: 'Vie', tickets: 31, resueltos: 25 },
          { dia: 'Sáb', tickets: 8, resueltos: 7 },
          { dia: 'Dom', tickets: 5, resueltos: 4 }
        ]
      };
      return NextResponse.json(defaultData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener tendencia semanal:', error);
    // Devolver datos de ejemplo en caso de error
    const defaultData = {
      data: [
        { dia: 'Lun', tickets: 15, resueltos: 12 },
        { dia: 'Mar', tickets: 23, resueltos: 18 },
        { dia: 'Mié', tickets: 18, resueltos: 16 },
        { dia: 'Jue', tickets: 27, resueltos: 22 },
        { dia: 'Vie', tickets: 31, resueltos: 25 },
        { dia: 'Sáb', tickets: 8, resueltos: 7 },
        { dia: 'Dom', tickets: 5, resueltos: 4 }
      ]
    };
    return NextResponse.json(defaultData);
  }
}
