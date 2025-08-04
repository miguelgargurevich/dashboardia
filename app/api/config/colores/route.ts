import { NextResponse } from 'next/server';

/**
 * API de Colores para Configuración
 * 
 * Propósito: Proporciona una paleta estándar de colores para que los administradores
 * elijan al configurar temas, tipos de eventos, notas y recursos.
 * 
 * NOTA IMPORTANTE: 
 * - Esta API NO es la fuente de verdad para los colores de cada tipo
 * - Los colores reales se almacenan en las propiedades 'color' de cada tipo individual
 * - Esta API sirve como "catálogo" de opciones disponibles en la interfaz de administración
 */
export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/config/colores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener colores' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error obteniendo colores:', error);
    return NextResponse.json(
      { error: 'Error obteniendo colores' },
      { status: 500 }
    );
  }
}
