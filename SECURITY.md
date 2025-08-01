# 🚨 AVISO DE SEGURIDAD CRÍTICO

## ⚠️ ANTES DE CLONAR O CONTRIBUIR

Este repositorio contiene archivos de configuración que **NO** incluyen claves sensibles reales. Los archivos `.env.example` y documentación contienen **SOLO PLACEHOLDERS**.

### 🔒 **Archivos que NUNCA debes commitear:**
- `backend/.env` (contiene claves reales)
- `.env.local` (configuración local)
- Cualquier archivo con claves API reales

### 🛡️ **Archivos seguros en el repo:**
- `backend/.env.example` (plantilla con placeholders)
- `RENDER_SETUP.md` (documentación con ejemplos)
- `backend/README.md` (guías de configuración)

### 🔧 **Configuración segura:**

1. **Nunca hardcodees claves** en el código
2. **Usa variables de entorno** en producción
3. **Copia .env.example como .env** y completa con tus claves reales
4. **Configura variables en Render/Vercel** directamente

## 📝 **Para contribuidores:**

- ✅ Puedes subir cambios a documentación
- ✅ Puedes subir código funcional
- ❌ **NUNCA** subas archivos con claves reales
- ❌ **REVISA** que no haya claves en tus commits

### 🚨 **Si encuentras claves expuestas:**
1. Reporta inmediatamente
2. Regenera todas las claves comprometidas
3. Actualiza Render/Vercel con nuevas claves

---
**🛡️ Mantengamos este proyecto seguro para todos**
