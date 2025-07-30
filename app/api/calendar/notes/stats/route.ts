// app/api/calendar/notes/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Agregar el filtro de tema para actividades diarias
    searchParams.set('tema', 'actividades-diarias');
    const queryString = searchParams.toString();
    
    // Usar el endpoint unificado de estadísticas con filtro de tema
    const response = await fetch(`${BACKEND_URL}/api/notes/stats?${queryString}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Backend stats error:', response.status, response.statusText);
      
      // Fallback: devolver estadísticas vacías si hay un error
      return NextResponse.json({
        success: true,
        statsByDay: {},
        totalNotes: 0,
        summary: {
          totalDays: 0,
          totalNotes: 0,
          avgNotesPerDay: 0
        }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching daily notes stats:', error);
    
    // Fallback: devolver estadísticas vacías en caso de error
    return NextResponse.json({
      success: true,
      statsByDay: {},
      totalNotes: 0,
      summary: {
        totalDays: 0,
        totalNotes: 0,
        avgNotesPerDay: 0
      }
    });
  }
}
