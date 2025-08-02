const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedConfigTables() {
  console.log('🌱 Iniciando seed de tablas de configuración...');

  // Cargar datos de JSON
  const publicPath = path.join(__dirname, '../../public');
  
  const temas = JSON.parse(fs.readFileSync(path.join(publicPath, 'temas.json'), 'utf8'));
  const tiposEventos = JSON.parse(fs.readFileSync(path.join(publicPath, 'tiposEventos.json'), 'utf8'));
  const tiposNotas = JSON.parse(fs.readFileSync(path.join(publicPath, 'tiposNotas.json'), 'utf8'));
  const tiposRecursos = JSON.parse(fs.readFileSync(path.join(publicPath, 'tiposRecursos.json'), 'utf8'));

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
