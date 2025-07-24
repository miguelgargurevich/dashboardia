import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { hasValidAuth, createUnauthorizedResponse } from '../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const tema = searchParams.get('tema');
    
    const baseDir = join(process.cwd(), 'public', 'notas-md');
    
    // Si se especifica un tema, listar solo archivos de ese tema
    if (tema) {
      const temaDir = join(baseDir, tema);
      
      if (!existsSync(temaDir)) {
        return NextResponse.json({
          success: true,
          archivos: [],
          mensaje: `El directorio para el tema '${tema}' no existe aún`
        });
      }
      
      try {
        const archivos = await readdir(temaDir);
        const archivosMd = archivos
          .filter(archivo => archivo.endsWith('.md'))
          .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
        
        // Obtener información adicional de cada archivo
        const archivosConInfo = await Promise.all(
          archivosMd.map(async (archivo) => {
            const rutaArchivo = join(temaDir, archivo);
            const stats = await stat(rutaArchivo);
            
            return {
              nombre: archivo,
              nombreSinExtension: archivo.replace('.md', '').replace(/-/g, ' '),
              rutaRelativa: `notas-md/${tema}/${archivo}`,
              fechaModificacion: stats.mtime,
              tamaño: stats.size
            };
          })
        );
        
        return NextResponse.json({
          success: true,
          tema,
          archivos: archivosConInfo,
          cantidad: archivosConInfo.length
        });
        
      } catch (error) {
        console.error(`Error leyendo directorio ${tema}:`, error);
        return NextResponse.json({
          success: false,
          error: `Error leyendo archivos del tema '${tema}'`
        }, { status: 500 });
      }
    }
    
    // Si no se especifica tema, listar todos los archivos organizados por tema
    if (!existsSync(baseDir)) {
      return NextResponse.json({
        success: true,
        archivosPorTema: {},
        mensaje: 'El directorio de notas no existe aún'
      });
    }
    
    const directoriosTemas = await readdir(baseDir);
    const archivosPorTema: Record<string, any[]> = {};
    
    for (const tema of directoriosTemas) {
      const temaDir = join(baseDir, tema);
      const stats = await stat(temaDir);
      
      // Solo procesar directorios
      if (stats.isDirectory()) {
        try {
          const archivos = await readdir(temaDir);
          const archivosMd = archivos
            .filter(archivo => archivo.endsWith('.md'))
            .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
          
          // Obtener información adicional de cada archivo
          const archivosConInfo = await Promise.all(
            archivosMd.map(async (archivo) => {
              const rutaArchivo = join(temaDir, archivo);
              const stats = await stat(rutaArchivo);
              
              return {
                nombre: archivo,
                nombreSinExtension: archivo.replace('.md', '').replace(/-/g, ' '),
                rutaRelativa: `notas-md/${tema}/${archivo}`,
                fechaModificacion: stats.mtime,
                tamaño: stats.size
              };
            })
          );
          
          archivosPorTema[tema] = archivosConInfo;
          
        } catch (error) {
          console.error(`Error leyendo directorio ${tema}:`, error);
          archivosPorTema[tema] = [];
        }
      }
    }
    
    // Calcular estadísticas totales
    const totalArchivos = Object.values(archivosPorTema)
      .reduce((total, archivos) => total + archivos.length, 0);
    
    const temasSoportados = [
      'notificaciones',
      'polizas', 
      'tickets',
      'actividades-diarias',
      'emergencias',
      'kb-conocidos'
    ];
    
    // Asegurar que todos los temas soportados estén en la respuesta
    temasSoportados.forEach(tema => {
      if (!archivosPorTema[tema]) {
        archivosPorTema[tema] = [];
      }
    });
    
    return NextResponse.json({
      success: true,
      archivosPorTema,
      estadisticas: {
        totalArchivos,
        totalTemas: Object.keys(archivosPorTema).length,
        temasConArchivos: Object.values(archivosPorTema).filter(archivos => archivos.length > 0).length
      }
    });
    
  } catch (error) {
    console.error('Error listando archivos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al listar archivos' 
      },
      { status: 500 }
    );
  }
}

// Endpoint adicional para obtener metadatos de un archivo específico
export async function POST(request: NextRequest) {
  try {
    const { archivo, tema } = await request.json();
    
    if (!archivo || !tema) {
      return NextResponse.json(
        { error: 'Se requieren los parámetros archivo y tema' },
        { status: 400 }
      );
    }
    
    const rutaArchivo = join(process.cwd(), 'public', 'notas-md', tema, archivo);
    
    if (!existsSync(rutaArchivo)) {
      return NextResponse.json(
        { error: 'El archivo no existe' },
        { status: 404 }
      );
    }
    
    const stats = await stat(rutaArchivo);
    
    return NextResponse.json({
      success: true,
      metadatos: {
        nombre: archivo,
        nombreSinExtension: archivo.replace('.md', '').replace(/-/g, ' '),
        tema,
        rutaRelativa: `notas-md/${tema}/${archivo}`,
        fechaCreacion: stats.birthtime,
        fechaModificacion: stats.mtime,
        tamaño: stats.size,
        tamañoFormateado: formatearTamaño(stats.size)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo metadatos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function formatearTamaño(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
