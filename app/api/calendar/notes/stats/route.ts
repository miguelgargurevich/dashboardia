// app/api/calendar/notes/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse, createAuthHeaders } from '../../../../lib/auth';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const response = await fetch(`${BACKEND_URL}/api/daily-notes/stats?${queryString}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching daily notes stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
