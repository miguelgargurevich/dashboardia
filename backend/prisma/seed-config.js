const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedConfigTables() {
  console.log('🌱 Iniciando seed de tablas de configuración...');

  // Datos por defecto directamente en el código (ya no dependen de JSON)
  const temas = [
    { nombre: "General", descripcion: "Tema general", color: "bg-blue-500 text-white", activo: true },
    { nombre: "Desarrollo", descripcion: "Temas de desarrollo", color: "bg-green-500 text-white", activo: true },
    { nombre: "Reuniones", descripcion: "Reuniones y juntas", color: "bg-purple-500 text-white", activo: true },
    { nombre: "Capacitación", descripcion: "Entrenamientos y cursos", color: "bg-orange-500 text-white", activo: true }
  ];

  const tiposEventos = [
    { nombre: "Reunión", descripcion: "Reunión de trabajo", color: "bg-blue-500 text-blue-100", icono: "FaCalendarAlt", activo: true },
    { nombre: "Capacitación", descripcion: "Sesión de capacitación", color: "bg-green-500 text-green-100", icono: "FaGraduationCap", activo: true },
    { nombre: "Mantenimiento", descripcion: "Mantenimiento programado", color: "bg-yellow-500 text-yellow-100", icono: "FaTools", activo: true },
    { nombre: "Entrega", descripcion: "Entrega de proyecto", color: "bg-purple-500 text-purple-100", icono: "FaCheckCircle", activo: true }
  ];

  const tiposNotas = [
    { nombre: "Nota General", descripcion: "Nota general", color: "bg-gray-500 text-white", icono: "FaStickyNote", activo: true },
    { nombre: "Procedimiento", descripcion: "Procedimiento o instrucción", color: "bg-blue-500 text-white", icono: "FaListOl", activo: true },
    { nombre: "Conocimiento", descripcion: "Base de conocimiento", color: "bg-green-500 text-white", icono: "FaLightbulb", activo: true },
    { nombre: "Recordatorio", descripcion: "Recordatorio importante", color: "bg-yellow-500 text-white", icono: "FaBell", activo: true }
  ];

  const tiposRecursos = [
    { nombre: "Documento", descripcion: "Documento general", color: "bg-blue-500 text-white", icono: "FaFileAlt", activo: true },
    { nombre: "Manual", descripcion: "Manual de procedimientos", color: "bg-green-500 text-white", icono: "FaBook", activo: true },
    { nombre: "Imagen", descripcion: "Archivo de imagen", color: "bg-purple-500 text-white", icono: "FaImage", activo: true },
    { nombre: "Video", descripcion: "Archivo de video", color: "bg-red-500 text-white", icono: "FaVideo", activo: true },
    { nombre: "Audio", descripcion: "Archivo de audio", color: "bg-orange-500 text-white", icono: "FaVolumeUp", activo: true }
  ];

  try {
    // Seed Temas
    console.log('📚 Seeding Temas...');
    for (const tema of temas) {
      await prisma.tema.upsert({
        where: { nombre: tema.nombre },
        update: {
          descripcion: tema.descripcion,
          color: tema.color,
          activo: true
        },
        create: {
          nombre: tema.nombre,
          descripcion: tema.descripcion,
          color: tema.color,
          activo: true
        }
      });
    }
    console.log(`✅ ${temas.length} temas procesados`);

    // Seed Tipos de Eventos
    console.log('📅 Seeding Tipos de Eventos...');
    for (const tipo of tiposEventos) {
      await prisma.tipoEvento.upsert({
        where: { nombre: tipo.nombre },
        update: {
          icono: tipo.icono,
          activo: true
        },
        create: {
          nombre: tipo.nombre,
          icono: tipo.icono,
          activo: true
        }
      });
    }
    console.log(`✅ ${tiposEventos.length} tipos de eventos procesados`);

    // Seed Tipos de Notas
    console.log('📝 Seeding Tipos de Notas...');
    for (const tipo of tiposNotas) {
      await prisma.tipoNota.upsert({
        where: { nombre: tipo.nombre },
        update: {
          descripcion: tipo.descripcion,
          color: tipo.color,
          activo: true
        },
        create: {
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          color: tipo.color,
          activo: true
        }
      });
    }
    console.log(`✅ ${tiposNotas.length} tipos de notas procesados`);

    // Seed Tipos de Recursos
    console.log('📁 Seeding Tipos de Recursos...');
    for (const tipo of tiposRecursos) {
      await prisma.tipoRecurso.upsert({
        where: { nombre: tipo.nombre },
        update: {
          descripcion: tipo.descripcion,
          color: tipo.color,
          activo: true
        },
        create: {
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          color: tipo.color,
          activo: true
        }
      });
    }
    console.log(`✅ ${tiposRecursos.length} tipos de recursos procesados`);

    console.log('🎉 Seed de configuraciones completado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedConfigTables();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedConfigTables };
