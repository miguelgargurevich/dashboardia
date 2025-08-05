import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


async function main() {
  // Eliminar todos los eventos, recursos y notas existentes (de prueba)
  await prisma.event.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.note.deleteMany({});
  // Variable global para fechas
  const now = new Date();
  // Usuarios
  const users = [
    { name: 'Admin', email: 'admin@soporte.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Miguel Gargurevich', email: 'miguel.gargurevich@gmail.com', password: await bcrypt.hash('miguel123', 10), role: 'user' }
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

  // Tipos de Eventos
  const tiposEventos = [
    { nombre: 'capacitacion', icono: 'fa-graduation-cap', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
    { nombre: 'reunion', icono: 'fa-users', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
    { nombre: 'incidente', icono: 'fa-exclamation-triangle', color: 'bg-red-500/20 text-red-400 border-red-400/30' },
    { nombre: 'notificaciones', icono: 'fa-bell', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30' },
    { nombre: 'otro', icono: 'fa-calendar-alt', color: 'bg-gray-500/20 text-gray-400 border-gray-400/30' }
  ];

  for (const t of tiposEventos) {
    const exists = await prisma.tipoEvento.findUnique({ where: { nombre: t.nombre } });
    if (!exists) {
      await prisma.tipoEvento.create({ data: t });
    } else {
      // Actualizar con color si no lo tiene
      await prisma.tipoEvento.update({
        where: { nombre: t.nombre },
        data: { 
          icono: t.icono,
          color: t.color 
        }
      });
    }
  }

  // Tipos de Notas
  const tiposNotas = [
    { nombre: 'Manual', descripcion: 'Manuales de usuario y técnicos', icono: 'fa-book', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
    { nombre: 'Guía', descripcion: 'Guías de referencia rápida', icono: 'fa-compass', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
    { nombre: 'Nota', descripcion: 'Notas generales y recordatorios', icono: 'fa-sticky-note', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
    { nombre: 'Checklist', descripcion: 'Listas de verificación', icono: 'fa-check-square', color: 'bg-orange-500/20 text-orange-400 border-orange-400/30' },
    { nombre: 'Incidente', descripcion: 'Documentación de incidentes', icono: 'fa-bug', color: 'bg-red-500/20 text-red-400 border-red-400/30' },
  ];

  for (const tn of tiposNotas) {
    const exists = await prisma.tipoNota.findUnique({ where: { nombre: tn.nombre } });
    if (!exists) {
      await prisma.tipoNota.create({ data: tn });
    } else {
      // Actualizar con descripción y color si no los tiene
      await prisma.tipoNota.update({
        where: { nombre: tn.nombre },
        data: { 
          descripcion: tn.descripcion,
          icono: tn.icono,
          color: tn.color 
        }
      });
    }
  }

  // Tipos de Recursos
  const tiposRecursos = [
    { nombre: 'Documentos PDF', descripcion: 'Archivos PDF y documentación', icono: 'fa-file-pdf', color: 'bg-red-500/20 text-red-400 border-red-400/30' },
    { nombre: 'Enlaces Web', descripcion: 'URLs y recursos en línea', icono: 'fa-link', color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
    { nombre: 'Videos', descripcion: 'Contenido multimedia y tutoriales', icono: 'fa-video', color: 'bg-purple-500/20 text-purple-400 border-purple-400/30' },
    { nombre: 'Archivos', descripcion: 'Documentos y archivos varios', icono: 'fa-file', color: 'bg-green-500/20 text-green-400 border-green-400/30' },
    { nombre: 'Notas', descripcion: 'Notas y apuntes rápidos', icono: 'fa-sticky-note', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' },
    { nombre: 'Plantillas', descripcion: 'Formularios y plantillas', icono: 'fa-file-alt', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-400/30' },
    { nombre: 'Contactos', descripcion: 'Información de contactos externos', icono: 'fa-address-book', color: 'bg-pink-500/20 text-pink-400 border-pink-400/30' },
    { nombre: 'Automatización IA', descripcion: 'Recursos de automatización e IA', icono: 'fa-robot', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' }
  ];

  for (const tr of tiposRecursos) {
    const exists = await prisma.tipoRecurso.findUnique({ where: { nombre: tr.nombre } });
    if (!exists) {
      await prisma.tipoRecurso.create({ data: tr });
    } else {
      // Actualizar con descripción y color si no los tiene
      await prisma.tipoRecurso.update({
        where: { nombre: tr.nombre },
        data: { 
          descripcion: tr.descripcion,
          icono: tr.icono,
          color: tr.color 
        }
      });
    }
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
    // Crear recursos relacionados y obtener sus IDs
    let resourceIds = [];
    if (e.relatedResources && e.relatedResources.length > 0) {
      for (const res of e.relatedResources) {
        let resourceData = {};
        if (res.startsWith('http')) {
          resourceData = {
            tipo: 'Enlaces Web',
            titulo: res,
            url: res,
            fechaCarga: now
          };
        } else {
          resourceData = {
            tipo: 'Archivos',
            titulo: res,
            filePath: res,
            fechaCarga: now
          };
        }
        // Buscar si ya existe un recurso con ese url o filePath
        let existing = null;
        if (resourceData.url) {
          existing = await prisma.resource.findFirst({ where: { url: resourceData.url } });
        } else if (resourceData.filePath) {
          existing = await prisma.resource.findFirst({ where: { filePath: resourceData.filePath } });
        }
        let resource;
        if (!existing) {
          resource = await prisma.resource.create({ data: resourceData });
        } else {
          resource = existing;
        }
        resourceIds.push(resource.id);
      }
    }
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
        endDate,
        relatedResources: resourceIds
      };
      delete eventData.recurrentDay;
      await prisma.event.create({ data: eventData });
    }
  }

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
