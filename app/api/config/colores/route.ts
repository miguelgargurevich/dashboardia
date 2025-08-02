import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
