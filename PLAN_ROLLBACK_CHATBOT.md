# Plan de Rollback - Chatbot Pre-Coordinación

**Fecha:** 2025-01-28  
**Propósito:** Guía rápida para revertir cambios del chatbot si es necesario

---

## 🚨 Rollback Rápido (Si hay Problemas Críticos)

### Método 1: Revertir a Checkpoint (Más Seguro)

```bash
# 1. Verificar tag disponible
git tag -l "antes-chatbot*"

# 2. Revertir a checkpoint
git checkout antes-chatbot-pre-coordinacion

# 3. Crear rama de rollback
git checkout -b rollback-sin-chatbot

# 4. Si todo está bien, hacer merge a main
git checkout main
git merge rollback-sin-chatbot
```

### Método 2: Eliminar Solo Archivos del Chatbot

```bash
# Eliminar archivos nuevos del chatbot
rm -rf frontend/src/components/ChatbotPreCoordinacion.js
rm -rf frontend/src/lib/chatbot/
rm -rf frontend/src/pages/api/pre-coordinacion/chatbot.js
rm -rf frontend/src/styles/ChatbotPreCoordinacion.module.css

# Revertir archivo modificado
git checkout antes-chatbot-pre-coordinacion -- frontend/src/pages/pre-coordinacion/[token].js

# Commit y push
git add -A
git commit -m "Revert: Eliminar chatbot - rollback a versión estable"
git push origin main
```

### Método 3: Desactivar Chatbot (Sin Eliminar Código)

Si solo quieres desactivar el chatbot temporalmente sin eliminar el código:

```javascript
// En frontend/src/pages/pre-coordinacion/[token].js
// Comentar o eliminar estas líneas:

{/* Chatbot de ayuda - Opcional, no invasivo */}
{/* <ChatbotPreCoordinacion
  tipoEvento={tipoEventoNormalizado}
  pasoActual={pasoActual}
  respuestasCliente={respuestasCliente}
/> */}
```

---

## ✅ Verificación Post-Rollback

Después de revertir, verificar:

1. **Página de pre-coordinación:**
   - ✅ Carga correctamente
   - ✅ Formulario funciona
   - ✅ Se pueden guardar respuestas
   - ✅ No hay errores en consola

2. **APIs:**
   - ✅ `/api/pre-coordinacion/[token]` funciona
   - ✅ No hay errores 404 o 500

3. **Base de datos:**
   - ✅ No hay cambios en esquema
   - ✅ Datos intactos

---

## 📋 Checklist de Rollback

- [ ] Crear backup de base de datos (si es necesario)
- [ ] Revertir código a checkpoint
- [ ] Verificar que no hay errores de compilación
- [ ] Probar página de pre-coordinación
- [ ] Verificar que formulario funciona
- [ ] Revisar logs del servidor
- [ ] Hacer deploy de versión revertida
- [ ] Verificar en producción

---

## 🔍 Diagnóstico de Problemas

### Si el chatbot causa errores:

1. **Error en consola del navegador:**
   - Revisar errores JavaScript
   - Verificar que los imports están correctos

2. **Error 404 en API:**
   - Verificar que `/api/pre-coordinacion/chatbot` existe
   - Revisar rutas de Next.js

3. **Error de compilación:**
   - Verificar sintaxis de archivos nuevos
   - Revisar dependencias

### Solución Rápida:

Si hay errores críticos, el rollback más rápido es:

```bash
git checkout antes-chatbot-pre-coordinacion -- frontend/src/pages/pre-coordinacion/[token].js
git add frontend/src/pages/pre-coordinacion/[token].js
git commit -m "Hotfix: Revertir integración de chatbot"
git push origin main
```

Esto revierte solo la integración, dejando los archivos del chatbot pero sin usarlos.

---

## 📞 Contacto

Si necesitas ayuda con el rollback:
1. Revisar este documento
2. Verificar checkpoint: `CHECKPOINT_ANTES_CHATBOT.md`
3. Revisar logs de Vercel/Servidor

---

**Última actualización:** 2025-01-28

