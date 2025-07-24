import { NextRequest, NextResponse } from 'next/server';
import { callGeminiAPI, GeminiConfigs, cleanAIGeneratedText } from '../../../lib/gemini';
import type { GeminiConfig } from '../../../lib/gemini';
import { hasValidAuth, createUnauthorizedResponse } from '../../../lib/auth';

interface GenerateNoteRequest {
  titulo: string;
  tema: string;
  descripcion: string;
  tipo: 'procedimiento' | 'manual' | 'guia' | 'nota' | 'checklist';
  puntosClave?: string[];
  etiquetas?: string[];
  contexto?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    if (!hasValidAuth(request)) {
      return createUnauthorizedResponse();
    }

    const body: GenerateNoteRequest = await request.json();
    const { titulo, tema, descripcion, tipo, puntosClave, etiquetas, contexto } = body;

    // Validar datos requeridos
    if (!titulo || !tema || !descripcion || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, tema, descripcion, tipo' },
        { status: 400 }
      );
    }

    // Generar contenido con IA
    const contenidoMarkdown = await generarContenidoConIA({
      titulo,
      tema,
      descripcion,
      tipo,
      puntosClave,
      etiquetas,
      contexto
    });

    // Configuración centralizada del backend
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

    // Guardar en la base de datos a través del backend
    const response = await fetch(`${BACKEND_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: titulo,
        content: contenidoMarkdown,
        tema: tema,
        tipo: tipo,
        descripcion: descripcion,
        tags: etiquetas || [],
        context: contexto,
        keyPoints: puntosClave || [],
        status: 'activo'
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Nota generada y guardada exitosamente',
      nota: data,
      contenido: contenidoMarkdown
    });

  } catch (error) {
    console.error('Error generando nota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar nota' },
      { status: 500 }
    );
  }
}

// Función para generar contenido con IA
async function generarContenidoConIA(params: {
  titulo: string;
  tema: string;
  descripcion: string;
  tipo: string;
  puntosClave?: string[];
  etiquetas?: string[];
  contexto?: string;
}): Promise<string> {
  const { titulo, tema, descripcion, tipo, puntosClave, etiquetas, contexto } = params;

  // Seleccionar configuración de IA según el tipo de contenido
  function getGeminiConfigForContentType(tipo: string): GeminiConfig {
    switch (tipo) {
      case 'procedimiento':
      case 'manual':
        return GeminiConfigs.precise; // Más preciso para procedimientos
      case 'checklist':
        return GeminiConfigs.balanced; // Balance para listas estructuradas
      case 'guia':
        return GeminiConfigs.creative; // Más creativo para guías
      case 'nota':
      default:
        return GeminiConfigs.balanced; // Balance general para notas
    }
  }

  const geminiConfig = getGeminiConfigForContentType(tipo);

  // Construir el prompt específico para el tipo de documento
  let prompt = `Eres un asistente experto en documentación técnica y creación de contenido. 
Necesito que generes un ${tipo} completo y detallado sobre "${titulo}".

**Información base:**
- Título: ${titulo}
- Tema/Categoría: ${tema}
- Descripción: ${descripcion}
- Tipo de documento: ${tipo}`;

  if (puntosClave && puntosClave.length > 0) {
    prompt += `\n- Puntos clave a incluir: ${puntosClave.join(', ')}`;
  }

  if (etiquetas && etiquetas.length > 0) {
    prompt += `\n- Etiquetas: ${etiquetas.join(', ')}`;
  }

  if (contexto) {
    prompt += `\n- Contexto adicional: ${contexto}`;
  }

  // Instrucciones específicas según el tipo
  switch (tipo) {
    case 'procedimiento':
      prompt += `

**Instrucciones específicas:**
Genera un procedimiento paso a paso con:
1. Introducción breve
2. Prerrequisitos (si aplica)
3. Pasos numerados claramente
4. Notas importantes o advertencias
5. Resultado esperado
6. Solución de problemas comunes

Usa formato Markdown con encabezados, listas numeradas, y destacados importantes con **negrita**.`;
      break;

    case 'manual':
      prompt += `

**Instrucciones específicas:**
Genera un manual completo con:
1. Introducción y propósito
2. Conceptos básicos
3. Instrucciones detalladas
4. Ejemplos prácticos
5. Mejores prácticas
6. Referencias adicionales

Usa formato Markdown con encabezados jerárquicos, listas, tablas si es necesario, y código en \`backticks\`.`;
      break;

    case 'guia':
      prompt += `

**Instrucciones específicas:**
Genera una guía práctica con:
1. Introducción
2. Paso a paso simplificado
3. Consejos y trucos
4. Errores comunes a evitar
5. Recursos adicionales

Usa formato Markdown conversacional pero estructurado.`;
      break;

    case 'checklist':
      prompt += `

**Instrucciones específicas:**
Genera un checklist estructurado con:
1. Breve introducción
2. Lista de verificación con checkboxes - [ ]
3. Categorías organizadas si es necesario
4. Notas importantes

Usa formato Markdown con listas de verificación y organización clara.`;
      break;

    default:
      prompt += `

**Instrucciones específicas:**
Genera contenido estructurado y útil usando formato Markdown apropiado.`;
  }

  prompt += `

**Formato requerido:**
- Usa únicamente formato Markdown válido
- Incluye encabezados apropiados (#, ##, ###)
- Usa listas cuando sea apropiado
- Destaca información importante con **negrita**
- Incluye código o comandos en \`backticks\` si es relevante
- Mantén un tono profesional pero accesible

El contenido debe ser completo, útil y listo para usar en un entorno profesional.`;

  try {
    // Llamar a la API de Gemini con configuración específica para el tipo de contenido
    const aiResponse = await callGeminiAPI(prompt, geminiConfig);
    
    // Verificar que la respuesta no sea null
    if (!aiResponse) {
      throw new Error('No se recibió respuesta de la IA');
    }
    
    // Limpiar y formatear la respuesta
    const cleanedContent = cleanAIGeneratedText(aiResponse);
    
    return cleanedContent;
  } catch (error) {
    console.error('Error llamando a Gemini API:', error);
    
    // Fallback: generar contenido básico
    return generarContenidoFallback(params);
  }
}

// Función fallback para generar contenido básico si falla la IA
function generarContenidoFallback(params: {
  titulo: string;
  tema: string;
  descripcion: string;
  tipo: string;
  puntosClave?: string[];
}): string {
  const { titulo, tema, descripcion, tipo, puntosClave } = params;
  
  let contenido = `# ${titulo}\n\n`;
  contenido += `**Categoría:** ${tema}\n`;
  contenido += `**Tipo:** ${tipo}\n\n`;
  contenido += `## Descripción\n\n${descripcion}\n\n`;
  
  if (puntosClave && puntosClave.length > 0) {
    contenido += `## Puntos Clave\n\n`;
    puntosClave.forEach(punto => {
      contenido += `- ${punto}\n`;
    });
    contenido += '\n';
  }
  
  contenido += `## Contenido\n\n`;
  contenido += `_Este contenido será desarrollado próximamente._\n\n`;
  contenido += `---\n\n`;
  contenido += `*Documento generado automáticamente - ${new Date().toLocaleDateString()}*`;
  
  return contenido;
}
