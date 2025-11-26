# 🔐 ADMIN PANEL SECURITY - GUÍA COMPLETA

## SETUP 2FA PARA ADMIN

### Paso 1: Crear Tabla de 2FA

```sql
-- Agregar columnas a admin_users
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_setup_date TIMESTAMP;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_two_factor_enabled 
ON admin_users(two_factor_enabled);
```

### Paso 2: Instalar Dependencias

```bash
cd admin-dashboard
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### Paso 3: Servicio de 2FA

```typescript
// admin-dashboard/src/lib/2fa.ts
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Genera un secret para 2FA y QR code
 */
export async function generate2FASecret(email: string, issuer: string = 'Ahorro365 Admin') {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    issuer: issuer,
    length: 32
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl,
    otpauthUrl: secret.otpauth_url
  };
}

/**
 * Verifica un token 2FA
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Permite tokens ±2 períodos (60 segundos cada uno)
  });
}

/**
 * Genera códigos de respaldo
 */
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => {
    // Generar código de 8 caracteres alfanuméricos
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  });
}

/**
 * Valida un código de respaldo
 */
export function validateBackupCode(code: string, backupCodes: string[]): boolean {
  return backupCodes.includes(code.toUpperCase());
}

/**
 * Encripta el secret de 2FA (en producción usar key management)
 */
export function encryptSecret(secret: string, key: string): string {
  // En producción, usar AWS KMS, HashiCorp Vault, etc.
  // Por ahora, simple encoding (MEJORAR EN PRODUCCIÓN)
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Desencripta el secret de 2FA
 */
export function decryptSecret(encrypted: string, key: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### Paso 4: Endpoint de Setup 2FA

```typescript
// admin-dashboard/src/app/api/admin/2fa/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generate2FASecret, generateBackupCodes } from '@/lib/2fa';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const token = req.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener admin
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Si ya tiene 2FA activado, no permitir setup nuevo
    if (admin.two_factor_enabled) {
      return NextResponse.json(
        { error: '2FA already enabled. Disable first to setup new.' },
        { status: 400 }
      );
    }

    // Generar secret y códigos de respaldo
    const { secret, qrCodeUrl } = await generate2FASecret(admin.email);
    const backupCodes = generateBackupCodes(10);

    // Guardar (sin activar aún)
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        two_factor_secret: secret, // En producción, encriptar
        backup_codes: backupCodes,
        two_factor_enabled: false,
        two_factor_setup_date: new Date().toISOString()
      })
      .eq('id', admin.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save 2FA setup' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      qrCodeUrl,
      backupCodes, // Mostrar solo una vez
      message: 'Save these backup codes. You will need to verify 2FA to enable it.'
    });

  } catch (error: any) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Paso 5: Endpoint de Verificación y Activación

```typescript
// admin-dashboard/src/app/api/admin/2fa/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify2FAToken } from '@/lib/2fa';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (error || !admin || !admin.two_factor_secret) {
      return NextResponse.json(
        { error: '2FA not setup' },
        { status: 400 }
      );
    }

    // Verificar código
    const isValid = verify2FAToken(admin.two_factor_secret, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // Activar 2FA
    await supabase
      .from('admin_users')
      .update({
        two_factor_enabled: true
      })
      .eq('id', admin.id);

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    });

  } catch (error: any) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Paso 6: Modificar Login para Requerir 2FA

```typescript
// admin-dashboard/src/app/api/auth/login/route.ts
import { verify2FAToken, validateBackupCode } from '@/lib/2fa';

export async function POST(req: NextRequest) {
  const { email, password, twoFactorCode } = await req.json();

  // Validar credenciales
  const admin = await validateCredentials({ email, password });
  if (!admin) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Si tiene 2FA activado, requerir código
  if (admin.two_factor_enabled) {
    if (!twoFactorCode) {
      return NextResponse.json(
        { 
          error: '2FA code required',
          requires2FA: true,
          tempToken: generateTempToken(admin.id) // Token temporal para completar login
        },
        { status: 401 }
      );
    }

    // Verificar código 2FA
    const isValid2FA = verify2FAToken(admin.two_factor_secret, twoFactorCode);
    
    // Si no es válido, verificar backup codes
    if (!isValid2FA) {
      const isValidBackup = validateBackupCode(twoFactorCode, admin.backup_codes || []);
      
      if (!isValidBackup) {
        return NextResponse.json(
          { error: 'Invalid 2FA code' },
          { status: 401 }
        );
      }

      // Remover backup code usado
      await removeBackupCode(admin.id, twoFactorCode);
    }
  }

  // Generar JWT token
  const jwtToken = generateToken({
    id: admin.id,
    email: admin.email,
    role: admin.role
  });

  // Configurar cookie
  const response = NextResponse.json({
    success: true,
    user: { id: admin.id, email: admin.email, role: admin.role }
  });

  response.cookies.set('admin-token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  });

  return response;
}
```

---

## AUDIT LOGS

### Paso 1: Crear Tabla de Auditoría

```sql
-- Tabla de auditoría para admin
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'create_user', 'update_payment', etc.
  resource_type TEXT, -- 'user', 'payment', 'transaction', etc.
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);

-- RLS: Solo service role puede escribir/leer
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit logs"
ON admin_audit_logs FOR ALL
USING (auth.role() = 'service_role');
```

### Paso 2: Servicio de Auditoría

```typescript
// admin-dashboard/src/lib/audit.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditLogEntry {
  adminId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(entry: AuditLogEntry) {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: entry.adminId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // No fallar la operación si el logging falla
  }
}

// Helper para obtener IP del request
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}
```

### Paso 3: Middleware de Auditoría

```typescript
// admin-dashboard/src/middleware.ts (extender)
import { logAdminAction, getClientIP } from '@/lib/audit';
import { verifyToken } from '@/lib/auth';

export async function auditMiddleware(
  req: NextRequest,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
) {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return;

  const payload = verifyToken(token);
  if (!payload) return;

  await logAdminAction({
    adminId: payload.id,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: getClientIP(req),
    userAgent: req.headers.get('user-agent') || undefined
  });
}
```

### Paso 4: Usar en Endpoints

```typescript
// admin-dashboard/src/app/api/admin/payments/[id]/verify/route.ts
import { auditMiddleware } from '@/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const paymentId = params.id;

  // Verificar autenticación
  const admin = await getAuthenticatedAdmin(req);

  // Procesar verificación
  await verifyPayment(paymentId, body);

  // Auditar acción
  await auditMiddleware(req, 'verify_payment', 'payment', paymentId, {
    status: body.status,
    notes: body.notes
  });

  return NextResponse.json({ success: true });
}
```

### Paso 5: Dashboard de Auditoría

```typescript
// admin-dashboard/src/app/(protected)/audit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    adminId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  async function fetchLogs() {
    setLoading(true);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('admin_audit_logs')
      .select('*, admin_users(email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      
      {/* Filtros */}
      <div className="mb-4 flex gap-4">
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="verify_payment">Verify Payment</option>
          <option value="create_user">Create User</option>
        </select>
        {/* Más filtros */}
      </div>

      {/* Tabla de logs */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Time</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Resource</th>
            <th>IP Address</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.admin_users?.email || log.admin_id}</td>
              <td>{log.action}</td>
              <td>{log.resource_type} {log.resource_id}</td>
              <td>{log.ip_address}</td>
              <td>{JSON.stringify(log.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## MONITOREO

### Paso 1: Configurar Alertas

```typescript
// admin-dashboard/src/lib/alerts.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAlert(
  type: 'error' | 'warning' | 'info',
  message: string,
  details?: any
) {
  const admins = await getAdminEmails(); // Función que obtiene emails de admins

  await resend.emails.send({
    from: 'alerts@ahorro365.com',
    to: admins,
    subject: `[${type.toUpperCase()}] Ahorro365 Alert: ${message}`,
    html: `
      <h2>Alert: ${message}</h2>
      <p>Type: ${type}</p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
      <p>Time: ${new Date().toISOString()}</p>
    `
  });
}

// Alertas automáticas
export async function checkSecurityMetrics() {
  // Intentos de login fallidos
  const failedLogins = await getFailedLoginAttempts(15); // Últimos 15 min
  if (failedLogins > 10) {
    await sendAlert('warning', 'Multiple failed login attempts', {
      count: failedLogins,
      timeWindow: '15 minutes'
    });
  }

  // Acciones críticas
  const criticalActions = await getCriticalActions(60); // Última hora
  if (criticalActions.length > 0) {
    await sendAlert('info', 'Critical actions performed', {
      actions: criticalActions
    });
  }
}

// Ejecutar cada 5 minutos
setInterval(checkSecurityMetrics, 5 * 60 * 1000);
```

---

## BEST PRACTICES

### 1. Session Management
- ✅ Timeout de 30 minutos de inactividad
- ✅ Logout en todos los dispositivos al cambiar contraseña
- ✅ Máximo 3 sesiones simultáneas

### 2. Password Policy
- ✅ Mínimo 12 caracteres
- ✅ Requiere mayúsculas, minúsculas, números, símbolos
- ✅ No puede ser igual a los últimos 5 passwords
- ✅ Cambio obligatorio cada 90 días

### 3. IP Whitelisting (Opcional)
```typescript
const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];

export function validateAdminIP(req: NextRequest): boolean {
  if (ALLOWED_IPS.length === 0) return true; // No hay whitelist
  
  const ip = getClientIP(req);
  return ALLOWED_IPS.includes(ip);
}
```

### 4. Rate Limiting Específico
```typescript
// Admin endpoints: 30 requests per minute
const adminLimit = rateLimit(req, { maxRequests: 30, windowMs: 60 * 1000 });
```

### 5. Masking de Datos Sensibles
```typescript
export function maskSensitiveData(data: string): string {
  if (data.length <= 4) return '****';
  return data.slice(0, 2) + '****' + data.slice(-2);
}

// Uso
const maskedPhone = maskSensitiveData('+59170000000'); // +5*****00
const maskedWallet = maskSensitiveData('0x34ea390225f75b2f87482e5b91a8a08dc5a58cc2'); // 0x****cc2
```

---

## CHECKLIST DE IMPLEMENTACIÓN

- [ ] Tabla de 2FA creada
- [ ] Generación de QR codes funcionando
- [ ] Verificación de tokens 2FA
- [ ] Backup codes generados y guardados
- [ ] Login requiere 2FA si está activado
- [ ] Tabla de audit logs creada
- [ ] Logging de todas las acciones admin
- [ ] Dashboard de auditoría funcional
- [ ] Alertas configuradas
- [ ] Monitoreo de métricas de seguridad
- [ ] Rate limiting en endpoints admin
- [ ] IP whitelisting (opcional)
- [ ] Masking de datos sensibles
- [ ] Session timeout configurado
- [ ] Password policy implementada

---

## PRÓXIMOS PASOS

1. Implementar 2FA
2. Configurar audit logs
3. Setup de alertas
4. Testing completo
5. Documentar para el equipo


