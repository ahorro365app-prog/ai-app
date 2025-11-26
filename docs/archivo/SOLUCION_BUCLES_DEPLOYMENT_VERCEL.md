# ⚠️ Solución: Bucles de Deployment en Vercel

## 🚨 Problema

Vercel está haciendo deployments cada pocos segundos, creando un bucle infinito.

## 🔍 Posibles Causas

### 1. **Sentry faltando variables de entorno** (MÁS COMÚN)

Si `SENTRY_ORG` o `SENTRY_PROJECT` no están configurados en Vercel, el build puede fallar y reintentar constantemente.

**Verificar en Vercel Dashboard:**
1. Ve a tu proyecto → Settings → Environment Variables
2. Busca: `SENTRY_ORG` y `SENTRY_PROJECT`
3. Si no existen, agrégalas O deshabilita Sentry temporalmente

**Solución temporal (deshabilitar Sentry):**

Edita `next.config.js` y comenta la configuración de Sentry:

```javascript
// Temporal: Comentar Sentry para evitar errores de build
// module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);

module.exports = nextConfig; // Sin Sentry temporalmente
```

### 2. **Builds que fallan**

Si los builds están fallando, Vercel los reintenta automáticamente.

**Verificar en Vercel:**
1. Ve a Deployments
2. Busca deployments con estado: ❌ Error o ⚠️ Warning
3. Clic en el deployment → Tab "Build Logs"
4. Busca errores en los logs

### 3. **Webhooks de GitHub**

Si hay webhooks configurados que están disparando deployments constantemente.

**Verificar en GitHub:**
1. Ve a tu repo → Settings → Webhooks
2. Busca webhooks relacionados con Vercel
3. Verifica si están disparando eventos constantemente

**Pausar temporalmente:**
- En GitHub: Edita el webhook → Desactiva temporalmente
- En Vercel: Settings → Git → Desconecta el repo temporalmente

### 4. **Archivos que se regeneran**

Algún proceso podría estar modificando archivos y causando nuevos commits.

**Verificar:**
- No hay procesos que modifiquen archivos automáticamente
- No hay scripts que generen archivos en cada build

## ✅ Solución Inmediata

### Paso 1: Pausar Deployments Automáticos

**Opción A: En Vercel Dashboard**
1. Ve a tu proyecto → Settings
2. Scroll hasta "Build & Development Settings"
3. Busca "Auto-deploy from Git"
4. **Desactiva temporalmente** "Automatically deploy"

**Opción B: En Vercel CLI**
```bash
vercel env ls
# Verifica variables de entorno

vercel --version
# Si no tienes CLI instalado, usa la Opción A
```

### Paso 2: Verificar Variables de Sentry

1. Ve a Vercel Dashboard → Tu proyecto → Settings → Environment Variables

2. Verifica que existan:
   - `SENTRY_ORG` (opcional si no usas Sentry)
   - `SENTRY_PROJECT` (opcional si no usas Sentry)
   - `SENTRY_DSN` (opcional si no usas Sentry)

3. **Si no las tienes y no usas Sentry:**
   - Deshabilita Sentry en `next.config.js` (ver arriba)

### Paso 3: Revisar Logs de Build

1. Ve a Deployments → Selecciona el último deployment
2. Tab "Build Logs" o "Runtime Logs"
3. Busca errores como:
   - `Error: SENTRY_ORG is required`
   - `Error: Build failed`
   - `Error: Command failed`

### Paso 4: Limpiar y Redeploy

Después de corregir el problema:

1. **Pausa deployments automáticos** (si aún no lo hiciste)
2. **Haz un deployment manual:**
   - Deployments → "Deploy" → Selecciona branch `main`
   - O haz redeploy del último deployment exitoso
3. **Verifica que termine exitosamente** (Ready)
4. **Reactiva deployments automáticos** (si los desactivaste)

## 🔧 Solución Permanente

### 1. Configurar Sentry Correctamente

Si usas Sentry, configura las variables:

```bash
# En Vercel Dashboard → Settings → Environment Variables

SENTRY_ORG=tu-org
SENTRY_PROJECT=tu-proyecto
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=tu-token
```

### 2. O Deshabilitar Sentry Completamente

Si no usas Sentry, deshabilítalo en `next.config.js`:

```javascript
// next.config.js
const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  distDir: isProduction ? '.next' : '.next-dev',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ... resto de configuración
}

// SIN Sentry
module.exports = nextConfig

// CON Sentry (solo si tienes las variables configuradas)
// const { withSentryConfig } = require('@sentry/nextjs')
// module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
```

### 3. Agregar Build Timeout

En Vercel Dashboard → Settings → Build & Development Settings:
- Set "Build Timeout" a un valor razonable (ej: 300 segundos)
- Esto previene builds infinitos

## 📋 Checklist de Verificación

- [ ] Variables de Sentry configuradas O Sentry deshabilitado
- [ ] No hay errores en los logs de build
- [ ] Deployments automáticos pausados temporalmente
- [ ] Webhooks de GitHub verificados
- [ ] Build manual exitoso
- [ ] Deployments automáticos reactivados (después del fix)

## 🎯 Resumen

**Causa más probable:** Sentry faltando variables de entorno

**Solución rápida:**
1. Pausa deployments automáticos en Vercel
2. Verifica/configura variables de Sentry O deshabilita Sentry
3. Haz un deployment manual
4. Si funciona, reactiva deployments automáticos

**Si persiste el problema:**
- Revisa logs de build en Vercel
- Verifica webhooks en GitHub
- Contacta soporte de Vercel

