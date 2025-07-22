import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
    // Construir prompt para IA (para futuras integraciones)
    // const prompt = construirPrompt(datos);
    
    // Aquí podrías integrar con OpenAI, Claude, o cualquier otro servicio de IA
    // Por ahora, genero un contenido estructurado basado en la información proporcionada
    
    const contenidoGenerado = generarContenidoEstructurado(datos);
    return contenidoGenerado;

  } catch (error) {
    console.error('Error en generación con IA:', error);
    // Fallback: generar contenido estructurado sin IA
    return generarContenidoEstructurado(datos);
  }
}

// Función para futuras integraciones con IA
/* function construirPrompt(datos: GenerarNotaRequest): string {
  const { titulo, tema, descripcion, tipo, puntosClave, contexto } = datos;
  
  let prompt = `Genera un documento markdown completo y profesional para el tema "${tema}" con el siguiente título: "${titulo}".

Descripción: ${descripcion}

Tipo de documento: ${tipo}

`;

  if (puntosClave && puntosClave.length > 0) {
    prompt += `Puntos clave a incluir:
${puntosClave.map(punto => `- ${punto}`).join('\n')}

`;
  }

  if (contexto) {
    prompt += `Contexto adicional: ${contexto}

`;
  }

  prompt += `El documento debe:
1. Estar bien estructurado con títulos y subtítulos
2. Incluir información práctica y aplicable
3. Ser específico para el contexto de soporte técnico
4. Incluir ejemplos cuando sea relevante
5. Tener un formato markdown profesional
6. Incluir secciones como: Objetivo, Procedimiento, Consideraciones importantes, etc.

Genera el contenido completo en formato markdown:`;

  return prompt;
} */

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
