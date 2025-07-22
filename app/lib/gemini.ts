/**
 * Utilidades para integración con Gemini IA
 * Funciones centralizadas para llamadas a la API de Google Gemini
 */

interface GeminiConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

/**
 * Configuración por defecto para diferentes tipos de tareas
 */
export const GeminiConfigs = {
  creative: {
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
  balanced: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 4096,
  },
  precise: {
    temperature: 0.3,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
  analysis: {
    temperature: 0.2,
    topK: 10,
    topP: 0.8,
    maxOutputTokens: 1024,
  }
} as const;

/**
 * Función principal para llamar a la API de Gemini
 */
export async function callGeminiAPI(
  prompt: string, 
  config: GeminiConfig = GeminiConfigs.balanced
): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No se encontró la API key de Gemini en las variables de entorno');
      return null;
    }

    console.log('🤖 Llamando a Gemini IA...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: config
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Error en la API de Gemini: ${response.status} ${response.statusText}`);
      console.error('Detalles del error:', errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const contenido = data.candidates[0].content.parts[0].text;
      console.log('✅ Contenido generado exitosamente con Gemini IA');
      
      // Log del primer fragmento para debugging (opcional)
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Fragmento de respuesta:', contenido.substring(0, 100) + '...');
      }
      
      return contenido;
    } else {
      console.error('❌ Respuesta inesperada de Gemini:', data);
      return null;
    }

  } catch (error) {
    console.error('❌ Error llamando a la API de Gemini:', error);
    return null;
  }
}

/**
 * Función específica para generar contenido en formato JSON
 */
export async function callGeminiForJSON<T>(
  prompt: string,
  config: GeminiConfig = GeminiConfigs.analysis
): Promise<T | null> {
  try {
    const resultado = await callGeminiAPI(prompt, config);
    
    if (!resultado) {
      return null;
    }

    // Intentar extraer el JSON de la respuesta
    try {
      const jsonMatch = resultado.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        return parsedJson as T;
      } else {
        console.error('❌ No se encontró JSON válido en la respuesta de Gemini');
        console.log('📄 Respuesta completa:', resultado);
        return null;
      }
    } catch (parseError) {
      console.error('❌ Error parseando JSON de Gemini:', parseError);
      console.log('📄 Respuesta que causó el error:', resultado);
      return null;
    }

  } catch (error) {
    console.error('❌ Error en callGeminiForJSON:', error);
    return null;
  }
}

/**
 * Validar que la API key esté configurada
 */
export function validateGeminiConfig(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY no está configurada en las variables de entorno');
    return false;
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.error('❌ GEMINI_API_KEY no parece ser válida (debe empezar con "AIza")');
    return false;
  }
  
  console.log('✅ Configuración de Gemini IA validada correctamente');
  return true;
}

/**
 * Función para limpiar y formatear texto generado por IA
 */
export function cleanAIGeneratedText(text: string): string {
  return text
    .trim()
    // Remover marcadores de código si están presentes
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    // Limpiar espacios extra
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Función para crear prompts consistentes
 */
export function createSystemPrompt(
  role: string,
  task: string,
  context: string,
  instructions: string[],
  outputFormat?: string
): string {
  let prompt = `Eres ${role}. Tu tarea es ${task}.

**CONTEXTO:**
${context}

**INSTRUCCIONES:**`;

  instructions.forEach((instruction, index) => {
    prompt += `\n${index + 1}. ${instruction}`;
  });

  if (outputFormat) {
    prompt += `\n\n**FORMATO DE SALIDA:**
${outputFormat}`;
  }

  return prompt;
}

export default {
  callGeminiAPI,
  callGeminiForJSON,
  validateGeminiConfig,
  cleanAIGeneratedText,
  createSystemPrompt,
  GeminiConfigs
};
