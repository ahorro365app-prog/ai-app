# ✅ Solución: APIs en Capacitor - Configuración Correcta

## 🔍 El Problema Real

**NO es que las APIs estén "ocultas" o "expuestas"** - las APIs siempre estuvieron en el backend. El problema es:

1. **Next.js con `output: 'export'`** NO puede exportar rutas API (requieren servidor Node.js)
2. **Capacitor por defecto** carga la app desde archivos locales (`webDir: 'out'`)
3. **Las llamadas API** (`fetch('/api/...')`) intentan ir a archivos locales que no existen

## ✅ La Solución Correcta

**Capacitor SÍ puede apuntar a un servidor remoto** usando la configuración `server.url` en `capacitor.config.ts`. Esto es **exactamente como funcionaba antes** si tenías un servidor desplegado.

### Configuración en `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.ahorro365.app',
  appName: 'Ahorro365',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // Apuntar a tu servidor remoto
    url: 'https://tu-app.vercel.app' // O tu URL de producción
  },
}
```

## 🎯 Dos Modos de Operación

### Modo 1: Servidor Remoto (PRODUCCIÓN) ⭐ RECOMENDADO

**Configuración:**
```typescript
server: {
  url: 'https://tu-app.vercel.app'
}
```

**Cómo funciona:**
- La app móvil carga la UI desde archivos locales (`out/`)
- **Todas las llamadas API** (`/api/*`) se redirigen automáticamente al servidor remoto
- ✅ **Todas las APIs funcionan perfectamente**
- ✅ **No necesitas `output: 'export'`**
- ✅ **Mismo comportamiento que antes**

### Modo 2: Desarrollo Local (SOLO PARA TESTING)

**Configuración:**
```typescript
server: {
  url: 'http://10.0.2.2:3000' // Android Emulator
  // O
  url: 'http://TU_IP_LOCAL:3000' // Dispositivo físico en la misma red
}
```

**Cómo funciona:**
- La app apunta a tu servidor local en desarrollo
- Útil para probar cambios antes de desplegar

## 📝 Pasos para Configurar

### 1. Desplegar tu App Next.js

**Opción A: Vercel (Recomendado - Gratis)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Seguir las instrucciones
# Te dará una URL como: https://tu-app.vercel.app
```

**Opción B: Railway**
- Sube tu código a Railway
- Configura variables de entorno
- Obtén la URL de producción

### 2. Configurar `capacitor.config.ts`

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.CAPACITOR_SERVER_URL ||
                   'https://tu-app.vercel.app'; // Fallback a producción

const config: CapacitorConfig = {
  appId: 'com.ahorro365.app',
  appName: 'Ahorro365',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    ...(SERVER_URL ? { url: SERVER_URL } : {})
  },
  // ... resto de la configuración
};
```

### 3. Agregar Variable de Entorno (Opcional)

En tu `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://tu-app.vercel.app
# O para desarrollo local:
# NEXT_PUBLIC_API_URL=http://10.0.2.2:3000
```

### 4. Reconstruir y Sincronizar

```bash
npm run build
node scripts/copy-static-for-capacitor.js
npx cap sync android
```

## 🔄 ¿Por Qué Funcionaba Antes?

**Probablemente tenías:**
1. Un servidor desplegado (Vercel, Railway, etc.)
2. `server.url` configurado en `capacitor.config.ts` apuntando a ese servidor
3. O estabas probando en desarrollo con `server.url` apuntando a localhost

**Lo que cambió:**
- Removimos `output: 'export'` (correcto, no es necesario)
- Pero **olvidamos configurar `server.url`** para apuntar al servidor remoto

## ✅ Resumen

1. **Las APIs NO están ocultas** - siempre estuvieron en el backend
2. **Capacitor SÍ puede usar APIs remotas** - con `server.url`
3. **No necesitas `output: 'export'`** - solo archivos estáticos locales
4. **La solución es simple**: Configurar `server.url` en `capacitor.config.ts`

## 🚀 Próximos Pasos

1. **Despliega tu app** en Vercel/Railway (si no lo has hecho)
2. **Configura `server.url`** en `capacitor.config.ts`
3. **Reconstruye y sincroniza**: `npm run build:android`
4. **Prueba la app** - todas las APIs deberían funcionar

¿Necesitas ayuda para desplegar en Vercel o configurar la URL del servidor?



