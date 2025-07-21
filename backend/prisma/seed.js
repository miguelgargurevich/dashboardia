const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();


async function main() {
  // Variable global para fechas
  const now = new Date();
  // Usuarios
  const users = [
    { name: 'Admin', email: 'admin@soporte.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Usuario', email: 'usuario@soporte.com', password: await bcrypt.hash('user123', 10), role: 'user' },
    { name: 'Miguel', email: 'miguel@soporte.com', password: await bcrypt.hash('miguel123', 10), role: 'user' },
    { name: 'Miguel Gargurevich', email: 'miguel.gargurevich@gmail.com', password: await bcrypt.hash('miguel123', 10), role: 'user' },
    { name: 'Sofia', email: 'sofia@soporte.com', password: await bcrypt.hash('sofia456', 10), role: 'user' },
    { name: 'Carlos', email: 'carlos@soporte.com', password: await bcrypt.hash('carlos789', 10), role: 'user' }
  ];
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await prisma.user.create({ data: u });
    } else {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          password: u.password,
          role: u.role
        }
      });
    }
  }

  // KB
  const kbs = [
    { titulo: 'Manual SharePoint', tipo: 'Manual', contenido: 'Contenido de SharePoint', categoria: 'Office', descripcion: 'Guía completa' },
    { titulo: 'Procedimiento Backup', tipo: 'Procedimiento', contenido: 'Pasos para backup', categoria: 'Infraestructura', descripcion: 'Backup seguro' },
    { titulo: 'Guía Teams', tipo: 'Manual', contenido: 'Uso de Teams', categoria: 'Colaboración', descripcion: 'Guía rápida' },
    { titulo: 'Solución Outlook', tipo: 'Procedimiento', contenido: 'Pasos para solucionar problemas de Outlook', categoria: 'Correo', descripcion: 'Solución de errores comunes' },
    { titulo: 'Manual VPN', tipo: 'Manual', contenido: 'Configuración de VPN corporativa', categoria: 'Redes', descripcion: 'Acceso remoto seguro' }
  ];
  for (const kb of kbs) {
    const exists = await prisma.KBArticle.findMany({ where: { titulo: kb.titulo }, take: 1 });
    if (exists.length === 0) await prisma.KBArticle.create({ data: kb });
  }

  // Recursos
  const resources = [
    { tipo: 'enlace', titulo: 'Video Azure', url: 'https://youtube.com/azure', tags: ['azure', 'video'], categoria: 'Cloud' },
    { tipo: 'nota', titulo: 'Nota rápida', descripcion: 'Recordatorio importante', tags: ['personal'], categoria: 'General' },
    { tipo: 'archivo', titulo: 'Manual PDF', filePath: '/uploads/manual.pdf', tags: ['manual'], categoria: 'Documentos' },
    { tipo: 'video', titulo: 'Capacitación Teams', url: 'https://youtube.com/teams', tags: ['teams', 'capacitación'], categoria: 'Colaboración' },
    { tipo: 'enlace', titulo: 'Guía VPN', url: 'https://intranet/vpn', tags: ['vpn', 'manual'], categoria: 'Redes' }
  ];
  for (const r of resources) {
    const exists = await prisma.resource.findMany({ where: { titulo: r.titulo }, take: 1 });
    if (exists.length === 0) await prisma.resource.create({ data: r });
  }

  // Tickets
  // Tickets variados: diferentes meses, años y picos diarios
  const ticketTemplates = [
    { tipo: 'Incidente', estado: 'Abierto', descripcion: 'Error en SharePoint', sistema: 'SharePoint' },
    { tipo: 'Requerimiento', estado: 'Cerrado', descripcion: 'Solicitar acceso a Teams', sistema: 'Teams' },
    { tipo: 'Incidente', estado: 'En Proceso', descripcion: 'Problema con Outlook', sistema: 'Outlook' },
    { tipo: 'Incidente', estado: 'Abierto', descripcion: 'VPN no conecta', sistema: 'VPN' },
    { tipo: 'Requerimiento', estado: 'Abierto', descripcion: 'Solicitar acceso a carpeta compartida', sistema: 'FileServer' }
  ];
  // Configuración de tickets por mes específico
  // Lógicas de distribución
  const mesesEspecificos = [0, 3, 6, 9]; // Enero, Abril, Julio, Octubre
  const cantidadPorMes = 15;
  const feriados = [1, 25]; // Ejemplo: 1 y 25 de cada mes (menos tickets)
  for (const mes of mesesEspecificos) {
    for (let i = 0; i < cantidadPorMes; i++) {
      // Pico semanal: más tickets los lunes
      const dia = (i % 7 === 0) ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 28) + 1;
      // Menos tickets en feriados
      if (feriados.includes(dia) && i % 3 !== 0) continue;
      // Tendencia creciente: más tickets en meses posteriores
      const ticketsEsteMes = cantidadPorMes + mes * 2;
      // Año alterno para variedad
      const year = (i % 2 === 0) ? now.getFullYear() : now.getFullYear() - 1;
      let fechaBase = new Date(year, mes, dia);
      fechaBase.setHours(Math.floor(Math.random() * 23));
      fechaBase.setMinutes(Math.floor(Math.random() * 59));
      // Tickets recurrentes: cada lunes, mismo problema
      const template = (dia % 7 === 1) ? ticketTemplates[3] : ticketTemplates[(i + mes) % ticketTemplates.length];
      const descripcion = template.descripcion + ` [${year}-${mes+1}-${dia}] #${i}`;
      const exists = await prisma.ticket.findMany({ where: { descripcion }, take: 1 });
      if (exists.length === 0) await prisma.ticket.create({ data: { ...template, descripcion, createdAt: fechaBase } });
      // Tendencia creciente: agregar más tickets en meses posteriores
      if (mes > 0 && i < mes * 2) {
        let fechaExtra = new Date(year, mes, dia);
        fechaExtra.setHours(Math.floor(Math.random() * 23));
        fechaExtra.setMinutes(Math.floor(Math.random() * 59));
        const descripcionExtra = template.descripcion + ` [${year}-${mes+1}-${dia}] extra#${i}`;
        const existsExtra = await prisma.ticket.findMany({ where: { descripcion: descripcionExtra }, take: 1 });
        if (existsExtra.length === 0) await prisma.ticket.create({ data: { ...template, descripcion: descripcionExtra, createdAt: fechaExtra } });
      }
    }
  }

  // Eventos
  const events = [
    // Mes actual
    { title: 'Mantenimiento programado', description: 'Corte de red', startDate: new Date(now.getFullYear(), now.getMonth(), 10, 10, 0), endDate: new Date(now.getFullYear(), now.getMonth(), 10, 12, 0), location: 'Sala de servidores' },
    { title: 'Capacitación', description: 'Curso de soporte', startDate: new Date(now.getFullYear(), now.getMonth(), 15, 9, 0), endDate: new Date(now.getFullYear(), now.getMonth(), 15, 11, 0), location: 'Aula virtual' },
    // Mes siguiente
    { title: 'Reunión de equipo', description: 'Planificación mensual', startDate: new Date(now.getFullYear(), now.getMonth() + 1, 5, 14, 0), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 5, 15, 0), location: 'Sala de reuniones' },
    { title: 'Webinar IA', description: 'Novedades IA', startDate: new Date(now.getFullYear(), now.getMonth() + 1, 20, 16, 0), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 20, 18, 0), location: 'Online' },
    // Mes anterior
    { title: 'Revisión de tickets', description: 'Análisis de tickets', startDate: new Date(now.getFullYear(), now.getMonth() - 1, 22, 11, 0), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 22, 12, 0), location: 'Oficina' },
    { title: 'Demo producto', description: 'Presentación nueva herramienta', startDate: new Date(now.getFullYear(), now.getMonth() - 1, 8, 15, 0), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 8, 16, 0), location: 'Sala demo' },
    // Meses futuros
    { title: 'Evento futuro 2m', description: 'Evento en dos meses', startDate: new Date(now.getFullYear(), now.getMonth() + 2, 12, 10, 0), endDate: new Date(now.getFullYear(), now.getMonth() + 2, 12, 12, 0), location: 'Auditorio' },
    { title: 'Evento futuro 3m', description: 'Evento en tres meses', startDate: new Date(now.getFullYear(), now.getMonth() + 3, 7, 9, 0), endDate: new Date(now.getFullYear(), now.getMonth() + 3, 7, 11, 0), location: 'Online' },
    { title: 'Evento futuro 6m', description: 'Evento en seis meses', startDate: new Date(now.getFullYear(), now.getMonth() + 6, 25, 15, 0), endDate: new Date(now.getFullYear(), now.getMonth() + 6, 25, 17, 0), location: 'Sala grande' }
  ];
  for (const e of events) {
    const exists = await prisma.event.findMany({ where: { title: e.title }, take: 1 });
    if (exists.length === 0) await prisma.event.create({ data: e });
  }

  // Recursos con fechas recientes
  await prisma.resource.createMany({
    data: [
      { tipo: 'archivo', titulo: 'Manual de usuario', descripcion: 'PDF de ayuda', filePath: '/files/manual.pdf', url: '', tags: ['manual'], categoria: 'Documentación', fechaCarga: new Date(now.getTime() - 3600000) },
      { tipo: 'video', titulo: 'Tutorial de red', descripcion: 'Video explicativo', filePath: '', url: 'https://youtu.be/tutorial', tags: ['tutorial'], categoria: 'Video', fechaCarga: new Date(now.getTime() - 7200000) },
      { tipo: 'nota', titulo: 'Nota interna', descripcion: 'Recordatorio de soporte', filePath: '', url: '', tags: ['nota'], categoria: 'Notas', fechaCarga: new Date(now.getTime() - 10800000) }
    ],
    skipDuplicates: true
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
