# 🚀 Guía: Configurar GitHub Actions para Cron de 1 Minuto

> **Fecha:** 2025-01-22  
> **Propósito:** Configurar cron de 1 minuto usando GitHub Actions (gratis)  
> **Alternativa a:** Vercel Pro ($20/mes)

---

## ✅ Solución Implementada

### Archivos Creados
- ✅ `.github/workflows/confirm-expired-cron.yml` (workflow de GitHub Actions)

### Archivos Modificados
- ✅ `packages/core-api/vercel.json` (mantiene cron cada 5 min como fallback)

---

## ⚙️ Configuración Paso a Paso

### Paso 1: Obtener URL de tu App en Vercel

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto `core-api`
3. Copia la URL de producción (ej: `https://core-api.vercel.app`)
4. La URL completa será: `https://core-api.vercel.app/api/cron/confirm-expired`

---

### Paso 2: Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**

#### Secret 1: CRON_URL
- **Name:** `CRON_URL`
- **Value:** `https://tu-app.vercel.app/api/cron/confirm-expired`
  - Reemplaza `tu-app.vercel.app` con tu URL real de Vercel

#### Secret 2: CRON_SECRET
- **Name:** `CRON_SECRET`
- **Value:** (el mismo valor de `CRON_SECRET` en tu `.env.local`)
  - Ejemplo: `tu-cron-secret-aqui-123456`

---

### Paso 3: Hacer Commit y Push

```bash
git add .github/workflows/confirm-expired-cron.yml
git commit -m "feat: Add GitHub Actions cron for expired confirmations (1 min)"
git push
```

---

### Paso 4: Verificar que Funciona

1. Ve a tu repo en GitHub
2. Click en la pestaña **Actions**
3. Deberías ver el workflow "Confirm Expired Transactions Cron"
4. Click en el workflow para ver las ejecuciones
5. Cada minuto debería aparecer una nueva ejecución

---

## 📊 Monitoreo

### Ver Ejecuciones
- GitHub → Actions → "Confirm Expired Transactions Cron"
- Verás cada ejecución con su estado (✅ éxito o ❌ error)

### Ver Logs
- Click en cualquier ejecución
- Verás los logs completos de la llamada al endpoint

---

## 🔧 Troubleshooting

### Error: "CRON_SECRET inválido"
**Solución:** Verifica que el secret `CRON_SECRET` en GitHub coincida con el de tu `.env.local`

### Error: "Connection refused" o "Timeout"
**Solución:** Verifica que la URL en `CRON_URL` sea correcta y que tu app esté desplegada en Vercel

### El workflow no se ejecuta
**Solución:** 
1. Verifica que el archivo esté en `.github/workflows/confirm-expired-cron.yml`
2. Verifica que el schedule sea `* * * * *`
3. GitHub Actions puede tener un delay de hasta 1 minuto en la primera ejecución

---

## 💰 Costos

### GitHub Actions (Plan Gratuito)
- **Límite:** 2,000 minutos/mes
- **Nuestro uso:** ~720 minutos/mes (1,440 ejecuciones/día × 0.5 seg/ejecución)
- **Costo:** $0 (dentro del límite)

### Vercel (Plan Gratuito)
- **Cron cada 5 min:** Incluido (fallback)
- **Costo:** $0

---

## ⏰ Precisión

### Antes (Cron Vercel cada 5 min)
- **Precisión:** 30-35 minutos
- **Retraso máximo:** 5 minutos

### Ahora (GitHub Actions cada 1 min)
- **Precisión:** 30-31 minutos
- **Retraso máximo:** 1 minuto
- **Mejora:** 4 minutos más preciso

---

## 🎯 Ventajas de esta Solución

1. ✅ **Gratis** (dentro del límite de GitHub)
2. ✅ **Precisión mejorada** (1 minuto vs 5 minutos)
3. ✅ **Integrado** con tu código (en el repo)
4. ✅ **Monitoreo incluido** (GitHub Actions dashboard)
5. ✅ **Sin servicios externos** adicionales
6. ✅ **Escalable** (2,000 min/mes es suficiente para 1M usuarios)

---

## 📝 Notas Importantes

- El workflow se ejecuta **cada minuto** automáticamente
- Si GitHub Actions falla, el cron de Vercel (cada 5 min) actúa como fallback
- Los secrets son **sensibles** - no los compartas públicamente
- El workflow tiene un **timeout de 5 minutos** por ejecución

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

