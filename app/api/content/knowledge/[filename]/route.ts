import { NextRequest, NextResponse } from 'next/server';
import { hasValidAuth, createUnauthorizedResponse } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { filename } = await params;
    console.log('Requested filename:', filename);
    
    // Fetch note from database
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/notes`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }
    
    const notes = await response.json();
    
    // Find note by filename (for backward compatibility)
    // First try to find by exact filename match
    let note = notes.find((n: any) => 
      n.filename === filename || 
      `${n.filename}.md` === filename ||
      n.title === filename.replace('.md', '') ||
      n.id.toString() === filename.replace('.md', '')
    );
    
    if (!note) {
      // Try to find by partial match in title or filename
      note = notes.find((n: any) => 
        n.title.toLowerCase().includes(filename.replace('.md', '').toLowerCase()) ||
        filename.toLowerCase().includes(n.title.toLowerCase())
      );
    }
    
    if (!note) {
      return new NextResponse(
        JSON.stringify({ error: 'Nota no encontrada', filename }), 
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    return new NextResponse(note.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching note from database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener la nota', details: errorMessage }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
