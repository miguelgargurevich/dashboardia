import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

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
    
    const filePath = join(process.cwd(), 'public', 'notas-md', filename);
    console.log('File path:', filePath);
    
    const fileContent = await readFile(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error reading markdown file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new NextResponse(
      JSON.stringify({ error: 'Archivo no encontrado', details: errorMessage }), 
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
