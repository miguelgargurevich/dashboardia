import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const notasDir = join(process.cwd(), 'public', 'notas-md');
    const files = await readdir(notasDir);
    
    // Filtrar solo archivos .md
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    return NextResponse.json({ 
      success: true, 
      files: markdownFiles 
    });
  } catch (error) {
    console.error('Error reading notes directory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        success: false, 
        error: 'No se pudo acceder al directorio de notas',
        details: errorMessage 
      }, 
      { status: 500 }
    );
  }
}
