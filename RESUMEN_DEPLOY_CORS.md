# 🚀 Resumen: Desplegar Fix de CORS a Producción

## ✅ Cambios Listos para Desplegar

### 1. Core API - Middleware CORS
**Archivo**: `packages/core-api/src/middleware.ts` (NUEVO)
- ✅ Agregado manejo completo de CORS
- ✅ Permite `https://localhost` (Capacitor app móvil)
- ✅ Maneja preflight requests (OPTIONS)
- ✅ Headers CORS configurados correctamente

### 2. Core API - Logger Import
**Archivo**: `packages/core-api/src/app/api/notifications/preferences/route.ts`
- ✅ Agregado import de `logger` que faltaba
- ✅ Mejorado manejo de errores de búsqueda

### 3. App Principal - API Config
**Archivo**: `src/lib/apiConfig.ts`
- ✅ Configurado para usar producción (TEMP_LOCAL_API_URL = null)
- ✅ Usa `https://ahorro365-core-api.vercel.app` por defecto

### 4. App Principal - Imports Estáticos
**Archivos**: 
- `src/app/profile/page.tsx`
- `src/hooks/useRegisterFcmToken.ts`
- ✅ Cambiados imports dinámicos a estáticos
- ✅ Usan `getApiBaseUrl()` correctamente

## 📦 APK Compilada

- **Versión**: 0.0.192 (192)
- **Configuración**: Usa producción (Vercel)
- **Ubicación**: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🚀 Pasos para Desplegar

### 1. Hacer Commit y Push

```bash
# Agregar archivos modificados
git add packages/core-api/src/middleware.ts
git add packages/core-api/src/app/api/notifications/preferences/route.ts
git add src/lib/apiConfig.ts
git add src/app/profile/page.tsx
git add src/hooks/useRegisterFcmToken.ts

# Hacer commit
git commit -m "Fix: Agregar headers CORS para app móvil y corregir imports"

# Push a producción
git push origin main
```

### 2. Esperar Deployment de Vercel

- Vercel desplegará automáticamente en 2-3 minutos
- Verificar en: https://vercel.com/dashboard
- Buscar proyecto: `ahorro365-core-api`

### 3. Probar en la App Móvil

1. Instalar APK versión 192
2. Iniciar sesión
3. Aceptar permisos de notificaciones
4. Ir a Ajustes → Notificaciones
5. Intentar desactivar/activar una preferencia
6. **Debería funcionar sin error de CORS** ✅

## ✅ Ventajas de Probar en Producción

1. **No hay Mixed Content**: Todo es HTTPS
2. **CORS configurado**: El middleware ya está listo
3. **Más rápido**: No necesitamos configurar Network Security Config
4. **Más confiable**: Es el entorno real donde funcionará

## 🔍 Verificar que Funciona

### En los Logs de Vercel:
- Ve a: https://vercel.com/dashboard
- Selecciona `ahorro365-core-api`
- Ve a "Functions" → Busca `/api/notifications/preferences`
- Deberías ver las peticiones llegando con status 200

### En la App:
- No debería aparecer error de CORS
- Las preferencias deberían actualizarse correctamente
- El token FCM debería registrarse

## ⚠️ Si Hay Problemas

Si después del despliegue sigue fallando:

1. **Verificar el origin en los logs de Vercel**
   - El origin debería ser `https://localhost`
   - Si es diferente, agregarlo a `allowedOrigins` en el middleware

2. **Verificar headers CORS en la respuesta**
   - En DevTools → Network → Headers
   - Debería aparecer `Access-Control-Allow-Origin: https://localhost`

3. **Revisar logs de Vercel**
   - Buscar errores relacionados con CORS
   - Verificar que el middleware se esté ejecutando

