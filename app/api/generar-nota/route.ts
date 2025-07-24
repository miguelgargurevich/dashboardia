import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { callGeminiAPI, GeminiConfigs, cleanAIGeneratedText } from '../../lib/gemini';
import { hasValidAuth, createUnauthorizedResponse } from '../../lib/auth';

interface GenerarNotaRequest {
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

    const body: GenerarNotaRequest = await request.json();
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

    // Crear nombre de archivo
    const nombreArchivo = `${titulo.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')}.md`;
    
    // Crear ruta de directorio
    const directorioTema = join(process.cwd(), 'public', 'notas-md', tema);
    const rutaArchivo = join(directorioTema, nombreArchivo);

    // Crear directorio si no existe
    if (!existsSync(directorioTema)) {
      await mkdir(directorioTema, { recursive: true });
    }

    // Guardar archivo
    await writeFile(rutaArchivo, contenidoMarkdown, 'utf-8');

    return NextResponse.json({
      success: true,
      mensaje: 'Nota generada exitosamente',
      archivo: nombreArchivo,
      ruta: `notas-md/${tema}/${nombreArchivo}`,
      contenido: contenidoMarkdown
    });

  } catch (error) {
    console.error('Error generando nota:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar la nota' },
      { status: 500 }
    );
  }
}

async function generarContenidoConIA(datos: GenerarNotaRequest): Promise<string> {
  try {
    // Usar la API de Gemini para generar contenido real
    const prompt = construirPrompt(datos);
    const contenidoIA = await callGeminiAPI(prompt, GeminiConfigs.creative);
    
    if (contenidoIA) {
      return cleanAIGeneratedText(contenidoIA);
    } else {
      console.warn('No se pudo generar contenido con IA, usando fallback');
      return generarContenidoEstructurado(datos);
    }

  } catch (error) {
    console.error('Error en generación con IA:', error);
    // Fallback: generar contenido estructurado sin IA
    return generarContenidoEstructurado(datos);
  }
}

function construirPrompt(datos: GenerarNotaRequest): string {
  const { titulo, tema, descripcion, tipo, puntosClave, contexto, etiquetas } = datos;
  
  let prompt = `Eres un experto en documentación técnica y soporte de sistemas. Genera un documento markdown completo, profesional y detallado para un equipo de soporte técnico.

**INFORMACIÓN DEL DOCUMENTO:**
- Título: "${titulo}"
- Tema: "${tema}"
- Tipo: "${tipo}"
- Descripción: ${descripcion}`;

  if (puntosClave && puntosClave.length > 0) {
    prompt += `
- Puntos clave a incluir:
${puntosClave.map(punto => `  • ${punto}`).join('\n')}`;
  }

  if (contexto) {
    prompt += `
- Contexto adicional: ${contexto}`;
  }

  if (etiquetas && etiquetas.length > 0) {
    prompt += `
- Etiquetas: ${etiquetas.join(', ')}`;
  }

  prompt += `

**INSTRUCCIONES ESPECÍFICAS:**

1. **Estructura del documento:**
   - Título principal con emoji apropiado
   - Sección de información general con metadatos
   - Objetivo claro y conciso
   - Contenido principal estructurado según el tipo
   - Consideraciones importantes
   - Recursos relacionados

2. **Formato y estilo:**
   - Usar markdown profesional con títulos jerárquicos
   - Incluir emojis apropiados en títulos (📋, 🎯, 📝, ⚠️, etc.)
   - Usar listas, tablas y formato de código cuando sea apropiado
   - Texto claro, directo y profesional
   - Incluir ejemplos prácticos cuando sea relevante

3. **Contenido específico según tipo:**`;

  switch (tipo) {
    case 'procedimiento':
      prompt += `
   - Crear un procedimiento paso a paso detallado
   - Incluir prerequisitos y preparación
   - Detallar cada paso con claridad
   - Agregar puntos de verificación
   - Incluir qué hacer en caso de errores`;
      break;

    case 'manual':
      prompt += `
   - Crear un manual completo de uso
   - Incluir introducción y requisitos
   - Explicar conceptos fundamentales
   - Proporcionar instrucciones detalladas
   - Agregar ejemplos y casos de uso`;
      break;

    case 'guia':
      prompt += `
   - Crear una guía práctica y orientativa
   - Incluir cuándo y cómo usar la información
   - Proporcionar mejores prácticas
   - Agregar consejos y recomendaciones
   - Incluir escenarios comunes`;
      break;

    case 'checklist':
      prompt += `
   - Crear una lista de verificación clara
   - Organizar en fases: antes, durante, después
   - Usar formato de checkbox markdown
   - Incluir criterios de validación
   - Agregar puntos de control críticos`;
      break;

    case 'nota':
      prompt += `
   - Crear una nota informativa completa
   - Incluir información clave y relevante
   - Proporcionar contexto y explicaciones
   - Agregar referencias y enlaces conceptuales
   - Incluir consejos útiles`;
      break;
  }

  prompt += `

4. **Contexto del equipo de soporte:**
   - El documento será usado por técnicos de soporte
   - Debe ser práctico y aplicable en situaciones reales
   - Incluir consideraciones de seguridad cuando sea relevante
   - Agregar información sobre escalamiento si es necesario
   - Considerar la urgencia y criticidad de las situaciones

5. **Metadatos a incluir:**
   - Fecha de creación actual
   - Etiquetas proporcionadas
   - Nivel de prioridad si es relevante
   - Información de actualización

**GENERA EL DOCUMENTO COMPLETO EN MARKDOWN:**

Comienza directamente con el contenido markdown, sin explicaciones adicionales. El documento debe ser completo, profesional y listo para usar por el equipo de soporte.`;

  return prompt;
}

function generarContenidoEstructurado(datos: GenerarNotaRequest): string {
  const { titulo, tema, descripcion, tipo, puntosClave, etiquetas, contexto } = datos;
  
  let contenido = `# ${titulo}

## 📋 Información General

**Tema:** ${tema}
**Tipo:** ${tipo}
**Fecha de creación:** ${new Date().toLocaleDateString('es-ES')}`;

  // Agregar etiquetas si existen
  if (etiquetas && etiquetas.length > 0) {
    contenido += `
**Etiquetas:** ${etiquetas.map(tag => `\`${tag}\``).join(', ')}`;
  }

  contenido += `

---

## 🎯 Objetivo

${descripcion}

`;

  // Agregar secciones específicas según el tipo
  switch (tipo) {
    case 'procedimiento':
      contenido += `## 📝 Procedimiento

### Paso 1: Preparación
- Verificar requisitos previos
- Reunir herramientas necesarias
- Revisar documentación relacionada

### Paso 2: Ejecución
- Seguir los pasos establecidos
- Documentar cualquier anomalía
- Verificar resultados

### Paso 3: Verificación
- Confirmar que el procedimiento se completó correctamente
- Realizar pruebas de validación
- Actualizar registros correspondientes

`;
      break;

    case 'manual':
      contenido += `## 📖 Manual de Uso

### Introducción
Este manual proporciona las instrucciones detalladas para ${descripcion.toLowerCase()}.

### Requisitos
- Acceso al sistema
- Permisos necesarios
- Conocimientos básicos

### Instrucciones Detalladas
1. **Paso inicial**
   - Descripción del primer paso
   - Consideraciones importantes

2. **Desarrollo**
   - Continuación del proceso
   - Puntos de verificación

3. **Finalización**
   - Pasos de cierre
   - Validación final

`;
      break;

    case 'guia':
      contenido += `## 🗺️ Guía Práctica

### ¿Cuándo usar esta guía?
Esta guía es útil cuando necesites ${descripcion.toLowerCase()}.

### Pasos Principales
1. **Análisis inicial**
2. **Planificación**
3. **Implementación**
4. **Seguimiento**

### Mejores Prácticas
- Mantener documentación actualizada
- Seguir estándares establecidos
- Comunicar cambios importantes

`;
      break;

    case 'checklist':
      contenido += `## ✅ Lista de Verificación

### Antes de comenzar
- [ ] Verificar requisitos
- [ ] Preparar herramientas
- [ ] Revisar documentación

### Durante el proceso
- [ ] Seguir procedimientos establecidos
- [ ] Documentar acciones
- [ ] Verificar cada paso

### Al finalizar
- [ ] Validar resultados
- [ ] Actualizar registros
- [ ] Comunicar completado

`;
      break;

    default:
      contenido += `## 📄 Contenido

### Información Principal
${descripcion}

### Detalles Importantes
- Punto clave 1
- Punto clave 2
- Punto clave 3

`;
  }

  // Agregar puntos clave si existen
  if (puntosClave && puntosClave.length > 0) {
    contenido += `## 🔑 Puntos Clave

${puntosClave.map(punto => `- **${punto}**`).join('\n')}

`;
  }

  // Agregar contexto si existe
  if (contexto) {
    contenido += `## 📝 Contexto Adicional

${contexto}

`;
  }

  // Agregar secciones finales estándar
  contenido += `## ⚠️ Consideraciones Importantes

- Seguir siempre los protocolos de seguridad
- Documentar cualquier incidencia
- Mantener comunicación con el equipo
- Actualizar la documentación según sea necesario

## 🔗 Recursos Relacionados

- [Documentación general](/)
- [Procedimientos relacionados](/)
- [Contactos de soporte](/)

---

**Nota:** Esta documentación debe mantenerse actualizada. Si encuentras información incorrecta o desactualizada, por favor notifica al equipo correspondiente.

**Última actualización:** ${new Date().toLocaleDateString('es-ES')}
`;

  return contenido;
}
