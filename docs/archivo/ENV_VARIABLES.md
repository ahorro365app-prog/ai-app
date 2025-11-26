# 📋 VARIABLES DE ENTORNO REQUERIDAS

**Última actualización**: 2025  
**Aplicación**: Ahorro365

---

## 🔐 VARIABLES CRÍTICAS (Requeridas)

### Supabase

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Descripción**: URL del proyecto de Supabase
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `https://xxxxx.supabase.co`
- **Dónde obtener**: Supabase Dashboard → Settings → API → Project URL
- **Requerida**: ✅ SÍ

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Descripción**: Clave anónima (pública) de Supabase
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Dónde obtener**: Supabase Dashboard → Settings → API → anon public key
- **Requerida**: ✅ SÍ

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Descripción**: Clave de servicio (SECRETO) de Supabase - ⚠️ NO exponer
- **Tipo**: SECRETO (solo servidor)
- **Ejemplo**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Dónde obtener**: Supabase Dashboard → Settings → API → service_role key
- **Requerida**: ✅ SÍ
- **⚠️ IMPORTANTE**: Esta clave tiene permisos admin completos. NUNCA la expongas en el cliente.

---

## 🔧 VARIABLES OPCIONALES (Recomendadas)

### Monitoreo de Errores (Sentry)

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Descripción**: DSN (Data Source Name) de Sentry para capturar errores
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- **Dónde obtener**: Sentry Dashboard → Settings → Projects → [tu-proyecto] → Client Keys (DSN)
- **Requerida**: ❌ NO (pero recomendada para monitoreo de errores)
- **Nota**: Si no está configurada, Sentry no capturará errores. Ver `GUIA_CONFIGURACION_SENTRY.md`

#### `SENTRY_ORG`
- **Descripción**: Nombre de la organización de Sentry (para source maps)
- **Tipo**: Pública
- **Ejemplo**: `mi-organizacion`
- **Dónde obtener**: Sentry Dashboard → Settings → Organization Settings → Organization Slug
- **Requerida**: ❌ NO (solo necesaria para source maps automáticos)

#### `SENTRY_PROJECT`
- **Descripción**: Nombre del proyecto de Sentry (para source maps)
- **Tipo**: Pública
- **Ejemplo**: `ahorro365-app`
- **Dónde obtener**: Sentry Dashboard → Settings → Projects → [tu-proyecto] → Project Slug
- **Requerida**: ❌ NO (solo necesaria para source maps automáticos)

#### `SENTRY_AUTH_TOKEN`
- **Descripción**: Token de autenticación de Sentry (para source maps)
- **Tipo**: SECRETO (solo servidor)
- **Ejemplo**: `sntrys_xxxxx...`
- **Dónde obtener**: Sentry Dashboard → Settings → Account → Auth Tokens → Create New Token
- **Requerida**: ❌ NO (solo necesaria para source maps automáticos)
- **Permisos requeridos**: `project:releases` y `org:read`

#### `NEXT_PUBLIC_SENTRY_DEBUG`
- **Descripción**: Habilitar Sentry en desarrollo (para testing)
- **Tipo**: Pública
- **Ejemplo**: `true` o `false`
- **Default**: `false` (Sentry no envía errores en desarrollo por defecto)
- **Requerida**: ❌ NO

### Rate Limiting (Upstash Redis)

#### `UPSTASH_REDIS_REST_URL`
- **Descripción**: URL de la API REST de Upstash Redis
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `https://xxxxx.upstash.io`
- **Dónde obtener**: Upstash Dashboard → Redis Database → REST API → URL
- **Requerida**: ❌ NO (pero recomendada para rate limiting)
- **Nota**: Si no está configurada, el rate limiting no funcionará

#### `UPSTASH_REDIS_REST_TOKEN`
- **Descripción**: Token de autenticación de Upstash Redis
- **Tipo**: SECRETO (solo servidor)
- **Ejemplo**: `AXxxxxx...`
- **Dónde obtener**: Upstash Dashboard → Redis Database → REST API → Token
- **Requerida**: ❌ NO (pero recomendada para rate limiting)

### Procesamiento de IA (Groq)

#### `NEXT_PUBLIC_GROQ_API_KEY`
- **Descripción**: API Key de Groq para procesamiento de IA
- **Tipo**: SECRETO (solo servidor)
- **Ejemplo**: `gsk_xxxxx...`
- **Dónde obtener**: Groq Console → API Keys
- **Requerida**: ❌ NO (pero necesaria para procesamiento de transacciones con IA)
- **Nota**: Si no está configurada, el procesamiento de IA no funcionará

### WhatsApp Integration

#### `NEXT_PUBLIC_WHATSAPP_SUPPORT`
- **Descripción**: Número de WhatsApp para soporte al cliente
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `+59161600190`
- **Default**: `+59161600190`
- **Requerida**: ❌ NO (usa el número por defecto si no está configurada)
- **Nota**: Este número se usa en todos los botones de contacto por WhatsApp en la aplicación

#### `META_WHATSAPP_TOKEN`
- **Descripción**: Token de verificación de WhatsApp Meta
- **Tipo**: SECRETO (solo servidor)
- **Requerida**: ❌ NO (solo si usas integración de WhatsApp)

#### `WEBHOOK_VERIFY_TOKEN`
- **Descripción**: Token de verificación para webhooks
- **Tipo**: SECRETO (solo servidor)
- **Requerida**: ❌ NO (solo si usas webhooks)

#### `NEXT_PUBLIC_API_URL`
- **Descripción**: URL del servidor remoto para APIs (usado por Capacitor en app móvil)
- **Tipo**: Pública (puede estar en el cliente)
- **Ejemplo**: `https://ahorro365-core.vercel.app`
- **Default**: `https://ahorro365-core.vercel.app` (configurado en `capacitor.config.ts`)
- **Requerida**: ❌ NO (usa la URL por defecto si no está configurada)
- **Nota**: Esta URL se usa cuando la app se ejecuta en Capacitor (Android/iOS) para redirigir todas las llamadas API al servidor remoto

#### `CAPACITOR_SERVER_URL`
- **Descripción**: URL alternativa del servidor para Capacitor (sobrescribe `NEXT_PUBLIC_API_URL`)
- **Tipo**: Pública
- **Ejemplo**: `https://ahorro365-core.vercel.app`
- **Requerida**: ❌ NO
- **Nota**: Útil para tener diferentes URLs en desarrollo vs producción

---

## 📝 CONFIGURACIÓN

### Desarrollo Local

1. Copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y agrega tus valores:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Reinicia el servidor:
   ```bash
   npm run dev
   ```

### Producción (Vercel)

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega todas las variables requeridas
4. Asegúrate de que estén configuradas para:
   - Production
   - Preview (opcional)
   - Development (opcional)

---

## ✅ VALIDACIÓN

Para validar que todas las variables están configuradas:

```bash
npm run validate-env
```

O ejecuta manualmente:

```bash
npx tsx scripts/validate-env.ts
```

---

## 🔒 SEGURIDAD

### Variables SECRETAS (NUNCA exponer)
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_GROQ_API_KEY`
- `META_WHATSAPP_TOKEN`
- `WEBHOOK_VERIFY_TOKEN`

### Variables PÚBLICAS (pueden estar en el cliente)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `UPSTASH_REDIS_REST_URL`

### Reglas de Seguridad
1. ✅ NUNCA commitees archivos `.env.local` al repositorio
2. ✅ NUNCA expongas variables SECRETAS en el cliente
3. ✅ Usa variables `NEXT_PUBLIC_*` solo para valores públicos
4. ✅ Verifica que `.gitignore` incluya `.env*`
5. ✅ Rota las claves si sospechas que fueron comprometidas

---

## 📚 RECURSOS

- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Upstash Redis Setup](https://docs.upstash.com/redis)

---

**Nota**: Si alguna variable requerida no está configurada, la aplicación lanzará un error claro con instrucciones de cómo configurarla.

