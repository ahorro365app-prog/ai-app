# 🔧 Solución: Error MIDDLEWARE_INVOCATION_FAILED en App Móvil

## ❌ Problema

La app móvil compilada muestra el error:
```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

## 🔍 Causa

El middleware de Next.js se estaba ejecutando en **todas las rutas**, incluyendo las rutas API (`/api/*`). Aunque el middleware estaba "deshabilitado" (solo retornaba `NextResponse.next()`), Next.js en Vercel estaba intentando ejecutarlo y fallando.

## ✅ Solución Aplicada

### 1. Matcher Restrictivo

El middleware ahora **EXCLUYE completamente** las rutas API:

```typescript
export const config = {
  matcher: [
    // EXCLUIR completamente rutas API y archivos estáticos
    '/((?!api|_next|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
```

**Resultado**: El middleware **NO se ejecutará** en ninguna ruta `/api/*`, previniendo completamente el error.

### 2. Middleware Simplificado

El middleware ahora solo retorna `NextResponse.next()` sin hacer nada, y solo se ejecuta en páginas HTML (que no se usan en la app móvil).

## 🚀 Pasos para Aplicar la Solución

### Paso 1: Verificar Cambios

Los cambios ya están aplicados en `middleware.ts`. Verifica que el archivo tenga el matcher correcto.

### Paso 2: Re-desplegar en Vercel

**IMPORTANTE**: Necesitas re-desplegar la app en Vercel para que los cambios surtan efecto.

```bash
# Opción 1: Push a Git (si tienes CI/CD configurado)
git add middleware.ts
git commit -m "Fix: Excluir rutas API del middleware para prevenir MIDDLEWARE_INVOCATION_FAILED"
git push

# Opción 2: Desplegar manualmente desde Vercel Dashboard
# 1. Ve a https://vercel.com/dashboard
# 2. Selecciona tu proyecto
# 3. Haz clic en "Redeploy"
```

### Paso 3: Re-compilar APK (Opcional)

Después de que Vercel haya desplegado los cambios, puedes re-compilar el APK:

```bash
npm run build:apk
```

**Nota**: El APK actual seguirá teniendo el error hasta que re-despliegues en Vercel, porque el APK apunta a `https://ahorro365-core.vercel.app` que todavía tiene el middleware antiguo.

## 📋 Verificación

Después de re-desplegar, verifica:

1. **En Vercel**: Verifica que el deployment fue exitoso
2. **En la app móvil**: Prueba hacer una llamada API (ej: login)
3. **No debería aparecer**: El error `MIDDLEWARE_INVOCATION_FAILED`

## 🔍 Si el Error Persiste

Si después de re-desplegar el error persiste:

1. **Verifica que el deployment incluyó los cambios**:
   - Ve a Vercel Dashboard → Deployments
   - Verifica que el último deployment incluye el cambio en `middleware.ts`

2. **Verifica el matcher**:
   - El matcher debe excluir `/api/*`
   - Puedes verificar esto en el código desplegado

3. **Alternativa: Eliminar middleware completamente**:
   - Si el problema persiste, puedes eliminar `middleware.ts` completamente
   - Los security headers se aplicarán desde `next.config.js`

## 📝 Notas

- **Autenticación**: La autenticación se maneja en cada endpoint API usando Supabase, no en el middleware
- **Security Headers**: Los security headers se aplican en `next.config.js`, no en el middleware
- **App Móvil**: La app móvil solo usa rutas API, no páginas HTML, por lo que el middleware no debería ejecutarse

## ✅ Estado

- ✅ Middleware corregido localmente
- ⏳ **PENDIENTE**: Re-desplegar en Vercel
- ⏳ **PENDIENTE**: Re-compilar APK después del deployment

