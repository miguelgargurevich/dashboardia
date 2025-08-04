// app/api/calendar/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Configuración centralizada del backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    console.log('🔍 Calendar API: Request received');
    console.log('📍 Query string:', queryString);
    console.log('🔑 Authorization header:', request.headers.get('Authorization') ? 'Present' : 'Missing');
    
    // Usar el endpoint unificado de notas en lugar del endpoint específico de daily-notes
    const backendUrl = `${BACKEND_URL}/api/notes?${queryString}`;
    console.log('🎯 Backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Backend response data:', data);
    
    if (!response.ok) {
      console.error('❌ Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Adaptar las notas del modelo unificado al formato que espera el calendario
    const adaptedNotes = data.map((note: { 
      id: string; 
      date: string; 
      title: string; 
      content: string; 
      tipo?: string; 
      etiquetas?: string[];
      tags?: string[];
      relatedResources?: string[];
      createdAt?: string;
      updatedAt?: string;
      priority?: string;
      status?: string;
    }) => ({
      id: note.id,
      date: note.date, // Solo usar el campo de fecha unificado
      title: note.title,
      content: note.content,
      type: note.tipo || 'otro', // Mapear 'tipo' a 'type'
      tags: note.tags || [],
      relatedResources: note.relatedResources || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      // Campos adicionales que podrían ser útiles
      priority: note.priority,
      status: note.status
    }));

    console.log('🔄 Adapted notes:', adaptedNotes);
    console.log('📊 Notes count:', adaptedNotes.length);

    return NextResponse.json(adaptedNotes);
  } catch (error) {
    console.error('Error fetching daily notes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🟢 Frontend API: Creating note with body:', body);
    console.log('� Frontend API: body.date value:', body.date);
    console.log('🔍 Frontend API: body.date type:', typeof body.date);
    console.log('�🔑 Frontend API: Authorization header:', request.headers.get('Authorization') ? 'Present' : 'Missing');
    
    // Mapear datos del frontend al formato del backend
    const noteData = {
      ...body,
      // Mapear 'type' a 'tipo' si viene del frontend
      tipo: body.type || body.tipo || 'personal'
    };
    
    // Remover el campo 'type' para evitar conflictos
    delete noteData.type;
    
    console.log('🔍 Frontend API: noteData.date value:', noteData.date);
    console.log('🔍 Frontend API: noteData.date type:', typeof noteData.date);
    console.log('🚀 Frontend API: Sending to backend:', noteData);
    
    // Usar el endpoint unificado de notas en lugar del endpoint específico de daily-notes
    const response = await fetch(`${BACKEND_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });

    console.log('📡 Frontend API: Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Frontend API: Backend response data:', data);
    
    if (!response.ok) {
      console.error('❌ Frontend API: Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Adaptar la respuesta al formato esperado por el frontend
    const adaptedResponse = {
      ...data,
      type: data.tipo,
      date: data.date || data.createdAt || new Date().toISOString().split('T')[0]
    };

    console.log('✅ Frontend API: Success, returning:', adaptedResponse);
    return NextResponse.json(adaptedResponse, { status: 201 });
  } catch (error) {
    console.error('❌ Frontend API: Error creating note:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
