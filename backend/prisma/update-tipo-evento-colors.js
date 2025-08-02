const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTipoEventoColors() {
  try {
    console.log('🔄 Actualizando colores de tipos de eventos...');

    // Colores por defecto para tipos de eventos
    const coloresDefault = [
      "bg-blue-500/20 text-blue-400 border-blue-400/30",
      "bg-green-500/20 text-green-400 border-green-400/30", 
      "bg-purple-500/20 text-purple-400 border-purple-400/30",
      "bg-red-500/20 text-red-400 border-red-400/30",
      "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
    ];

    // Obtener todos los tipos de eventos
    const tiposEventos = await prisma.tipoEvento.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Encontrados ${tiposEventos.length} tipos de eventos`);

    // Actualizar cada tipo con un color
    for (let i = 0; i < tiposEventos.length; i++) {
      const tipo = tiposEventos[i];
      const colorIndex = i % coloresDefault.length;
      const color = coloresDefault[colorIndex];

      await prisma.tipoEvento.update({
        where: { id: tipo.id },
        data: { color }
      });

      console.log(`✅ ${tipo.nombre}: ${color}`);
    }

    console.log('🎉 Actualización completada!');

    // Mostrar estado final
    const tiposActualizados = await prisma.tipoEvento.findMany({
      select: { nombre: true, color: true }
    });

    console.log('\n📋 Estado final:');
    tiposActualizados.forEach(tipo => {
      console.log(`   ${tipo.nombre}: ${tipo.color}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTipoEventoColors();
