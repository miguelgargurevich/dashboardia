import { NextRequest, NextResponse } from 'next/server';
import { callGeminiForJSON, GeminiConfigs } from '../../lib/gemini';
import { hasValidAuth, createUnauthorizedResponse } from '../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const { url, tema } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL es requerida' },
        { status: 400 }
      );
    }

    // Validar que sea una URL válida
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'URL no válida' },
        { status: 400 }
      );
    }

    // Obtener el contenido de la página
    let tituloOriginal = '';
    let descripcionMeta = '';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        
        // Extraer título
        const tituloMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        tituloOriginal = tituloMatch ? tituloMatch[1].trim() : '';
        
        // Extraer meta description
        const descMatch = html.match(/<meta[^>]*name=['""]description['""][^>]*content=['""]([^'"]*)['""][^>]*>/i);
        descripcionMeta = descMatch ? descMatch[1].trim() : '';
        
        // Extraer texto visible (simplificado) - para futuro uso con IA
        html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000); // Limitar a 2000 caracteres
      }
    } catch (error) {
      console.log('Error obteniendo contenido de la página:', error);
    }

    // Generar contenido con IA
    try {
      // Usar Gemini IA para analizar y generar metadatos
      const resultadoIA = await procesarUrlConGemini(url, tituloOriginal, descripcionMeta, tema);
      
      if (resultadoIA) {
        console.log('✅ URL procesada exitosamente con Gemini IA');
        return NextResponse.json(resultadoIA);
      } else {
        console.warn('No se pudo procesar con IA, usando fallback');
        throw new Error('Fallback a procesamiento básico');
      }
      
    } catch (error) {
      console.error('Error procesando con IA:', error);
      
      // Fallback: generar contenido básico
      const dominioUrl = new URL(url).hostname;
      let tipoContenido = 'pagina-contenidos';
      let etiquetas = ['recurso', 'soporte'];
      
      // Detectar tipo de contenido basado en URL
      if (url.includes('youtube.com') || url.includes('vimeo.com') || url.includes('.mp4')) {
        tipoContenido = 'video';
        etiquetas.push('video');
      } else if (url.includes('docs.') || url.includes('.pdf') || url.includes('documentation')) {
        tipoContenido = 'documento';
        etiquetas.push('documentacion');
      } else if (url.includes('tutorial') || url.includes('how-to') || url.includes('guide')) {
        tipoContenido = 'tutorial';
        etiquetas.push('tutorial', 'guia');
      } else if (url.includes('api') || url.includes('reference') || url.includes('docs')) {
        tipoContenido = 'referencia';
        etiquetas.push('referencia', 'api');
      }

      // Agregar etiquetas basadas en el tema
      if (tema) {
        etiquetas.push(tema);
      }

      // Generar título y descripción
      let titulo = tituloOriginal || `Recurso de ${dominioUrl}`;
      if (titulo.length > 80) {
        titulo = titulo.substring(0, 77) + '...';
      }

      let descripcion = descripcionMeta || `Recurso útil de ${dominioUrl} para el equipo de soporte`;
      if (descripcion.length > 200) {
        descripcion = descripcion.substring(0, 197) + '...';
      }

      return NextResponse.json({
        titulo,
        descripcion,
        etiquetas: [...new Set(etiquetas)].slice(0, 5),
        tipoContenido
      });
    }

  } catch (error) {
    console.error('Error procesando URL:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function procesarUrlConGemini(url: string, titulo: string, descripcion: string, tema: string): Promise<any> {
  try {
    const dominioUrl = new URL(url).hostname;
    
    const prompt = `Eres un experto en análisis de contenido web y gestión de recursos para equipos de soporte técnico. Analiza la siguiente URL y genera metadatos optimizados.

**INFORMACIÓN DE LA URL:**
- URL: ${url}
- Dominio: ${dominioUrl}
- Título extraído: "${titulo || 'No disponible'}"
- Descripción meta: "${descripcion || 'No disponible'}"
- Tema del recurso: "${tema || 'general'}"

**INSTRUCCIONES:**
1. Analiza el dominio y la URL para determinar el tipo de contenido
2. Genera un título optimizado (máximo 80 caracteres) que sea descriptivo y útil para un equipo de soporte
3. Crea una descripción clara y concisa (máximo 200 caracteres) explicando qué encontrará el usuario
4. Determina el tipo de contenido más apropiado
5. Genera 3-5 etiquetas relevantes para clasificación y búsqueda

**TIPOS DE CONTENIDO DISPONIBLES:**
- video: Para contenido audiovisual (YouTube, Vimeo, etc.)
- documento: Para documentación, PDFs, manuales
- tutorial: Para guías paso a paso y tutoriales
- referencia: Para documentación de APIs, referencias técnicas
- pagina-contenidos: Para páginas web generales con información

**RESPONDE ÚNICAMENTE CON UN JSON VÁLIDO:**
{
  "titulo": "Título optimizado aquí",
  "descripcion": "Descripción clara y útil aquí",
  "tipoContenido": "tipo_de_contenido_aquí",
  "etiquetas": ["etiqueta1", "etiqueta2", "etiqueta3"]
}

**CONSIDERACIONES:**
- El título debe ser específico y útil para técnicos de soporte
- La descripción debe explicar claramente qué tipo de información o ayuda proporciona el recurso
- Las etiquetas deben incluir palabras clave relevantes para búsqueda
- Considera el contexto de soporte técnico al generar el contenido
- Si es un recurso oficial (Microsoft, Google, etc.), inclúyelo en las etiquetas

Responde solo con el JSON, sin explicaciones adicionales.`;

    interface UrlMetadata {
      titulo: string;
      descripcion: string;
      tipoContenido: string;
      etiquetas: string[];
    }

    const resultado = await callGeminiForJSON<UrlMetadata>(prompt, GeminiConfigs.analysis);
    
    if (resultado) {
      // Asegurar límites de caracteres
      if (resultado.titulo.length > 80) {
        resultado.titulo = resultado.titulo.substring(0, 77) + '...';
      }
      if (resultado.descripcion.length > 200) {
        resultado.descripcion = resultado.descripcion.substring(0, 197) + '...';
      }
      
      // Limitar etiquetas a 5 y asegurar que estén en minúsculas
      resultado.etiquetas = resultado.etiquetas
        .slice(0, 5)
        .map((tag: string) => tag.toLowerCase().trim())
        .filter((tag: string) => tag.length > 0);
      
      // Agregar etiqueta del tema si no está incluida
      if (tema && !resultado.etiquetas.includes(tema.toLowerCase())) {
        resultado.etiquetas.push(tema.toLowerCase());
        resultado.etiquetas = resultado.etiquetas.slice(0, 5);
      }
      
      return resultado;
    }

    return null;

  } catch (error) {
    console.error('Error llamando a la API de Gemini para URL:', error);
    return null;
  }
}
