
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();


async function main() {
  // Usuarios
  const users = [
    { name: 'Admin', email: 'admin@soporte.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Usuario', email: 'usuario@soporte.com', password: await bcrypt.hash('user123', 10), role: 'user' },
    { name: 'Miguel', email: 'miguel@soporte.com', password: await bcrypt.hash('miguel123', 10), role: 'user' },
    { name: 'Sofia', email: 'sofia@soporte.com', password: await bcrypt.hash('sofia456', 10), role: 'user' },
    { name: 'Carlos', email: 'carlos@soporte.com', password: await bcrypt.hash('carlos789', 10), role: 'user' }
  ];
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) await prisma.user.create({ data: u });
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
  const tickets = [
    { tipo: 'Incidente', estado: 'Abierto', descripcion: 'Error en SharePoint', sistema: 'SharePoint' },
    { tipo: 'Requerimiento', estado: 'Cerrado', descripcion: 'Solicitar acceso a Teams', sistema: 'Teams' },
    { tipo: 'Incidente', estado: 'En Proceso', descripcion: 'Problema con Outlook', sistema: 'Outlook' },
    { tipo: 'Incidente', estado: 'Abierto', descripcion: 'VPN no conecta', sistema: 'VPN' },
    { tipo: 'Requerimiento', estado: 'Abierto', descripcion: 'Solicitar acceso a carpeta compartida', sistema: 'FileServer' }
  ];
  for (const t of tickets) {
    const exists = await prisma.ticket.findMany({ where: { descripcion: t.descripcion }, take: 1 });
    if (exists.length === 0) await prisma.ticket.create({ data: t });
  }

  // Eventos
  const events = [
    { title: 'Reunión semanal', startDate: new Date(), endDate: new Date(), location: 'Teams' },
    { title: 'Capacitación Azure', startDate: new Date(), endDate: new Date(), location: 'Online' },
    { title: 'Demo producto', startDate: new Date(), endDate: new Date(), location: 'Oficina' },
    { title: 'Revisión de tickets', startDate: new Date(), endDate: new Date(), location: 'Oficina' },
    { title: 'Onboarding nuevo usuario', startDate: new Date(), endDate: new Date(), location: 'Online' }
  ];
  for (const e of events) {
    const exists = await prisma.event.findMany({ where: { title: e.title }, take: 1 });
    if (exists.length === 0) await prisma.event.create({ data: e });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
