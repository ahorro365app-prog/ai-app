# 🚀 Desplegar Fix de CORS a Producción

## Cambios a Desplegar

### 1. Core API - Middleware CORS (`packages/core-api/src/middleware.ts`)
- ✅ Agregado manejo de CORS para `https://localhost` (Capacitor)
- ✅ Manejo de preflight requests (OPTIONS)
- ✅ Headers CORS configurados

### 2. Core API - Logger Import (`packages/core-api/src/app/api/notifications/preferences/route.ts`)
- ✅ Agregado import de `logger` que faltaba

## Pasos para Desplegar

### Opción 1: Si tienes auto-deploy en Vercel (Recomendado)

1. **Hacer commit de los cambios:**
   ```bash
   cd packages/core-api
   git add src/middleware.ts src/app/api/notifications/preferences/route.ts
   git commit -m "Fix: Agregar headers CORS para app móvil y corregir logger import"
   git push
   ```

2. **Vercel desplegará automáticamente** en 2-3 minutos

3. **Verificar el deployment:**
   - Ve a: https://vercel.com/dashboard
   - Busca el proyecto `ahorro365-core-api`
   - Verifica que el último deployment sea exitoso

### Opción 2: Despliegue Manual

1. **Instalar Vercel CLI** (si no lo tienes):
   ```bash
   npm i -g vercel
   ```

2. **Desplegar:**
   ```bash
   cd packages/core-api
   vercel --prod
   ```

## Verificar que Funciona

Después del despliegue:

1. **Probar desde la app móvil:**
   - Instala la APK (versión 190 o superior)
   - Ve a Ajustes → Notificaciones
   - Intenta desactivar/activar una preferencia
   - **Debería funcionar sin error de CORS** ✅

2. **Verificar en los logs de Vercel:**
   - Ve a: https://vercel.com/dashboard
   - Selecciona el proyecto `ahorro365-core-api`
   - Ve a "Functions" → Busca `/api/notifications/preferences`
   - Deberías ver las peticiones llegando

## Si Hay Problemas

Si después del despliegue sigue fallando:

1. **Verificar que el middleware esté activo:**
   - Los headers CORS deberían aparecer en las respuestas
   - Verificar en Network tab de DevTools

2. **Verificar el origin:**
   - El origin debería ser `https://localhost` (Capacitor)
   - Si es diferente, agregarlo a `allowedOrigins` en el middleware

3. **Revisar logs de Vercel:**
   - Buscar errores relacionados con CORS
   - Verificar que el middleware se esté ejecutando

