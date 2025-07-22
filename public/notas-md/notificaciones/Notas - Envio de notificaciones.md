# Envío de Notificaciones - Procedimiento Operativo

**Responsable:** Christian  
**Fecha de actualización:** 21 de julio de 2025

## ✅ Checklist de Preparación del Ambiente

Antes de iniciar el proceso diario, verificar que se cumplan los siguientes requisitos:

### 1. Accesos y Conexiones
- [ ] **Escritorio Remoto**: Logueado al ambiente de desarrollo usando escritorio remoto (NO W365)
- [ ] **ServiceNow**: Abierto y listo para uso
- [ ] **SQL Management Studio**: Conectado y logueado
- [ ] **DANA**: Sesión activa y logueada

### 2. Contactos Importantes
- **Bryan Garibay**: BryanGaribayR@proveedores.pacifico.com.pe
  - Solicitar inclusión en el correo "Proceso de carga de emisiones seguro respaldo" (1-4 PM diarios)

---

## 🔄 Proceso Diario de Envío de Notificaciones

### 📋 Actividades Matutinas (8:00 AM)

#### 1. Limpieza Previa
> ⚠️ **IMPORTANTE**: Siempre realizar limpieza de la cola antes de reenviar

#### 2. Generación de Informes DANA
- **Hora**: 8:00 AM
- **Acciones**:
  - Generar informes de envío de DANA
  - Tomar pantallazos de los resultados
  - Enviar capturas al grupo de WhatsApp

#### 3. Validación de Pólizas
- **Verificar**: Que todas las pólizas hayan sido procesadas por DANA
- **Ejemplo**: Si hay 771 pólizas pero DANA procesó solo 671
  - **Diferencia**: 100 pólizas pendientes
  - **Acción**: Reencolar antes de las 9:00 AM

#### 4. Ejecución de Script de Validación
- **Hora**: 8:00 AM
- **Criterio de evaluación**: El resultado debe ser menor a 50 (normal)
- **Si es mayor a 50**: Proceder con reencolado

---

### ⏰ Horarios Críticos de DANA

| Hora | Actividad |
|------|-----------|
| 6:30 AM | Horario normal de envío programado |
| 8:00 AM | Generación de informes y validación |
| 9:00 AM | Revisión de cola por DANA / Deadline para reencolado |
| 11:00 AM | Siguiente ventana de envío de DANA |

---

## 🔧 Procedimiento de Reencolado

### Cuando Reencolar
- Resultado de validación > 50 pólizas
- Diferencias entre pólizas esperadas vs procesadas por DANA
- Pólizas que permanecen en cola de impresión

### Scripts de Reencolado
1. **Encolar Físico a Electrónico**
2. **Encolar SAM Masivo**
3. **Encolar SAM**
4. **Query de Resumen** (ubicado en la carpeta)

### Proceso de Tickets
1. **Actualizar pólizas para reencolado**
2. **Enviar ticket a Producción** para ejecución
3. **Programar envío a DANA** (hora: 09:00 o antes)
4. **Esperar confirmación** de ejecución
5. **Si falla**: Reencolar a las 10:00 AM o 11:00 AM
6. **Reprogramar** para 6:30 AM del día siguiente
7. **Enviar ticket final** para volver al horario normal (6:30 AM)

---

## 📧 Fuente de Información

### Correo Diario
- **Asunto**: "Proceso de carga de emisiones seguro respaldo"
- **Horario**: 1:00 PM - 4:00 PM (todos los días)
- **Contacto**: BryanGaribayR@proveedores.pacifico.com.pe
- **Solicitud pendiente**: Inclusión en lista de distribución

---

## 📂 Recursos y Documentación

### Documentos de Referencia
- [ ] Revisar documentos Word del **Punto 1 del flujo principal**
- [ ] Organizar puntos vs documentos existentes
- [ ] Documentación end-to-end del flujo VIAP (explicación por Cirs)

### Ejemplos Requeridos
- **SAM Masivo**: [Ejemplo pendiente]
- **VIAP**: [Ejemplo pendiente]

### Carpetas de Trabajo
- **Carpeta SGP**: Recursos de Manuel
- **Scripts**: Ubicados en carpeta designada

---

## 🎯 Prioridades del Proyecto

### VIAP (Alta Prioridad)
- Proyecto de herencia de notificaciones
- Envío y modificaciones de frecuencias
- Documentación completa del flujo

### Tareas Pendientes
- [ ] Completar documentación end-to-end VIAP
- [ ] Crear ejemplos de SAM Masivo y VIAP
- [ ] Organizar documentación existente
- [ ] Coordinar transferencia de conocimiento

---

## ⚠️ Notas Importantes

> - **Siempre** limpiar cola antes de reenviar
> - **Monitorear** alertas si no se envía a las 9:00 AM
> - **Validar** resultado de scripts < 50 para operación normal
> - **Mantener** horario estándar de 6:30 AM para envíos programados