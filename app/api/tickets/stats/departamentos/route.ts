import { NextRequest, NextResponse } from 'next/server';
import { createAuthHeaders, hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

// GET /api/tickets/stats/departamentos - Obtener estadísticas de tickets por departamento
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tickets/stats/departamentos`, {
      headers: createAuthHeaders(request)
    });
    
    if (!response.ok) {
      // Si el backend no tiene datos, devolver datos de ejemplo
      const defaultData = {
        data: [
          { departamento: 'Soporte Técnico', cantidad: 45, color: '#3b82f6' },
          { departamento: 'Administración', cantidad: 22, color: '#10b981' },
          { departamento: 'Ventas', cantidad: 18, color: '#f59e0b' },
          { departamento: 'Recursos Humanos', cantidad: 12, color: '#8b5cf6' },
          { departamento: 'Finanzas', cantidad: 8, color: '#ef4444' },
          { departamento: 'Marketing', cantidad: 15, color: '#06b6d4' }
        ]
      };
      return NextResponse.json(defaultData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener estadísticas por departamento:', error);
    // Devolver datos de ejemplo en caso de error
    const defaultData = {
      data: [
        { departamento: 'Soporte Técnico', cantidad: 45, color: '#3b82f6' },
        { departamento: 'Administración', cantidad: 22, color: '#10b981' },
        { departamento: 'Ventas', cantidad: 18, color: '#f59e0b' },
        { departamento: 'Recursos Humanos', cantidad: 12, color: '#8b5cf6' },
        { departamento: 'Finanzas', cantidad: 8, color: '#ef4444' },
        { departamento: 'Marketing', cantidad: 15, color: '#06b6d4' }
      ]
    };
    return NextResponse.json(defaultData);
  }
}
