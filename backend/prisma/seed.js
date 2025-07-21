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
  const cantidadPorMes = 25; // Aumentar la cantidad
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
      // Asignar usuario de soporte aleatorio, pero distribuir equitativamente
      const soporteUser = soporteUsers[i % soporteUsers.length];
      if (exists.length === 0) await prisma.ticket.create({ data: { ...template, descripcion, createdAt: fechaBase, userId: soporteUser.id } });
      // Tendencia creciente: agregar más tickets en meses posteriores
      if (mes > 0 && i < mes * 2) {
        let fechaExtra = new Date(year, mes, dia);
        fechaExtra.setHours(Math.floor(Math.random() * 23));
        fechaExtra.setMinutes(Math.floor(Math.random() * 59));
        const descripcionExtra = template.descripcion + ` [${year}-${mes+1}-${dia}] extra#${i}`;
        const existsExtra = await prisma.ticket.findMany({ where: { descripcion: descripcionExtra }, take: 1 });
        const soporteUserExtra = soporteUsers[(i + mes) % soporteUsers.length];
        if (existsExtra.length === 0) await prisma.ticket.create({ data: { ...template, descripcion: descripcionExtra, createdAt: fechaExtra, userId: soporteUserExtra.id } });
      }
    }
  }

  // Eventos de negocio
  const businessEvents = [
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "17",
      nombreNotificacion: "INCLUSION ACUMULADA (CLIENTE)",
      diaEnvio: "7 DE CADA MES",
      query: "BBB Envio Liquidacion Inclusion Acumulada VG - Cliente - 9006 programacion",
      title: "Validar si se cae - Jose Arce",
      description: "Validar si se cae - Jose Arce - INCLUSION ACUMULADA (CLIENTE)",
      location: "",
      // Se generarán fechas para cada mes en el ciclo de abajo
      recurrentDay: 7
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "18",
      nombreNotificacion: "INCLUSION ACUMULADA (BROKER)",
      diaEnvio: "6 DE CADA MES",
      query: "AAA Envío Liquidacion Inclusion Acumulada VG - Broker - 9007 programacion",
      title: "Validar si se cae - Jose Arce",
      description: "Validar si se cae - Jose Arce - INCLUSION ACUMULADA (BROKER)",
      location: "",
      recurrentDay: 6
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "26",
      nombreNotificacion: "VG Cobranzas Borker  - 20.06 5pm",
      diaEnvio: "20 DE CADA MES",
      query: "VIDA GRUPO Cobranza Broker - 107 programacion",
      title: "Jose Arce",
      description: "VG Cobranzas Borker  - 20.06 5pm",
      location: "",
      recurrentDay: 20
    },
    {
      validador: "Jose Arce",
      modo: "Manual",
      codigoDana: "27",
      nombreNotificacion: "VG Cobranzas Cliente - 19.06 5pm",
      diaEnvio: "19 DE CADA MES",
      query: "VIDA GRUPO Cobranza Cliente - 108 programacion",
      title: "Jose Arce",
      description: "VG Cobranzas Cliente - 19.06 5pm",
      location: "",
      recurrentDay: 19
    },
    {
      validador: "",
      modo: "Automatico",
      codigoDana: "13",
      nombreNotificacion: "Notificación Poliza Suspendiad 1º Envio",
      diaEnvio: "2 DE CADA MES",
      query: "CCC Notificación Aviso Suspensión programacion",
      title: "Notificación Poliza Suspendiad 1º Envio",
      description: "Notificación Poliza Suspendiad 1º Envio",
      location: "",
      recurrentDay: 2
    },
    {
      validador: "",
      modo: "Automatico",
      codigoDana: "13",
      nombreNotificacion: "Notificación Poliza Suspendiad 2º Envio",
      diaEnvio: "21 DE CADA MES",
      query: "CCC Notificación Aviso Suspensión programacion",
      title: "Notificación Poliza Suspendiad 2º Envio",
      description: "Notificación Poliza Suspendiad 2º Envio",
      location: "",
      recurrentDay: 21
    },
    {
      validador: "",
      modo: "Automatico",
      codigoDana: "1",
      nombreNotificacion: "Posible suspension de Cobertura",
      diaEnvio: "22 DE CADA MES",
      query: "Sin query",
      title: "Posible suspension de Cobertura",
      description: "Posible suspension de Cobertura",
      location: "",
      recurrentDay: 22
    },
    {
      validador: "",
      modo: "Manual",
      codigoDana: "19",
      nombreNotificacion: "Mailling",
      diaEnvio: "Las 1ras SEMANA DE CADA MES",
      query: "",
      title: "Mailling",
      description: "Mailling",
      location: "",
      recurrentDay: 2
    },
    {
      validador: "TASKAGENT",
      modo: "Manual",
      codigoDana: "19",
      nombreNotificacion: "WSM Mailing Liquidaciones Pendiendtes de pago",
      diaEnvio: "22 DE CADA MES / CUANDO LO SOLICITE BENNY X CORREO",
      query: "envio liquidaciones WSM programacion",
      title: "WSM Mailing Liquidaciones Pendiendtes de pago",
      description: "WSM Mailing Liquidaciones Pendiendtes de pago",
      location: "",
      recurrentDay: 22
    },
    {
      validador: "Anthony Mederos",
      modo: "Manual",
      codigoDana: "25",
      nombreNotificacion: "LIQUIDACIONES WSM",
      diaEnvio: "1er VIERNES  DE CADA MES",
      query: "envio liquidaciones WSM programacion",
      title: "LIQUIDACIONES WSM",
      description: "LIQUIDACIONES WSM",
      location: "",
      recurrentDay: 7
    },
    {
      validador: "Si se cae- Fernando debe avisar",
      modo: "Manual",
      codigoDana: "23",
      nombreNotificacion: "Vida Ley ex empleados",
      diaEnvio: "9 de cada mes",
      query: "XXX Envío de Renovaciones VL Ex-Empleados",
      title: "Vida Ley ex empleados",
      description: "Vida Ley ex empleados",
      location: "",
      recurrentDay: 9
    },
    {
      validador: "",
      modo: "Manual",
      codigoDana: "",
      nombreNotificacion: "Reportes integrales de agencia",
      diaEnvio: "A DEMANDA (1 vez al mes)",
      query: "C:\\Users\\D3896536\\Desktop\\CSHICA\\SSCC - Gestion Documental\\Listo - 13 - Reportes Sucave - Trimestral\\Listo - 11 - Reportes Integrales\\04 AGENCIAS",
      title: "Reportes integrales de agencia",
      description: "Reportes integrales de agencia",
      location: "",
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
