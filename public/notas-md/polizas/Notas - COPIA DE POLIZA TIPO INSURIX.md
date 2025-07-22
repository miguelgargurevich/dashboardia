
# 📄 Generación de Copia de Póliza - Sistema INSURIX

**Tipo:** Procedimiento de reimpresión de pólizas  
**Sistema:** INSURIX  
**Responsable:** Christian  
**Fecha de actualización:** 21 de julio de 2025

---

## 📁 Rutas de Trabajo

### 🗂️ Directorio Principal
```
C:\Users\D0924186.PDCVIDA\Desktop\MFERNANDEZ\GESITON DOCUMENTAL-updated\SSCC - Gestion Documental\Listo - 10 - Reimpresion Polizas\INSURIX
```

### 📂 Directorios Adicionales
- **Plantillas**: `...\Plantillas\Insurix`
- **Carpeta de trabajo final**: `ULTIMA POLIZA`
- **Scripts**: Carpeta `Actividades` (scripts finales para INSURIX)

---

## 🔧 Arquitectura del Proceso

### 📊 Scripts del Sistema INSURIX

| # | Script | Función Principal | Frecuencia | Ubicación |
|---|--------|-------------------|------------|-----------|
| **1** | `1_PV50_INX_Qry_ActualizarParametroEstadoImpresion_UPD` | Actualiza parámetros de impresión | 1 vez por día | Carpeta principal |
| **2** | `2_PV50_INX_Qry_InformacionPolizas_SEL_XXXXXX` | Consulta información de póliza específica | Por solicitud | Carpeta principal |
| **3** | `3_up_GenerarKitIndividual` | Genera kit de impresión individual | Por solicitud | Carpeta principal |
| **4** | `PV88_SID_ConsultaBandejaPlantillaPoliza` | Consulta bandeja de plantillas | Por solicitud | **Fuera de carpeta principal** |

### 🏗️ Códigos de Sistema

| Sistema | Código | Descripción |
|---------|--------|-------------|
| **VIAP** | 1.0000 | Sistema VIAP |
| **INSURIX** | 2.0000 | Sistema INSURIX (objetivo) |
| **SAM** | 3.0000 | Sistema SAM estándar |
| **SAM Masivo** | 4.0000 | Sistema SAM procesamiento masivo |

---

## � Procedimiento Completo

### ✅ Prerequisitos

1. **Ticket de ServiceNow** con número de póliza
2. **Acceso a base de datos** INSURIX
3. **Acceso a carpetas** de plantillas y trabajo
4. **Microsoft Word** con funciones de mailings

---

### � **PASO 1: Inicialización Diaria**

> ⚠️ **Importante**: Este paso se ejecuta **solo una vez por día**

#### 🎯 Objetivo
Actualizar parámetros de estado de impresión para el sistema INSURIX

#### 🚀 Ejecución
```sql
-- Script: 1_PV50_INX_Qry_ActualizarParametroEstadoImpresion_UPD
-- Frecuencia: 1 vez al día
-- Función: Actualiza datos antes y después de operaciones
-- Considera todos los parámetros de impresión
EXEC [Script1_ActualizarParametros];
```

#### ✅ Validación
- Verificar que la ejecución sea exitosa
- Confirmar actualización de parámetros de impresión

---

### � **PASO 2: Consulta de Información de Póliza**

#### 🎯 Objetivo
Obtener información detallada de la póliza solicitada

#### 📋 Datos Requeridos
- **Número de póliza** (extraído del ticket ServiceNow)
- **Ejemplo**: `1550215502`

#### 🚀 Ejecución
```sql
-- Script: 2_PV50_INX_Qry_InformacionPolizas_SEL_XXXXXX
-- Input: Número de póliza del ticket
-- Output: Número de operación + Código de producto
DECLARE @numeropoliza VARCHAR(20) = '1550215502'; -- Del ticket
EXEC [Script2_ConsultarPoliza] @numeropoliza;
```

#### � Resultados Obtenidos
- **Número de operación** (para Step 3)
- **Código de producto** (para Step 3)

---

### 🟢 **PASO 3: Generación de Kit Individual**

#### 🎯 Objetivo
Generar el kit de impresión usando los datos del paso anterior

#### 📋 Datos de Entrada
- **Número de operación** (del Paso 2)
- **Código de producto** (del Paso 2)
- **Ejemplo**: `323087968`

#### 🚀 Ejecución
```sql
-- Script: 3_up_GenerarKitIndividual
-- Input: Datos del script 2
DECLARE @nroSolicitud INT = 323087968; -- Del paso 2
DECLARE @codigoProducto VARCHAR(10) = '714528'; -- Del paso 2

EXEC up_GenerarKitIndividual 
    @nroSolicitud = @nroSolicitud,
    @codigoProducto = @codigoProducto;
```

#### 🔍 Validación de Generación
```sql
-- Verificar que la data fue generada correctamente
SELECT TOP 5 * 
FROM cola_impresion 
ORDER BY fechacreacion DESC;
```

> ✅ **Criterio de éxito**: La primera fila debe ser del día actual

#### � Actualización Línea 11
```sql
-- Campo NombreSP - Para INSURIX:
EXEC up_ObtenerCartasImpresionKit '714528','';

-- Para otros sistemas (referencia):
-- EXEC up_ObtenerCartasImpresionKitV2 '714528','';
```

---

### 🟢 **PASO 4: Consulta de Bandeja de Plantillas**

#### 🎯 Objetivo
Obtener la bandeja de plantillas para sistema INSURIX

#### 📍 Ubicación del Script
> ⚠️ **Nota**: Este script está **fuera de la carpeta principal**

#### 🚀 Ejecución
```sql
-- Script: PV88_SID_ConsultaBandejaPlantillaPoliza (línea 1)
SET NOCOUNT ON;

DECLARE @carta INT = 191;        -- Código de carta
DECLARE @sistema INT = 2;        -- INSURIX = 2.0000
DECLARE @bandeja INT;

-- Obtener ID de bandeja para INSURIX
EXEC Impresion.usp_ObtenerBandeja @carta, @sistema;
```

#### 📤 Resultado Esperado
- **ID de bandeja** para sistema INSURIX
- **Nombres de plantillas** correspondientes

---

## 📄 Generación de Documentos

### 🗃️ Gestión de Plantillas

#### 📂 Ubicación de Plantillas Generadas
```
C:\Users\D0924186.PDCVIDA\Desktop\MFERNANDEZ\GESITON DOCUMENTAL-updated\Plantillas\Insurix
```

#### 📋 Criterios de Selección
- **Usar nombres exactos** obtenidos del script anterior
- **Evitar sufijos** como `v2` 
  - ✅ Correcto: `regCartaSolicitudPoliza.xls`
  - ❌ Incorrecto: `regCartaSolicitudPolizav2.xls`
- **Copiar plantillas** a carpeta de trabajo: `ULTIMA POLIZA`

#### � Integración de Datos
```sql
-- Resultado del Paso 3 (Línea 11) se pega en Excel de plantilla
-- El resultado de up_ObtenerCartasImpresionKit debe integrarse
```

---

### 📝 Proceso de Mail Merge

#### 🎯 Microsoft Word - Funciones de Correspondencia

1. **Abrir archivo Word** correspondiente a la plantilla
2. **Navegar a pestaña** `Mailings`
3. **Configurar origen de datos**:
   - `Select Recipients` → `Use Existing List`
   - **Cargar Excel generado** en pasos anteriores
4. **Finalizar combinación**:
   - `Finish & Merge` → `Edit Individual Documents` → `OK`
5. **Guardar documento final**:
   - **Formato**: PDF
   - **Nombre**: `[Número de póliza].pdf`
   - **Ejemplo**: `1550215502.pdf`

---

## 📋 Ejemplos Prácticos

### 🎫 Caso de Referencia

#### Ticket ServiceNow
- **ID**: `INC0792078`
- **Póliza**: `1550215502 - INSURIX`
- **Fecha**: `16-07-2025 13:17:11`
- **Solicitante**: Fernando Antonio Valdez Chavez

#### 📁 Flujo de Carpetas
```
Ruta base: SSCC - Gestion Documental\Listo - 10 - Reimpresion Polizas\INSURIX\
├── Actividades/               # Scripts finales INSURIX
├── Scripts principales/       # Scripts 1, 2, 3
├── Plantillas generadas/      # Salida del proceso
└── ULTIMA POLIZA/            # Carpeta de trabajo final
```

---

## 🔧 Troubleshooting

### ❗ Problemas Comunes

| Problema | Causa Probable | Solución |
|----------|----------------|----------|
| Script 1 falla | Ya ejecutado hoy | Verificar log de ejecución diaria |
| No encuentra póliza | Número incorrecto | Validar número del ticket ServiceNow |
| Cola vacía | Kit no generado | Revisar ejecución del Script 3 |
| Plantilla no encontrada | Ruta incorrecta | Verificar ubicación en carpeta Insurix |

### 🔍 Puntos de Validación

- [ ] **Script 1**: Ejecutado solo una vez por día
- [ ] **Script 2**: Número de póliza correcto del ticket
- [ ] **Script 3**: Datos generados en cola_impresion
- [ ] **Script 4**: Bandeja obtenida para INSURIX (código 2)
- [ ] **Plantillas**: Sin sufijos v2, ubicadas correctamente
- [ ] **Documento final**: PDF con nombre de póliza

---

## 📞 Recursos y Contactos

### 🗂️ Archivos de Configuración
- **Scripts INSURIX**: Carpeta `Actividades`
- **Plantillas**: Directorio `Plantillas\Insurix`
- **Documentos finales**: Carpeta `ULTIMA POLIZA`

### 🔄 Mantenimiento
- **Frecuencia Script 1**: Diaria (automatizada)
- **Scripts 2-4**: Por demanda de tickets
- **Revisión de plantillas**: Semanal

---

## ⚠️ Notas Importantes

> - **Script 1 es único diario** - No ejecutar múltiples veces
> - **Script 4 está fuera** de la carpeta principal
> - **Validar siempre** que cola_impresion tenga registros del día actual
> - **Usar plantillas sin sufijos** v2 para evitar errores
> - **Código INSURIX es 2.0000** en tabla de sistemas