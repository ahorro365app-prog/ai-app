# 📘 GUÍA DE IMPLEMENTACIÓN DE SEGURIDAD

## PASO A PASO PARA CADA SECCIÓN

---

## SECCIÓN 1: RATE LIMITING

### Paso 1: Crear Middleware de Rate Limiting

```typescript
// src/lib/rateLimiter.ts
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
}>();

export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  // Obtener IP del request
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';
  
  const now = Date.now();
  const key = `${ip}:${req.nextUrl.pathname}`;
  const record = rateLimitStore.get(key);

  // Si no hay registro o expiró, crear uno nuevo
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Si excedió el límite
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  // Incrementar contador
  record.count++;
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  };
}

// Limpiar registros expirados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
```

### Paso 2: Aplicar en Endpoints Críticos

```typescript
// src/app/api/payments/create/route.ts
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  // Rate limiting: 20 requests per minute
  const limit = rateLimit(req, { maxRequests: 20, windowMs: 60 * 1000 });
  
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': limit.remaining.toString(),
          'X-RateLimit-Reset': new Date(limit.resetTime).toISOString(),
          'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  // ... resto del código
}
```

### Paso 3: Configuraciones por Endpoint

```typescript
// src/lib/rateLimitConfig.ts
export const RATE_LIMITS = {
  '/api/payments/create': { maxRequests: 20, windowMs: 60 * 1000 },
  '/api/payments/upload-receipt': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/webhooks/whatsapp': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/webhooks/baileys': { maxRequests: 10, windowMs: 60 * 1000 },
  '/api/audio/process': { maxRequests: 30, windowMs: 60 * 1000 },
  default: { maxRequests: 60, windowMs: 60 * 1000 }
};
```

### Testing
```bash
# Probar rate limiting
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/payments/create \
    -H "Content-Type: application/json" \
    -d '{"plan":"pro","monto_usdt":3.30}'
  echo ""
done
```

---

## SECCIÓN 2: VALIDACIÓN CON ZOD

### Paso 1: Crear Schemas

```typescript
// src/lib/validations/schemas.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  plan: z.enum(['pro'], {
    errorMap: () => ({ message: 'Plan inválido. Solo se acepta "pro"' })
  }),
  monto_usdt: z.number()
    .positive('El monto debe ser positivo')
    .max(10000, 'El monto no puede exceder 10,000 USDT'),
  direccion_wallet: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección de wallet inválida'),
  hash_transaccion: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Hash de transacción inválido')
    .optional()
    .nullable(),
  comprobante_url: z.string()
    .url('URL de comprobante inválida')
    .optional()
    .nullable(),
  notas: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable()
});

export const uploadReceiptSchema = z.object({
  file: z.instanceof(File, { message: 'Archivo requerido' }),
  folder: z.string().default('payment-receipts'),
  userId: z.string().uuid('ID de usuario inválido')
});
```

### Paso 2: Helper de Validación

```typescript
// src/lib/validations/validator.ts
import { z } from 'zod';
import { NextResponse } from 'next/server';

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    };
  }
  
  return { success: true, data: result.data };
}
```

### Paso 3: Usar en Endpoints

```typescript
// src/app/api/payments/create/route.ts
import { validateRequest } from '@/lib/validations/validator';
import { createPaymentSchema } from '@/lib/validations/schemas';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const validation = validateRequest(createPaymentSchema, body);
  if (!validation.success) {
    return validation.response;
  }
  
  // Usar validation.data (ya validado y tipado)
  const { plan, monto_usdt, direccion_wallet } = validation.data;
  
  // ... resto del código
}
```

---

## SECCIÓN 3: RLS POLICIES CORRECTAS

### Paso 1: Deshabilitar Políticas Permisivas

```sql
-- Eliminar políticas permisivas existentes
DROP POLICY IF EXISTS "Permitir todas las operaciones para transacciones" ON transacciones;
DROP POLICY IF EXISTS "Permitir todas las operaciones para deudas" ON deudas;
DROP POLICY IF EXISTS "Permitir todas las operaciones para metas" ON metas;
DROP POLICY IF EXISTS "Permitir todas las operaciones para usuarios" ON usuarios;
```

### Paso 2: Crear Políticas Restrictivas

```sql
-- TRANSACCIONES: Solo el usuario puede ver/crear/actualizar/eliminar sus propias transacciones
CREATE POLICY "Users can view own transactions"
ON transacciones FOR SELECT
USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can create own transactions"
ON transacciones FOR INSERT
WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can update own transactions"
ON transacciones FOR UPDATE
USING (auth.uid()::text = usuario_id::text)
WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Users can delete own transactions"
ON transacciones FOR DELETE
USING (auth.uid()::text = usuario_id::text);

-- DEUDAS: Similar a transacciones
CREATE POLICY "Users can manage own debts"
ON deudas FOR ALL
USING (auth.uid()::text = usuario_id::text)
WITH CHECK (auth.uid()::text = usuario_id::text);

-- METAS: Similar
CREATE POLICY "Users can manage own goals"
ON metas FOR ALL
USING (auth.uid()::text = usuario_id::text)
WITH CHECK (auth.uid()::text = usuario_id::text);

-- USUARIOS: Solo pueden ver/actualizar su propio perfil
CREATE POLICY "Users can view own profile"
ON usuarios FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
ON usuarios FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);
```

### Paso 3: Testing de RLS

```typescript
// tests/security/rls.test.ts
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  it('should not allow user A to see user B transactions', async () => {
    const userA = createClient(url, userAAnonKey);
    const userB = createClient(url, userBAnonKey);
    
    // User A crea transacción
    const { data: tx } = await userA.from('transacciones').insert({...}).select();
    
    // User B intenta verla
    const { data } = await userB
      .from('transacciones')
      .select('*')
      .eq('id', tx.id);
    
    expect(data).toBeNull(); // Debe estar vacío
  });
});
```

---

## SECCIÓN 4: ERROR HANDLING SEGURO

### Paso 1: Error Handler Wrapper

```typescript
// src/lib/errorHandler.ts
import { NextResponse } from 'next/server';
import { logger } from './logger';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Log error (sin datos sensibles)
  if (error instanceof ApiError) {
    logger.error(`API Error [${error.statusCode}]:`, error.message);
  } else {
    logger.error('Unexpected error:', error instanceof Error ? error.message : 'Unknown error');
  }

  // En producción, no exponer detalles
  if (process.env.NODE_ENV === 'production') {
    if (error instanceof ApiError && error.isOperational) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  // En desarrollo, mostrar detalles
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: error instanceof ApiError ? error.statusCode : 500
    },
    { status: error instanceof ApiError ? error.statusCode : 500 }
  );
}
```

### Paso 2: Usar en Endpoints

```typescript
// src/app/api/payments/create/route.ts
import { handleApiError, ApiError } from '@/lib/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body.plan) {
      throw new ApiError('Plan requerido', 400);
    }
    
    // ... resto del código
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## SECCIÓN 5: 2FA PARA ADMIN

### Paso 1: Instalar Dependencias

```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### Paso 2: Generar Secret y QR

```typescript
// src/lib/2fa.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function generate2FASecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `Ahorro365 (${email})`,
    issuer: 'Ahorro365'
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl
  };
}

export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Permite tokens ±2 períodos de tiempo
  });
}

export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
}
```

### Paso 3: Endpoint de Setup

```typescript
// src/app/api/admin/2fa/setup/route.ts
import { generate2FASecret, generateBackupCodes } from '@/lib/2fa';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin(req); // Función que validas
  const supabase = getSupabaseAdmin();

  const { secret, qrCodeUrl } = await generate2FASecret(admin.email);
  const backupCodes = generateBackupCodes();

  // Guardar en BD (encriptar secret)
  await supabase
    .from('admin_users')
    .update({
      two_factor_secret: secret, // En producción, encriptar
      backup_codes: backupCodes,
      two_factor_enabled: false // Activar después de verificar
    })
    .eq('id', admin.id);

  return NextResponse.json({
    qrCodeUrl,
    backupCodes // Mostrar solo una vez
  });
}
```

### Paso 4: Verificar en Login

```typescript
// src/app/api/admin/auth/login/route.ts
import { verify2FAToken } from '@/lib/2fa';

export async function POST(req: NextRequest) {
  const { email, password, twoFactorCode } = await req.json();
  
  // Validar email + password
  const admin = await validateCredentials({ email, password });
  
  if (!admin) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Si tiene 2FA activado, requerir código
  if (admin.two_factor_enabled) {
    if (!twoFactorCode) {
      return NextResponse.json(
        { error: '2FA code required', requires2FA: true },
        { status: 401 }
      );
    }

    const isValid = verify2FAToken(admin.two_factor_secret, twoFactorCode);
    if (!isValid) {
      // Verificar backup codes
      const isValidBackup = admin.backup_codes.includes(twoFactorCode);
      if (!isValidBackup) {
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
      // Remover backup code usado
      await removeBackupCode(admin.id, twoFactorCode);
    }
  }

  // Generar token JWT
  // ...
}
```

---

## SECCIÓN 6: MONITOREO CON SENTRY

### Paso 1: Instalar Sentry

```bash
npm install @sentry/nextjs
```

### Paso 2: Configurar Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Remover datos sensibles
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-user-id'];
      }
    }
    return event;
  }
});
```

### Paso 3: Integrar en API Routes

```typescript
// src/app/api/payments/create/route.ts
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  try {
    // ... código
  } catch (error) {
    Sentry.captureException(error, {
      tags: { endpoint: '/api/payments/create' },
      extra: { userId: await getUserId(req) }
    });
    return handleApiError(error);
  }
}
```

---

## SECCIÓN 7: CSRF PROTECTION

### Paso 1: Generar CSRF Token

```typescript
// src/lib/csrf.ts
import crypto from 'crypto';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  );
}
```

### Paso 2: Middleware de CSRF

```typescript
// src/middleware.ts (agregar)
import { validateCSRFToken } from '@/lib/csrf';

export function validateCSRF(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return true; // No requiere CSRF
  }

  const csrfToken = req.headers.get('x-csrf-token');
  const sessionToken = req.cookies.get('csrf-token')?.value;

  if (!csrfToken || !sessionToken) {
    return false;
  }

  return validateCSRFToken(csrfToken, sessionToken);
}
```

---

## SECCIÓN 8: CSP HEADERS

### Paso 1: Configurar en next.config.ts

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Ajustar según necesidades
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.groq.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

---

## VALIDACIÓN FINAL

### Checklist de Testing

```bash
# 1. Rate limiting
curl -X POST http://localhost:3000/api/payments/create -H "Content-Type: application/json" -d '{}'
# Intentar 25 veces, debería bloquear

# 2. Validación
curl -X POST http://localhost:3000/api/payments/create -H "Content-Type: application/json" -d '{"plan":"invalid"}'
# Debería retornar error de validación

# 3. RLS
# Login como usuario A, intentar ver transacciones de usuario B
# Debería retornar vacío

# 4. Error handling
# Forzar error en endpoint
# Debería retornar mensaje genérico en producción

# 5. 2FA
# Intentar login admin sin código 2FA
# Debería requerir código
```

---

## PRÓXIMOS PASOS

1. Implementar cada sección en orden
2. Testing después de cada sección
3. Documentar cambios
4. Revisar con equipo
5. Validar con "Pre-Launch Security Checklist"


