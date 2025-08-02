const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();


async function main() {
  // Eliminar todos los eventos existentes (de prueba)
  await prisma.event.deleteMany({});
  // Variable global para fechas
  const now = new Date();
  // Usuarios
  const users = [
    { name: 'Admin', email: 'admin@soporte.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Usuario', email: 'usuario@soporte.com', password: await bcrypt.hash('user123', 10), role: 'user' },
    { name: 'Miguel Fernandez', email: 'miguel@soporte.com', password: await bcrypt.hash('miguel123', 10), role: 'soporte' },
    { name: 'Miguel Gargurevich', email: 'miguel.gargurevich@gmail.com', password: await bcrypt.hash('miguel123', 10), role: 'user' },
    { name: 'Sofia Lyz', email: 'sofia@soporte.com', password: await bcrypt.hash('sofia123', 10), role: 'user' },
    { name: 'Carlos Fernando', email: 'carlos@soporte.com', password: await bcrypt.hash('carlos123', 10), role: 'user' },
    { name: 'Juan Pérez', email: 'juan.perez@soporte.com', password: await bcrypt.hash('juan123', 10), role: 'soporte' },
    { name: 'Ana Torres', email: 'ana.torres@soporte.com', password: await bcrypt.hash('ana123', 10), role: 'soporte' },
    { name: 'Luis Gómez', email: 'luis.gomez@soporte.com', password: await bcrypt.hash('luis123', 10), role: 'soporte' }
  ];
  let soporteUsers = [];
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    let userRecord;
    if (!exists) {
      userRecord = await prisma.user.create({ data: u });
    } else {
      userRecord = await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          password: u.password,
          role: u.role
        }
      });
    }
    // Solo agregar usuarios con rol 'soporte'
    if (userRecord.role === 'soporte') {
      soporteUsers.push(userRecord);
    }
  }

  // Recursos
  const resources = [
    { tipo: 'enlace', titulo: 'Video Azure', url: 'https://youtube.com/azure', tags: ['azure', 'video'], categoria: 'Cloud' },
    { tipo: 'nota', titulo: 'Nota rápida', descripcion: 'Recordatorio importante', tags: ['personal'], categoria: 'General' },
    { tipo: 'archivo', titulo: 'Manual PDF', filePath: '/uploads/manual.pdf', tags: ['manual'], categoria: 'Documentos' },
    { tipo: 'video', titulo: 'Capacitación Teams', url: 'https://youtube.com/teams', tags: ['teams', 'capacitación'], categoria: 'Colaboración' },
    { tipo: 'enlace', titulo: 'Guía VPN', url: 'https://intranet/vpn', tags: ['vpn', 'manual'], categoria: 'Redes' },
    // Recursos extra para pruebas
    { tipo: 'archivo', titulo: 'Política Seguridad', filePath: '/uploads/politica-seguridad.pdf', tags: ['seguridad', 'pdf'], categoria: 'Seguridad' },
    { tipo: 'url', titulo: 'Portal de Soporte', url: 'https://soporte.empresa.com', tags: ['soporte', 'web'], categoria: 'Soporte' },
    { tipo: 'video', titulo: 'Onboarding IT', url: 'https://youtube.com/onboarding', tags: ['onboarding', 'it'], categoria: 'Recursos Humanos' },
    { tipo: 'ia-automatizacion', titulo: 'Bot de Automatización', descripcion: 'Automatiza procesos comunes', tags: ['ia', 'automatización'], categoria: 'Automatización' },
    { tipo: 'contactos-externos', titulo: 'Proveedor de Hosting', descripcion: 'Contacto de soporte hosting', tags: ['hosting', 'contacto'], categoria: 'Infraestructura' },
    { tipo: 'plantillas-formularios', titulo: 'Plantilla Solicitud Acceso', filePath: '/uploads/solicitud-acceso.docx', tags: ['plantilla', 'acceso'], categoria: 'Formularios' },
    { tipo: 'archivo', titulo: 'Manual de Usuario', filePath: '/uploads/manual-usuario.pdf', tags: ['manual', 'usuario'], categoria: 'Documentos' },
    { tipo: 'url', titulo: 'Wiki Interna', url: 'https://wiki.empresa.com', tags: ['wiki', 'documentación'], categoria: 'Documentación' },
    { tipo: 'archivo', titulo: 'Procedimiento Backup', filePath: '/uploads/backup.pdf', tags: ['backup', 'procedimiento'], categoria: 'Infraestructura' },
    { tipo: 'video', titulo: 'Capacitación Seguridad', url: 'https://youtube.com/seguridad', tags: ['seguridad', 'capacitacion'], categoria: 'Seguridad' },
    { tipo: 'url', titulo: 'Panel de Control', url: 'https://panel.empresa.com', tags: ['panel', 'control'], categoria: 'Administración' }
  ];
  for (const r of resources) {
    const exists = await prisma.resource.findMany({ where: { titulo: r.titulo }, take: 1 });
    if (exists.length === 0) await prisma.resource.create({ data: r });
  }

  // Eventos de negocio (limpiados sin campos inexistentes)
  const businessEvents = [
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "17",
      diaEnvio: "7 DE CADA MES",
      relatedResources: ["/files/manual.pdf", "https://youtube.com/azure"],
      title: "Validar si se cae - Jose Arce",
      description: "Validar si se cae - Jose Arce - INCLUSION ACUMULADA (CLIENTE)",
      location: "",
      eventType: "mantenimiento",
      recurrencePattern: "mensual",
      recurrentDay: 7
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "18",
      diaEnvio: "6 DE CADA MES",
      relatedResources: ["https://intranet/vpn"],
      title: "Validar si se cae - Jose Arce",
      description: "Validar si se cae - Jose Arce - INCLUSION ACUMULADA (BROKER)",
      location: "",
      eventType: "mantenimiento",
      recurrencePattern: "mensual",
      recurrentDay: 6
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "26",
      diaEnvio: "20 DE CADA MES",
      relatedResources: ["/uploads/backup.pdf"],
      title: "Jose Arce",
      description: "VG Cobranzas Borker  - 20.06 5pm",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 20
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "27",
      diaEnvio: "19 DE CADA MES",
      relatedResources: ["https://soporte.empresa.com"],
      title: "Jose Arce",
      description: "VG Cobranzas Cliente - 19.06 5pm",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 19
    },
    {
      validador: "Automático",
      modo: "Automatico",
      codigoDana: "13",
      diaEnvio: "2 DE CADA MES",
      relatedResources: ["https://wiki.empresa.com"],
      title: "Notificación Poliza Suspendiad 1º Envio",
      description: "Notificación Poliza Suspendiad 1º Envio",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 2
    },
    {
      validador: "Automático",
      modo: "Automatico",
      codigoDana: "13",
      diaEnvio: "21 DE CADA MES",
      relatedResources: ["https://panel.empresa.com"],
      title: "Notificación Poliza Suspendiad 2º Envio",
      description: "Notificación Poliza Suspendiad 2º Envio",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 21
    },
    {
      validador: "Automático",
      modo: "Automatico",
      codigoDana: "1",
      diaEnvio: "22 DE CADA MES",
      relatedResources: [],
      title: "Posible suspension de Cobertura",
      description: "Posible suspension de Cobertura",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 22
    },
    {
      validador: "Mailling Bot",
      modo: "Manual",
      codigoDana: "19",
      diaEnvio: "Las 1ras SEMANA DE CADA MES",
      relatedResources: [],
      title: "Mailling",
      description: "Mailling",
      location: "",
      eventType: "otro",
      recurrencePattern: "mensual",
      recurrentDay: 2
    },
    {
      validador: "TASKAGENT",
      modo: "Manual",
      codigoDana: "19",
      diaEnvio: "22 DE CADA MES / CUANDO LO SOLICITE BENNY X CORREO",
      relatedResources: ["/files/manual.pdf"],
      title: "WSM Mailing Liquidaciones Pendiendtes de pago",
      description: "WSM Mailing Liquidaciones Pendiendtes de pago",
      location: "",
      eventType: "otro",
      recurrencePattern: "mensual",
      recurrentDay: 22
    },
    {
      validador: "Anthony Mederos",
      modo: "Manual",
      codigoDana: "25",
      diaEnvio: "1er VIERNES  DE CADA MES",
      relatedResources: ["https://youtube.com/teams"],
      title: "LIQUIDACIONES WSM",
      description: "LIQUIDACIONES WSM",
      location: "",
      eventType: "otro",
      recurrencePattern: "mensual",
      recurrentDay: 7
    },
    {
      validador: "Si se cae- Fernando debe avisar",
      modo: "Manual",
      codigoDana: "23",
      diaEnvio: "9 de cada mes",
      relatedResources: ["/uploads/manual-usuario.pdf"],
      title: "Vida Ley ex empleados",
      description: "Vida Ley ex empleados",
      location: "",
      eventType: "incidente",
      recurrencePattern: "mensual",
      recurrentDay: 9
    },
    {
      validador: "ReportBot",
      modo: "Manual",
      codigoDana: "99",
      diaEnvio: "A DEMANDA (1 vez al mes)",
      relatedResources: ["/uploads/solicitud-acceso.docx"],
      title: "Reportes integrales de agencia",
      description: "Reportes integrales de agencia",
      location: "",
      eventType: "otro",
      recurrencePattern: "mensual",
      recurrentDay: 1
    }
  ];
  
  for (const e of businessEvents) {
    // Crear el evento para cada mes del año actual
    for (let mes = 0; mes < 12; mes++) {
      const year = now.getFullYear();
      // Si el día es válido para el mes
      let day = e.recurrentDay;
      // Si el mes no tiene ese día, usar el último día del mes
      const daysInMonth = new Date(year, mes + 1, 0).getDate();
      if (day > daysInMonth) day = daysInMonth;
      const startDate = new Date(year, mes, day, 9, 0, 0); // 9:00 AM
      const endDate = new Date(year, mes, day, 10, 0, 0); // 10:00 AM
      const eventData = {
        ...e,
        startDate,
        endDate
      };
      delete eventData.recurrentDay;
      await prisma.event.create({ data: eventData });
    }
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
