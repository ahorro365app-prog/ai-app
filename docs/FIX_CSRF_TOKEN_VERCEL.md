# Fix: Error de Token CSRF en Vercel

## Problema

El error "Error de conexión: Error al obtener token CSRF" ocurría en producción (Vercel) porque:

1. El endpoint `/api/csrf-token` usa rate limiting con **Upstash Redis**
2. Las variables de entorno `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` no estaban configuradas en Vercel
3. Esto causaba que el rate limiter fallara y el endpoint CSRF no funcionara

## Solución

Se modificó `admin-dashboard/src/lib/rateLimit.ts` para:

1. **Detectar si Redis está configurado**: Verificar si las variables de entorno están presentes
2. **Rate limiting opcional**: Si Redis no está configurado, los rate limiters son `null`
3. **Manejo graceful**: La función `checkRateLimit` ahora acepta `null` y siempre retorna `success: true` cuando no hay rate limiter

### Cambios Realizados

```typescript
// Antes: Siempre creaba Redis (fallaba si no había variables)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Después: Solo crea Redis si hay variables configuradas
const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedisConfig ? new Redis({...}) : null;

// Rate limiters ahora pueden ser null
export const adminApiRateLimit = hasRedisConfig ? new Ratelimit({...}) : null;

// checkRateLimit maneja null
export async function checkRateLimit(
  rateLimiter: Ratelimit | null,  // Ahora acepta null
  identifier: string
) {
  if (!rateLimiter) {
    return { success: true, ... }; // Permitir si no hay rate limiting
  }
  // ... resto del código
}
```

## Configuración Opcional de Upstash Redis

### Para Habilitar Rate Limiting (Recomendado en Producción)

1. Crear cuenta en [Upstash](https://upstash.com/)
2. Crear una base de datos Redis
3. Obtener `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. Agregar estas variables en Vercel:
   - Settings → Environment Variables
   - Agregar `UPSTASH_REDIS_REST_URL`
   - Agregar `UPSTASH_REDIS_REST_TOKEN`
   - Redeploy

### Sin Upstash Redis

Si no se configuran las variables, la aplicación funcionará **sin rate limiting**. Esto es aceptable para:
- Desarrollo local
- Producción pequeña/mediana sin necesidad de rate limiting estricto

**Nota**: Sin rate limiting, la aplicación es más vulnerable a ataques DDoS. Se recomienda configurar Upstash Redis en producción.

## Testing

Después del fix, el endpoint `/api/csrf-token` debería funcionar correctamente incluso sin las variables de Upstash Redis configuradas.

### Verificar en Vercel

1. Ir a la URL de producción
2. Abrir DevTools → Network
3. Verificar que `/api/csrf-token` retorna `200 OK` con `{ success: true, csrfToken: "..." }`

## Archivos Modificados

- `admin-dashboard/src/lib/rateLimit.ts`: Manejo opcional de Redis

## Estado

✅ **Resuelto**: El endpoint CSRF ahora funciona sin requerir Upstash Redis, pero puede habilitarse opcionalmente para mejor seguridad.

