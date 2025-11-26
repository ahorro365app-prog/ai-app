# 🚀 Instrucciones: Desplegar Fix de CORS

## ✅ Estado Actual

- ✅ **APK compilada**: Versión 192 (usa producción)
- ✅ **CORS configurado**: Middleware listo
- ✅ **Código actualizado**: Imports estáticos corregidos

## 📝 Pasos para Desplegar

### Paso 1: Agregar Archivos a Git

Ejecuta estos comandos en PowerShell:

```powershell
# Ir al directorio raíz
cd C:\Users\Usuario\ai-app

# Agregar archivos modificados
git add packages/core-api/src/middleware.ts
git add packages/core-api/src/app/api/notifications/preferences/route.ts
git add src/lib/apiConfig.ts
git add src/app/profile/page.tsx
git add src/hooks/useRegisterFcmToken.ts
```

### Paso 2: Hacer Commit

```powershell
git commit -m "Fix: Agregar headers CORS para app móvil y corregir imports estáticos"
```

### Paso 3: Push a Producción

```powershell
git push origin main
```

### Paso 4: Esperar Deployment

- Vercel desplegará automáticamente en **2-3 minutos**
- Verifica en: https://vercel.com/dashboard
- Busca proyecto: `ahorro365-core-api`

## 🧪 Probar Después del Deployment

1. **Instalar APK versión 192** (ya compilada)
2. **Iniciar sesión** en la app
3. **Aceptar permisos** de notificaciones
4. **Ir a Ajustes → Notificaciones**
5. **Intentar desactivar/activar** una preferencia
6. **Debería funcionar sin error de CORS** ✅

## 🔍 Verificar en Vercel

Después del deployment, verifica:
- Ve a: https://vercel.com/dashboard
- Selecciona `ahorro365-core-api`
- Ve a "Functions" → Busca `/api/notifications/preferences`
- Deberías ver las peticiones llegando

## ⚠️ Si Hay Problemas

Si después del despliegue sigue fallando:
1. Verifica el origin en los logs de Vercel
2. Verifica headers CORS en DevTools → Network
3. Revisa logs de Vercel para errores

