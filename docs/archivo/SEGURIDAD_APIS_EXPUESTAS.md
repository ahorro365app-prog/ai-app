# 🔒 Seguridad de APIs Expuestas - Guía Completa

## ⚠️ IMPORTANTE: Las APIs Están Expuestas Públicamente

**Realidad**: Cuando despliegas en Vercel, **todas tus APIs son accesibles públicamente** en:
```
https://ahorro365-core.vercel.app/api/*
```

**Esto es NORMAL y CORRECTO** - así funcionan las APIs web modernas. La seguridad **NO viene de ocultar las APIs**, sino de **protegerlas correctamente**.

## ✅ Medidas de Seguridad que YA Tienes Implementadas

### 1. **Rate Limiting** (Protección contra DDoS y Fuerza Bruta)
- ✅ Implementado con Upstash Redis
- ✅ Límites por IP/usuario
- ✅ Protege contra ataques de fuerza bruta

**Ubicación**: `src/lib/rateLimit.ts`

### 2. **Validación de Inputs con Zod**
- ✅ Validación de todos los datos de entrada
- ✅ Previene SQL injection, XSS, inyección de datos
- ✅ Rechaza datos malformados

**Ejemplo**:
```typescript
const validation = sendCodeSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
}
```

### 3. **CSRF Protection**
- ✅ Tokens CSRF en formularios
- ✅ Validación en backend
- ✅ Previene ataques cross-site request forgery

**Estado**: ✅ COMPLETADO

### 4. **Security Headers**
- ✅ Content-Security-Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Previene XSS, clickjacking, MIME sniffing

**Estado**: ✅ COMPLETADO

### 5. **Autenticación con Clerk** (En algunas rutas)
- ✅ Middleware de autenticación
- ✅ Protege rutas privadas
- ✅ Verificación de sesión

**Ubicación**: `src/middleware.ts`

### 6. **Secret Tokens** (Para endpoints críticos)
- ✅ `NOTIFICATIONS_CRON_SECRET` para cron jobs
- ✅ Validación de Bearer tokens
- ✅ Protege endpoints administrativos

**Ejemplo**:
```typescript
const secret = process.env.NOTIFICATIONS_CRON_SECRET;
if (secret) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}
```

## ⚠️ Endpoints que Necesitan Más Protección

### Endpoints Públicos (Sin Autenticación)
Estos endpoints son accesibles sin autenticación:

1. **`/api/ai`** - Procesamiento de IA
2. **`/api/process-expense`** - Procesamiento de gastos
3. **`/api/audio/process`** - Procesamiento de audio
4. **`/api/whatsapp/send-verification-code`** - Envío de códigos
5. **`/api/whatsapp/verify-code`** - Verificación de códigos
6. **`/api/csrf-token`** - Obtención de tokens CSRF

**Riesgo**: Cualquiera puede hacer requests a estos endpoints.

**Solución Recomendada**:
- Agregar autenticación (verificar sesión de usuario)
- Agregar rate limiting más estricto
- Validar que el usuario esté autenticado antes de procesar

## 🛡️ Cómo Proteger Mejor tus APIs

### Opción 1: Autenticación en Todos los Endpoints (RECOMENDADO)

**Agregar verificación de sesión en cada endpoint**:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  // Continuar con el procesamiento...
}
```

### Opción 2: API Keys para Endpoints Públicos

**Para endpoints que deben ser públicos** (como webhooks):

```typescript
const API_KEY = process.env.API_KEY;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json(
      { error: 'API key inválida' },
      { status: 401 }
    );
  }

  // Continuar...
}
```

### Opción 3: Rate Limiting Más Estricto

**Limitar requests por usuario/IP**:

```typescript
import { checkRateLimit } from '@/lib/rateLimit';

const strictLimit = {
  limit: 10, // Solo 10 requests
  window: 60000, // Por minuto
};

const result = await checkRateLimit(strictLimit, userId);
if (!result.success) {
  return NextResponse.json(
    { error: 'Demasiadas peticiones' },
    { status: 429 }
  );
}
```

## 📊 Estado Actual de Seguridad

| Medida | Estado | Cobertura |
|--------|--------|-----------|
| Rate Limiting | ✅ Implementado | Parcial (algunos endpoints) |
| Validación Zod | ✅ Implementado | Parcial (algunos endpoints) |
| CSRF Protection | ✅ Completo | Todos los formularios |
| Security Headers | ✅ Completo | Todas las rutas |
| Autenticación | ⚠️ Parcial | Solo algunas rutas |
| Secret Tokens | ⚠️ Parcial | Solo endpoints críticos |
| Error Handling | ⚠️ Parcial | Algunos endpoints |

## 🎯 Recomendaciones Inmediatas

### Prioridad ALTA

1. **Agregar autenticación a endpoints críticos**:
   - `/api/ai`
   - `/api/process-expense`
   - `/api/audio/process`
   - `/api/payments/create`

2. **Rate limiting más estricto**:
   - Límites más bajos para endpoints costosos (IA, audio)
   - Diferentes límites por tipo de usuario

3. **Validación de permisos**:
   - Verificar que el usuario tenga permisos para la acción
   - Verificar ownership de recursos

### Prioridad MEDIA

4. **Logging de seguridad**:
   - Registrar intentos de acceso no autorizado
   - Alertas para patrones sospechosos

5. **Monitoreo**:
   - Usar Sentry para detectar ataques
   - Alertas para rate limit exceeded

## ✅ Conclusión

**Las APIs están expuestas, pero están protegidas con**:
- ✅ Rate limiting
- ✅ Validación de inputs
- ✅ CSRF protection
- ✅ Security headers
- ⚠️ Autenticación (parcial - necesita mejorarse)

**Para mejorar la seguridad**:
1. Agregar autenticación a todos los endpoints críticos
2. Implementar rate limiting más estricto
3. Agregar validación de permisos
4. Monitorear y alertar sobre actividad sospechosa

**¿Quieres que implemente autenticación en los endpoints críticos ahora?**

