# 🔒 PLAN DE SEGURIDAD COMPLETO PARA LANZAMIENTO

## 📊 ANÁLISIS DE RIESGOS

### Riesgos CRÍTICOS (Alta Prioridad)
1. **Autenticación débil**: Headers `x-user-id` pueden ser falsificados
2. **RLS permisivo**: Políticas "permitir todo" exponen datos
3. **Sin rate limiting**: Vulnerable a ataques de fuerza bruta
4. **Sin 2FA**: Admin panel vulnerable
5. **Contraseñas en texto plano**: En admin-dashboard
6. **Sin monitoreo**: No hay detección de ataques
7. **Sin validación robusta**: Inputs pueden ser explotados

### Riesgos ALTOS (Media Prioridad)
1. **Sin WAF**: Vulnerable a payloads maliciosos
2. **Sin CSRF protection**: Vulnerable a ataques cross-site
3. **Sin CSP**: Vulnerable a XSS
4. **Logs con datos sensibles**: Información expuesta
5. **Sin auditoría**: No se puede rastrear acciones

### Riesgos MEDIOS (Baja Prioridad)
1. **Sin documentación**: Dificulta mantenimiento
2. **Sin staging**: Cambios directos a producción
3. **Sin backups manuales**: Depende solo de Supabase
4. **Sin términos/privacy**: No cumple compliance básico

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### FASE 1: CRÍTICO (Implementar ANTES del lanzamiento)

#### 1.1 Fortalecer Autenticación
- ✅ Implementar JWT tokens firmados
- ✅ Eliminar confianza en headers `x-user-id` sin validación
- ✅ Implementar refresh tokens
- ✅ Session timeout configurado

#### 1.2 Implementar RLS Correctamente
- ✅ Políticas restrictivas por usuario
- ✅ Cada usuario solo ve sus datos
- ✅ Admin con políticas especiales
- ✅ Validar todas las tablas

#### 1.3 Rate Limiting
- ✅ Global: 100 req/min por IP
- ✅ Login: 5 intentos, bloqueo 15 min
- ✅ Webhooks: 10 req/min
- ✅ API general: 60 req/min

#### 1.4 Validación de Inputs
- ✅ Zod schemas para todos los endpoints
- ✅ Sanitización de strings
- ✅ Validación de tipos
- ✅ Longitud máxima

#### 1.5 Protección de Errores
- ✅ No exponer detalles internos
- ✅ Mensajes genéricos en producción
- ✅ Logging seguro (sin datos sensibles)

### FASE 2: ALTO (Implementar en primera semana)

#### 2.1 2FA/MFA
- ✅ TOTP para admin panel
- ✅ Backup codes
- ✅ Opcional para usuarios (recomendado)

#### 2.2 WAF
- ✅ Cloudflare (recomendado)
- ✅ Reglas básicas anti-XSS, SQL injection
- ✅ Logging de bloqueos

#### 2.3 Monitoreo y Alertas
- ✅ Sentry para errores
- ✅ Alertas por email/Slack
- ✅ Dashboard de métricas

#### 2.4 CSRF Protection
- ✅ CSRF tokens en forms
- ✅ SameSite cookies strict
- ✅ Validación de referer

#### 2.5 CSP Headers
- ✅ Content Security Policy estricto
- ✅ No inline scripts
- ✅ Whitelist de dominios

### FASE 3: MEDIO (Implementar en primer mes)

#### 3.1 Auditoría
- ✅ Log de todas las acciones admin
- ✅ Log de accesos sospechosos
- ✅ Historial de cambios

#### 3.2 Documentación
- ✅ Términos de servicio
- ✅ Política de privacidad
- ✅ Documentación técnica

#### 3.3 Compliance
- ✅ Consentimiento de usuarios
- ✅ GDPR compliance (si aplica)
- ✅ Retención de datos

#### 3.4 Testing
- ✅ Pruebas de seguridad
- ✅ Análisis de vulnerabilidades
- ✅ Auditoría de código

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Autenticación
- [ ] Implementar JWT con firma secreta
- [ ] Eliminar headers `x-user-id` sin validación
- [ ] Refresh tokens con rotación
- [ ] Session timeout (30 min inactividad)
- [ ] Logout en todos los dispositivos

### RLS Policies
- [ ] Política: Usuarios solo ven sus datos
- [ ] Política: Usuarios solo crean sus datos
- [ ] Política: Usuarios solo actualizan sus datos
- [ ] Política: Usuarios solo eliminan sus datos
- [ ] Política: Admin puede ver todo (con validación)
- [ ] Testing: Verificar que un usuario no ve datos de otro

### Rate Limiting
- [ ] Middleware global de rate limiting
- [ ] Endpoint `/api/auth/*`: 5 intentos/15min
- [ ] Endpoint `/api/webhooks/*`: 10 req/min
- [ ] Endpoint `/api/payments/*`: 20 req/min
- [ ] Endpoint `/api/*`: 60 req/min
- [ ] Headers de rate limit en respuestas

### Validación de Inputs
- [ ] Zod schema para `/api/payments/create`
- [ ] Zod schema para `/api/payments/upload-receipt`
- [ ] Zod schema para `/api/webhooks/whatsapp`
- [ ] Zod schema para `/api/webhooks/baileys`
- [ ] Zod schema para `/api/audio/process`
- [ ] Sanitización de strings HTML
- [ ] Validación de tipos de archivo

### Protección de Errores
- [ ] Wrapper de error handling
- [ ] Mensajes genéricos en producción
- [ ] Logging detallado solo en desarrollo
- [ ] No exponer stack traces

### 2FA/MFA
- [ ] TOTP para admin
- [ ] QR code generation
- [ ] Backup codes (10 códigos)
- [ ] Validación en cada login admin

### WAF
- [ ] Configurar Cloudflare
- [ ] Reglas anti-XSS
- [ ] Reglas anti-SQL injection
- [ ] Reglas anti-path traversal
- [ ] Logging de bloqueos

### Monitoreo
- [ ] Configurar Sentry
- [ ] Alertas por email
- [ ] Dashboard de errores
- [ ] Métricas de performance

### CSRF
- [ ] CSRF tokens en forms
- [ ] Validación en backend
- [ ] SameSite cookies
- [ ] Testing de protección

### CSP
- [ ] Configurar CSP headers
- [ ] Whitelist de scripts
- [ ] Whitelist de styles
- [ ] Report-only mode primero

### Auditoría
- [ ] Tabla `audit_logs`
- [ ] Log de acciones admin
- [ ] Log de accesos
- [ ] Dashboard de auditoría

### Documentación
- [ ] Términos de servicio
- [ ] Política de privacidad
- [ ] Documentación técnica
- [ ] Runbook de incidentes

### Compliance
- [ ] Checkbox de consentimiento
- [ ] Guardar consentimiento
- [ ] Política de retención
- [ ] Derecho a olvidar (GDPR)

### Testing
- [ ] Pruebas unitarias de seguridad
- [ ] npm audit
- [ ] Análisis estático
- [ ] Pruebas de penetración básicas

---

## 💻 CÓDIGO DE EJEMPLO

### Rate Limiting Middleware

```typescript
// src/lib/rateLimiter.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  req: NextRequest,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; resetTime: number } {
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { 
    success: true, 
    remaining: maxRequests - record.count, 
    resetTime: record.resetTime 
  };
}

// Uso en API route
export async function POST(req: NextRequest) {
  const limit = rateLimit(req, 5, 15 * 60 * 1000); // 5 requests per 15 min
  
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': new Date(limit.resetTime).toISOString()
        }
      }
    );
  }
  
  // ... resto del código
}
```

### Zod Validation Schema

```typescript
// src/lib/validations/paymentSchemas.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  plan: z.enum(['pro']),
  monto_usdt: z.number().positive().max(10000),
  direccion_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  hash_transaccion: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional().nullable(),
  comprobante_url: z.string().url().optional().nullable(),
  notas: z.string().max(500).optional().nullable()
});

// Uso en endpoint
export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const validation = createPaymentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.error.errors },
      { status: 400 }
    );
  }
  
  // Usar validation.data (ya validado)
}
```

### RLS Policy Example

```sql
-- Política restrictiva para transacciones
CREATE POLICY "Users can only view their own transactions"
ON transacciones
FOR SELECT
USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can only create their own transactions"
ON transacciones
FOR INSERT
WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can only update their own transactions"
ON transacciones
FOR UPDATE
USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can only delete their own transactions"
ON transacciones
FOR DELETE
USING (auth.uid()::text = usuario_id::text);
```

### Error Handler Wrapper

```typescript
// src/lib/errorHandler.ts
export function handleApiError(error: unknown): NextResponse {
  if (process.env.NODE_ENV === 'production') {
    // No exponer detalles en producción
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  
  // En desarrollo, mostrar detalles
  return NextResponse.json(
    { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    },
    { status: 500 }
  );
}

// Uso
export async function POST(req: NextRequest) {
  try {
    // ... código
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## ⏱️ TIMELINE REALISTA

### Semana 1: Crítico
- Día 1-2: Rate limiting + Validación inputs
- Día 3-4: RLS policies correctas
- Día 5: Error handling mejorado
- Día 6-7: Testing y ajustes

### Semana 2: Alto
- Día 1-2: 2FA para admin
- Día 3: WAF (Cloudflare)
- Día 4-5: Monitoreo (Sentry)
- Día 6-7: CSRF + CSP

### Semana 3: Medio
- Día 1-2: Auditoría
- Día 3-4: Documentación legal
- Día 5: Compliance básico
- Día 6-7: Testing final

### Semana 4: Buffer
- Testing de seguridad
- Ajustes finales
- Preparación para lanzamiento

---

## 🛠️ HERRAMIENTAS RECOMENDADAS

### Gratuitas
- **Sentry**: Monitoreo de errores (plan free hasta 5k eventos/mes)
- **Cloudflare**: WAF + DDoS protection (plan free)
- **npm audit**: Análisis de dependencias
- **ESLint**: Análisis estático
- **Zod**: Validación de schemas

### Pagas (Opcional)
- **Snyk**: Análisis avanzado de vulnerabilidades ($0-25/mes)
- **Vercel Pro**: Mejor rate limiting ($20/mes)
- **Supabase Pro**: Mejor RLS y backups ($25/mes)

---

## 📈 PRIORIZACIÓN

### DEBE HACERSE (Bloquea lanzamiento)
1. Rate limiting
2. RLS policies correctas
3. Validación robusta de inputs
4. Error handling seguro
5. 2FA para admin

### DEBERÍA HACERSE (Primera semana)
1. WAF
2. Monitoreo
3. CSRF protection
4. CSP headers
5. Auditoría básica

### SERÍA BUENO (Primer mes)
1. Documentación completa
2. Compliance total
3. Testing exhaustivo
4. Staging environment
5. Disaster recovery plan

---

## 🎯 MÉTRICAS DE ÉXITO

- ✅ 0 endpoints sin rate limiting
- ✅ 0 políticas RLS permisivas
- ✅ 0 endpoints sin validación
- ✅ 100% de errores sanitizados
- ✅ 100% de admins con 2FA
- ✅ < 100ms tiempo de respuesta rate limiter
- ✅ 0 falsos positivos en WAF

---

## 📞 SIGUIENTE PASO

1. **Revisa este documento** con tu equipo
2. **Prioriza** según tu timeline
3. **Implementa** usando la "Guía de Implementation"
4. **Valida** con "Pre-Launch Security Checklist"
5. **Monitorea** después del lanzamiento


