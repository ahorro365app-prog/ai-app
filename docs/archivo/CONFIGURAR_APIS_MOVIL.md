# 📱 Configurar APIs para App Móvil (Capacitor)

## ✅ Tu App Ya Está Desplegada

Veo que tienes tu app desplegada en Vercel:
- **Core App**: `https://ahorro365-core.vercel.app`
- **Admin Dashboard**: `https://admin-dashboard-eta-liard-77.vercel.app`

## 🔧 Configuración Automática

Ya he configurado `capacitor.config.ts` para usar automáticamente:
```
https://ahorro365-core.vercel.app
```

**Esto significa que:**
- ✅ Todas las llamadas API (`/api/*`) se redirigirán automáticamente a tu servidor Vercel
- ✅ **NO necesitas configurar nada más** - ya está listo
- ✅ Las APIs funcionarán perfectamente en la app móvil

## 🚀 Próximos Pasos

### 1. Reconstruir la App Móvil

```bash
npm run build:android
```

Este comando:
1. Construye la app Next.js
2. Copia archivos estáticos a `out/`
3. Sincroniza con Capacitor (que ahora tiene la URL del servidor configurada)

### 2. Abrir en Android Studio

1. Abre Android Studio
2. Abre la carpeta `android/`
3. **Build → Clean Project**
4. **Build → Rebuild Project**
5. Compila y prueba

### 3. Verificar que Funciona

Cuando ejecutes la app en Android:
- Las llamadas a `/api/ai` irán a `https://ahorro365-core.vercel.app/api/ai`
- Las llamadas a `/api/payments/create` irán a `https://ahorro365-core.vercel.app/api/payments/create`
- **Todas las APIs funcionarán** ✅

## 🔄 Cambiar la URL (Opcional)

Si quieres usar una URL diferente (por ejemplo, para desarrollo):

### Opción 1: Variable de Entorno

Agrega a tu `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://tu-otra-url.com
```

### Opción 2: Desarrollo Local

Para probar con tu servidor local (solo funciona en emulador o dispositivo en la misma red):

```env
# Android Emulator
NEXT_PUBLIC_API_URL=http://10.0.2.2:3000

# Dispositivo físico (reemplaza con tu IP local)
NEXT_PUBLIC_API_URL=http://192.168.1.100:3000
```

Luego reconstruye:
```bash
npm run build:android
```

## 📝 Cómo Funciona

1. **Capacitor carga la UI** desde archivos locales (`out/`)
2. **Cuando la app hace `fetch('/api/...')`**, Capacitor intercepta la llamada
3. **Redirige automáticamente** a `https://ahorro365-core.vercel.app/api/...`
4. **El servidor Vercel procesa** la petición y devuelve la respuesta
5. **La app móvil recibe** la respuesta como si fuera local

## ✅ Resumen

- ✅ **Ya está configurado** - usa `https://ahorro365-core.vercel.app`
- ✅ **No necesitas hacer nada más** - solo reconstruir
- ✅ **Todas las APIs funcionarán** en la app móvil
- ✅ **Mismo comportamiento que antes** - las APIs siempre estuvieron en el servidor

¿Quieres que te ayude a reconstruir la app ahora?



