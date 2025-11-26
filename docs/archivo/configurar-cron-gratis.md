# 🆓 Configurar Cron Automático (GRATIS con GitHub Actions)

## ✅ Lo que ya tienes

- ✅ Workflow de GitHub Actions configurado (`.github/workflows/notifications-cron.yml`)
- ✅ Endpoint listo (`/api/notifications/campaigns/run`)
- ✅ Ejecución cada 15 minutos automáticamente

## 📋 Pasos para activar (5 minutos)

### 1. Obtener la URL de producción

Si tu app está desplegada en Vercel, Netlify, o similar, necesitas la URL completa del endpoint:

```
https://tu-dominio.com/api/notifications/campaigns/run
```

**Ejemplo:**
- Si tu app está en `https://ahorro365.vercel.app`
- La URL sería: `https://ahorro365.vercel.app/api/notifications/campaigns/run`

### 2. Generar un secreto de autenticación

Ejecuta este comando en PowerShell o Terminal para generar un secreto aleatorio:

```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

O usa este sitio: https://www.random.org/strings/ (32 caracteres, alfanumérico)

**Guarda este secreto** - lo necesitarás en el siguiente paso.

### 3. Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret** (Nuevo secreto del repositorio)

**Secret 1: `NOTIFICATIONS_CRON_URL`**
- Name: `NOTIFICATIONS_CRON_URL`
- Value: `https://tu-dominio.com/api/notifications/campaigns/run` (la URL del paso 1)

**Secret 2: `NOTIFICATIONS_CRON_SECRET`**
- Name: `NOTIFICATIONS_CRON_SECRET`
- Value: `el-secreto-que-generaste-en-el-paso-2`

### 4. Configurar el secreto en tu app de producción

Agrega la misma variable de entorno en tu plataforma de hosting (Vercel, Netlify, etc.):

**Variable de entorno:**
- Name: `NOTIFICATIONS_CRON_SECRET`
- Value: `el-mismo-secreto-del-paso-2`

### 5. Probar manualmente

1. Ve a tu repositorio en GitHub
2. Click en **Actions** (Acciones)
3. En el menú lateral, busca **"Notifications Cron"**
4. Click en **"Run workflow"** → **"Run workflow"** (botón verde)
5. Verifica que se ejecute correctamente

## ✅ Verificar que funciona

Después de configurar, el workflow se ejecutará automáticamente cada 15 minutos.

Para verificar:
1. Ve a **Actions** en GitHub
2. Verás ejecuciones cada 15 minutos con el ícono de reloj ⏰
3. Click en cualquier ejecución para ver los logs

## 🔍 Monitoreo

- **Logs en GitHub:** Ve a Actions → Notifications Cron → Click en cualquier ejecución
- **Logs en tu app:** Revisa los logs de tu plataforma de hosting
- **En Supabase:** Verifica la tabla `notification_trigger_logs` para ver ejecuciones

## ⚠️ Notas importantes

1. **GitHub Actions es GRATIS** para repositorios públicos
2. **Para repositorios privados:** GitHub da 2,000 minutos/mes gratis (más que suficiente para ejecutar cada 15 minutos)
3. **No necesitas Supabase pagado** - esto funciona completamente gratis
4. **El cron se ejecuta automáticamente** - no necesitas hacer nada más después de configurar

## 🆘 Troubleshooting

### El workflow no se ejecuta
- Verifica que los secrets estén configurados correctamente
- Asegúrate de que el workflow esté en la rama `main` o `master`
- Revisa que el cron esté habilitado en Settings → Actions → General

### Error 401 (No autorizado)
- Verifica que `NOTIFICATIONS_CRON_SECRET` sea el mismo en GitHub y en tu app de producción

### Error 404 (No encontrado)
- Verifica que la URL en `NOTIFICATIONS_CRON_URL` sea correcta
- Asegúrate de que la app esté desplegada y funcionando

## 🎉 ¡Listo!

Una vez configurado, el sistema ejecutará automáticamente:
- ✅ Triggers de renovación de suscripción
- ✅ Triggers de referidos invitados
- ✅ Triggers de referidos verificados
- ✅ Campañas programadas

**Todo esto sin costo adicional y sin necesidad de Supabase pagado.**

