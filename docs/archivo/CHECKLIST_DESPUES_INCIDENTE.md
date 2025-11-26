# ✅ Checklist: Después del Incidente de Vercel

## 🔍 Verificar que Vercel Resolvió

1. **Status Page:**
   - Ve a: https://www.vercel-status.com/
   - Debe decir "Resolved" o "All Systems Operational"

2. **Dashboard de Vercel:**
   - El banner naranja debe desaparecer
   - Otros deployments deberían empezar a funcionar

## 🚀 Verificar Deployment de ahorro365-core-api

1. **Ve a proyecto `ahorro365-core-api`:**
   - Dashboard → `ahorro365-core-api`
   - Pestaña "Deployments"

2. **Verifica estado:**
   - Debe cambiar de "Queued" a "Building"
   - Luego a "Ready" (verde)

3. **Si NO inicia automáticamente:**
   - Clic en los 3 puntos del deployment en cola
   - Selecciona "Redeploy"
   - O haz clic en "Deploy" (botón grande)

## ✅ Verificar que Funciona

1. **Prueba el endpoint:**
   ```bash
   curl https://ahorro365-core-api.vercel.app/api/ping
   ```

2. **Debería retornar:**
   ```json
   {
     "ok": true,
     "service": "core",
     "runtime": "node",
     "timestamp": 1234567890
   }
   ```

## 📝 Próximos Pasos (Después del Deploy)

1. **Actualizar `capacitor.config.ts`:**
   - Cambiar URL a: `https://ahorro365-core-api.vercel.app`
   - O el dominio que Vercel asigne

2. **Re-compilar APK:**
   - `npm run build:android`
   - O usar GitHub Actions

3. **Verificar variables de entorno:**
   - Asegúrate de que todas estén en Vercel
   - Especialmente: `NEXT_PUBLIC_GROQ_API_KEY` (completa)

## 🆘 Si Sigue Sin Funcionar

1. **Espera 10 minutos más** (a veces hay delays)

2. **Redeploy manual:**
   - Cancelar deployment en cola
   - Deploy nuevo

3. **Alternativa Railway:**
   - Si Vercel sigue con problemas
   - Usar Railway como backup

---

## 📞 Contacto

Si necesitas ayuda cuando regreses, solo avísame y continuamos.

¡Buen provecho! 🍽️

