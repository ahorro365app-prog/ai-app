# 🚀 DEPLOY MANUAL A VERCEL

## ⚠️ IMPORTANTE
Vercel no está haciendo deploy automático. Debemos hacerlo manualmente.

---

## 📋 PASOS PARA DEPLOY MANUAL

### 1. Ir a Vercel Dashboard
- URL: https://vercel.com/dashboard
- Login si es necesario

### 2. Seleccionar Proyecto
- Buscar: `admin-dashboard` o tu proyecto
- Clic en el proyecto

### 3. Ver Deployments
- En el menú lateral: `Deployments`
- Deberías ver la lista de deploys

### 4. Trigger Deploy Manual
**Opción A: Redeploy del último**
- Clic en los 3 puntos (`...`) del último deployment
- Seleccionar: `Redeploy`
- Confirmar

**Opción B: Deploy desde Git**
- Clic en el botón `Deploy` en la esquina superior derecha
- Seleccionar el branch: `main`
- Confirmar

### 5. Esperar
- Ver el progreso del build
- Debería tomar ~40 segundos
- Estado cambia a "Ready" cuando termine

### 6. Verificar
- Ver el último commit: `debug: add logging to diagnose multiple TX detection`
- Status: `Ready` con punto verde

---

## 🧪 DESPUÉS DEL DEPLOY

Una vez que el deployment esté "Ready":

1. **Esperar 30 segundos** para que se propague
2. **Probar mensaje de nuevo** por WhatsApp
3. **Ver logs** en Vercel:
   - Clic en el nuevo deployment
   - Tab: `Functions`
   - Seleccionar: `api/webhooks/baileys`
   - Ver los logs con `🔍 DEBUG` messages

---

## 🔍 VER LOGS EN VERCEL

1. Clic en el deployment activo
2. Tab: `Functions` o `Logs`
3. Buscar: `🔍 DEBUG`
4. Deberías ver:
   ```
   ✅ Groq multiple result: {...}
   🔍 DEBUG: groqResult?.esMultiple: true o false
   🔍 DEBUG: groqResult?.transacciones?.length: N
   ```

Si ves:
- `esMultiple: false` → El prompt de Groq no está funcionando
- `transacciones?.length: 1` → Groq solo detecta 1 TX
- `groqResult: null` → Error al parsear JSON o API de Groq

---

## ✅ CHECKLIST

- [ ] Clic en "Redeploy" o "Deploy"
- [ ] Esperar a que termine (Ready status)
- [ ] Esperar 30 segundos para propagación
- [ ] Enviar mensaje de prueba por WhatsApp
- [ ] Ver logs en Vercel
- [ ] Analizar `🔍 DEBUG` logs

---

## 📝 SI SIGUE FALLANDO

Compartir conmigo los logs de `🔍 DEBUG` para diagnosticar el problema.

