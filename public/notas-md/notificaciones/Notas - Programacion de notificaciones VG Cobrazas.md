# Programación de Notificaciones VG Cobranzas

**Tipo:** Procedimiento de programación de notificaciones para brokers y clientes  
**Responsable:** Christian  
**Fecha de actualización:** 21 de julio de 2025

---

## 📊 Calendario de Notificaciones Obligatorias

> 📋 **Referencia**: Excel "Flujo de gestión documental" - Estas notificaciones DEBEN salir en las fechas establecidas

### 📅 Cronograma Mensual

| **Tipo de Notificación** | **Fecha** | **Programación/Query** | **Destinatario** |
|---------------------------|-----------|------------------------|-------------------|
| **INCLUSIÓN ACUMULADA (BROKER)** | 6 de cada mes | AAA Envío Liquidación Inclusión Acumulada VG - Broker - 9007 | Brokers |
| **INCLUSIÓN ACUMULADA (CLIENTE)** | 7 de cada mes | BBB Envío Liquidación Inclusión Acumulada VG - Cliente - 9006 | Clientes |
| **Vida Ley Ex-empleados** | 9 de cada mes | XXX Envío de Renovaciones VL Ex-Empleados | Ex-empleados |
| **VG Cobranzas Cliente** | 19 de cada mes (5 PM) | VIDA GRUPO Cobranza Cliente - 108 | Clientes |
| **VG Cobranzas Broker** | 20 de cada mes (5 PM) | VIDA GRUPO Cobranza Broker - 107 | Brokers |
| **Notificación Póliza Suspendida (1º)** | 2 de cada mes | CCC Notificación Aviso Suspensión | Clientes |
| **Notificación Póliza Suspendida (2º)** | 21 de cada mes | CCC Notificación Aviso Suspensión | Clientes |
| **Posible Suspensión de Cobertura** | 22 de cada mes | Sin query | Clientes |
| **WSM Mailing Liquidaciones** | 22 de cada mes | Envío liquidaciones WSM | WSM |
| **Liquidaciones WSM** | 1er viernes de cada mes | Envío liquidaciones WSM | WSM |

### 📧 Notificaciones Especiales

| **Tipo** | **Frecuencia** | **Observaciones** |
|----------|----------------|-------------------|
| **Mailing General** | 1ª semana de cada mes | - |
| **WSM Liquidaciones Pendientes** | A demanda por correo de Benny | Solicitud específica |
| **Reportes Integrales de Agencia** | A demanda (1 vez al mes) | Ruta: `C:\Users\D3896536\Desktop\CSHICA\SSCC - Gestion Documental\Listo - 13 - Reportes Sucave - Trimestral\Listo - 11 - Reportes Integrales\04 AGENCIAS` |

---

## ⚠️ Consideraciones Especiales para Fin de Mes

### 🚨 Programación Anticipada
- **VG Cobranzas Broker (20)**: Cae en domingo → Programar 1 día antes
- **VG Cobranzas Cliente (19)**: Cae en sábado → Programar 1 día antes
- **Motivo**: Los jobs probablemente no trabajen en fin de semana

---

## 🔧 Proceso de Programación

### 📋 Prerequisitos

#### 1. Validación de Encolado
- **Responsable**: José Arce
- **Verificación**: Las pólizas deben estar encoladas según validador
- **Referencia**: Columna "Validador" del Excel "Flujo gestión documental"

> ℹ️ **Importante**: Encolar significa que José Arce registra la data en la tabla de cola de impresión que DANA va a leer

#### 2. Confirmación de Data
- **Pregunta clave**: "¿Ya están encoladas las pólizas?"
- **Contacto**: José Arce (encargado de generar la data)
- **Tabla objetivo**: Cola de impresión (Póliza, archivo, etc.)

---

### 🔄 Flujo de Ejecución

#### **Paso 1: Coordinación con José Arce**
1. Confirmar que la data está generada y encolada
2. Definir fecha y hora de programación
3. Obtener confirmación para proceder

#### **Paso 2: Ejecución del Query**
- **Ubicación**: Servidor de base de datos
- **Ambiente**: BD de pruebas → BD de producción
- **Responsable técnico**: Cris (pasará los queries y mostrará ejecución)

#### **Paso 3: Modificación del Query**
```sql
-- Estructura base del query
VALUES (@idProceso, @idFrecuenciaProceso, @fechaHora, 1, '', 'DLGRITM', GETDATE())
```

**Parámetros a modificar:**
- **@fechaHora**: Nueva fecha/hora de programación
- **'DLGRITM'**: Cambiar por número de ticket
- **Estado**: 1 = No ejecutado, 3 = Ya ejecutado

#### **Paso 4: Generación de Ticket**
- **Cuándo**: Después de confirmar programación en desarrollo
- **Contenido**: Archivos de ejecución (2 archivos)
- **Alternativa**: Usar ticket pendiente existente

---

## 📋 Gestión de Tickets

### 🎫 Creación de Tarea
- **Estado inicial**: Pendiente
- **Cambio a**: Asignado cuando se procese
- **Ejemplo**: TASK0116231

### 📤 Envío de Evidencias
1. **Screenshot** al grupo de gestión documental
2. **Archivos de ejecución** (2 archivos)
3. **Notificación** al grupo MD

### ⏰ Horarios de Atención
- **Ventana de atención**: 6:30 AM - 8:30 AM
- **Tiempo de respuesta**: Normalmente rápido
- **Descripción típica**: "Programar notificaciones VG Cobranzas Broker y Cliente"

---

## 📁 Archivos y Ubicaciones

### 📊 Documentos de Referencia
- **Excel principal**: "Flujo de gestión documental"
- **Columna F**: Queries de programación
- **Servidor**: Ubicación de queries de producción

### 💾 Rutas de Archivos
- **Reportes Integrales**: `C:\Users\D3896536\Desktop\CSHICA\SSCC - Gestion Documental\Listo - 13 - Reportes Sucave - Trimestral\Listo - 11 - Reportes Integrales\04 AGENCIAS`

---

## 👥 Contactos Clave

| **Rol** | **Responsable** | **Función** |
|---------|----------------|-------------|
| **Generación de Data** | José Arce | Encolado de pólizas y confirmación de data |
| **Soporte Técnico** | Cris | Queries y ejecución en BD |
| **Solicitudes WSM** | Benny | Liquidaciones por correo |
| **Grupo MD** | Equipo gestión documental | Procesamiento de tickets |

---

## ⚠️ Notas Importantes

> - **Siempre** confirmar encolado antes de programar
> - **Anticipar** programación para fechas de fin de semana
> - **Validar** estado de ejecución en queries (1 = pendiente, 3 = ejecutado)
> - **Generar** evidencias para seguimiento de tickets
> - **Coordinar** horarios de atención del grupo MD (6:30-8:30 AM)