# 🧪 GUÍA COMPLETA DE TESTING DE SEGURIDAD

**Fecha**: 2025  
**Fases**: 1, 2 y 3  
**Estado**: ⚙️ TESTING MANUAL Y AUTOMATIZADO

---

## 📋 RESUMEN

Esta guía cubre el testing completo de todas las medidas de seguridad implementadas en las Fases 1, 2 y 3. Incluye tests manuales y scripts automatizados para verificar que todo funciona correctamente.

---

## 🔧 PREPARACIÓN

### 1. Variables de Entorno Requeridas

Verifica que estas variables estén configuradas:

```bash
# Upstash Redis (para rate limiting)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT (admin dashboard)
JWT_SECRET=...
```

### 2. Servicios en Ejecución

- ✅ App principal: `http://localhost:3000`
- ✅ Admin dashboard: `http://localhost:3001`
- ✅ Upstash Redis: Configurado y accesible

---

## 📊 FASE 1: TESTING BÁSICO

### ✅ 1.1 Validación Backend (RLS Deshabilitado)

#### Test 1.1.1: Verificar RLS en Supabase
**Acción**: Ejecutar en Supabase SQL Editor
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('usuarios', 'transacciones', 'deudas', 'metas', 'pagos', 'logs_whatsapp', 'referidos')
ORDER BY tablename;
```

**Resultado Esperado**: Todas las tablas deben mostrar `rowsecurity = false`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.1.2: Verificar Validación de User ID
**Acción**: Hacer request sin header `x-user-id`
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "monto_usdt": 10}'
```

**Resultado Esperado**: Error 401 "No autenticado" (no debe aceptar userId del body)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 1.2 Contraseñas Admin con Bcrypt

#### Test 1.2.1: Verificar Contraseñas en BD
**Acción**: Ejecutar en Supabase SQL Editor
```sql
SELECT email, 
       CASE 
         WHEN password_hash LIKE '$2%' THEN 'bcrypt ✅'
         ELSE 'texto plano ⚠️'
       END as tipo_hash
FROM admin_users;
```

**Resultado Esperado**: Todos los usuarios deben mostrar `tipo_hash = 'bcrypt ✅'`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.2.2: Probar Login con Contraseña Correcta
**Acción**: 
1. Ir a `http://localhost:3001/login`
2. Ingresar credenciales correctas
3. Verificar que el login funciona

**Resultado Esperado**: Login exitoso, redirección a dashboard

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.2.3: Probar Login con Contraseña Incorrecta
**Acción**:
1. Ir a `http://localhost:3001/login`
2. Ingresar email correcto pero contraseña incorrecta
3. Verificar que el login falla

**Resultado Esperado**: Error "Contraseña incorrecta" (401)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 1.3 Rate Limiting con Upstash Redis

#### Test 1.3.1: Verificar Variables de Entorno
**Acción**: Verificar que las variables están configuradas
```bash
# En PowerShell
$env:UPSTASH_REDIS_REST_URL
$env:UPSTASH_REDIS_REST_TOKEN
```

**Resultado Esperado**: Ambas variables deben tener valores

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.3.2: Probar Rate Limiting en Login Admin
**Acción**:
1. Ir a `http://localhost:3001/login`
2. Intentar hacer login 6 veces seguidas con credenciales incorrectas
3. En el 6to intento verificar la respuesta

**Resultado Esperado**: 
- Intentos 1-5: Error "Contraseña incorrecta" (401)
- Intento 6: Error "Demasiados intentos de login" (429)
- Headers incluyen: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.3.3: Verificar Headers de Rate Limiting
**Acción**: 
1. Abrir DevTools → Network
2. Hacer login 3 veces
3. Verificar headers de la respuesta

**Resultado Esperado**: Headers deben incluir:
- `X-RateLimit-Limit: 5`
- `X-RateLimit-Remaining: 2` (después de 3 intentos)
- `X-RateLimit-Reset: [timestamp]`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.3.4: Probar Rate Limiting en Webhooks
**Acción**: Enviar 101 requests a `/api/webhooks/whatsapp` en 15 minutos

**Resultado Esperado**: 
- Requests 1-100: Procesados normalmente
- Request 101: Error 429 "Rate limit exceeded"

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 1.4 Error Handling Seguro

#### Test 1.4.1: Probar Error en Desarrollo
**Acción**:
1. Asegurarse de que `NODE_ENV=development`
2. Generar un error intencional (ej: usuario no encontrado)
3. Verificar la respuesta

**Resultado Esperado**: 
```json
{
  "success": false,
  "message": "Ha ocurrido un error inesperado.",
  "details": "[mensaje de error detallado]"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.4.2: Probar Error en Producción
**Acción**:
1. Configurar `NODE_ENV=production`
2. Generar el mismo error
3. Verificar la respuesta

**Resultado Esperado**: 
```json
{
  "success": false,
  "message": "Ha ocurrido un error inesperado."
}
```
**NO debe incluir `details`**

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.4.3: Verificar Clasificación de Errores
**Acción**: Probar diferentes tipos de errores

| Error | Tipo Esperado | Status Code |
|-------|---------------|-------------|
| Validación | VALIDATION_ERROR | 400 |
| No autenticado | AUTHENTICATION_ERROR | 401 |
| No autorizado | AUTHORIZATION_ERROR | 403 |
| No encontrado | NOT_FOUND | 404 |
| Base de datos | DATABASE_ERROR | 500 |

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 1.5 Validación Inputs con Zod

#### Test 1.5.1: Validación de Tipos Incorrectos
**Acción**: Enviar request con tipo incorrecto
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": "not-a-number"}'
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "message": "Error de validación",
  "details": "monto_usdt: Expected number, received string"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.2: Validación de UUID Inválido
**Acción**: Enviar request con UUID inválido
```bash
curl -X GET "http://localhost:3000/api/feedback/confirm?usuario_id=not-a-uuid"
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "message": "ID debe ser un UUID válido"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.3: Validación de Email Inválido
**Acción**: Intentar login con email inválido
```bash
curl -X POST http://localhost:3001/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "test123"}'
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "message": "Email inválido"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.4: Validación de Rangos
**Acción**: Enviar pago con monto negativo o muy grande
```bash
# Monto negativo
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": -10}'

# Monto muy grande (> 10000)
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": 99999}'
```

**Resultado Esperado**: Ambos deben retornar error de validación

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

## 🔒 FASE 2: TESTING AVANZADO

### ✅ 2.1 CSRF Protection

#### Test 2.1.1: Obtener CSRF Token
**Acción**: 
```bash
curl -X GET http://localhost:3000/api/csrf-token \
  -H "Cookie: csrfToken=test"
```

**Resultado Esperado**: 
```json
{
  "csrfToken": "[token-generado]"
}
```
Y cookie `csrfToken` configurada

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.1.2: Request sin CSRF Token
**Acción**: Enviar request sin CSRF token
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": 10}'
```

**Resultado Esperado**: Error 403 "CSRF token requerido"

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.1.3: Request con CSRF Token Inválido
**Acción**: Enviar request con CSRF token incorrecto
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -H "x-csrf-token: invalid-token" \
  -H "Cookie: csrfToken=another-invalid-token" \
  -d '{"plan": "pro", "monto_usdt": 10, "csrfToken": "invalid"}'
```

**Resultado Esperado**: Error 403 "CSRF token inválido"

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.1.4: Request con CSRF Token Válido
**Acción**: 
1. Obtener CSRF token
2. Enviar request con token válido

```bash
# 1. Obtener token
TOKEN=$(curl -s -c cookies.txt http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

# 2. Usar token
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -H "x-csrf-token: $TOKEN" \
  -b cookies.txt \
  -d "{\"plan\": \"pro\", \"monto_usdt\": 10, \"csrfToken\": \"$TOKEN\"}"
```

**Resultado Esperado**: Request exitoso (200 o 201)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 2.2 Security Headers

#### Test 2.2.1: Verificar Security Headers
**Acción**: Hacer request y verificar headers
```bash
curl -I http://localhost:3000/
```

**Resultado Esperado**: Headers deben incluir:
- `Content-Security-Policy: ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: ...`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.2.2: Verificar HSTS en Producción
**Acción**: En producción, verificar header HSTS
```bash
curl -I https://tu-dominio.com/
```

**Resultado Esperado**: Header `Strict-Transport-Security` presente

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.2.3: Probar XSS Protection
**Acción**: Intentar inyectar script en input
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": 10, "notas": "<script>alert(1)</script>"}'
```

**Resultado Esperado**: 
- Si Zod valida: Error de validación
- Si pasa validación: Script no ejecutado (CSP bloquea)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 2.3 Environment Variables Validation

#### Test 2.3.1: Ejecutar Script de Validación
**Acción**: 
```bash
npx tsx scripts/validate-env.ts
```

**Resultado Esperado**: 
```
✅ Todas las variables de entorno requeridas están configuradas correctamente.
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.3.2: Verificar .gitignore
**Acción**: Verificar que `.env*` está en `.gitignore`
```bash
cat .gitignore | grep -i "\.env"
```

**Resultado Esperado**: `.env*` debe estar listado (excepto `.env.example`)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.3.3: Buscar Secrets Hardcodeados
**Acción**: 
```bash
# Si tienes gitleaks instalado
gitleaks detect --source=. --verbose
```

**Resultado Esperado**: No se encuentran secrets hardcodeados

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 2.4 Logging Seguro

#### Test 2.4.1: Verificar Logs en Desarrollo
**Acción**:
1. Configurar `NODE_ENV=development`
2. Realizar acciones que generen logs
3. Verificar que aparezcan logs `debug` e `info`

**Resultado Esperado**: Todos los logs visibles (debug, info, warn, error)

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 2.4.2: Verificar Logs en Producción
**Acción**:
1. Configurar `NODE_ENV=production`
2. Realizar las mismas acciones
3. Verificar que solo aparezcan `warn` y `error`

**Resultado Esperado**: Solo warnings y errores visibles

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

## 🔐 FASE 3: TESTING ADMIN

### ✅ 3.1 2FA para Admin Panel

#### Test 3.1.1: Configurar 2FA
**Acción**:
1. Iniciar sesión en admin panel
2. Ir a `/settings/2fa`
3. Hacer clic en "Configurar 2FA"
4. Escanear QR code con Google Authenticator
5. Ingresar código de 6 dígitos

**Resultado Esperado**: 
- QR code generado
- Códigos de respaldo mostrados
- 2FA habilitado después de verificar

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.1.2: Login con 2FA
**Acción**:
1. Cerrar sesión
2. Iniciar sesión con email/password
3. Verificar que aparece campo para código 2FA
4. Ingresar código de 6 dígitos

**Resultado Esperado**: Login exitoso después de verificar 2FA

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.1.3: Login con Código de Respaldo
**Acción**:
1. Iniciar sesión con email/password
2. En lugar de código TOTP, usar un código de respaldo (8 caracteres)

**Resultado Esperado**: Login exitoso, código de respaldo eliminado

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.1.4: Login con Código 2FA Inválido
**Acción**:
1. Iniciar sesión con email/password
2. Ingresar código 2FA incorrecto

**Resultado Esperado**: Error "Código 2FA inválido"

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.1.5: Deshabilitar 2FA
**Acción**:
1. Ir a `/settings/2fa`
2. Ingresar código 2FA válido
3. Hacer clic en "Deshabilitar 2FA"

**Resultado Esperado**: 2FA deshabilitado, login sin código 2FA funciona

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

### ✅ 3.2 Audit Logs para Admin

#### Test 3.2.1: Verificar Tabla Creada
**Acción**: Ejecutar en Supabase SQL Editor
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_audit_logs'
ORDER BY ordinal_position;
```

**Resultado Esperado**: Tabla con todas las columnas necesarias

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.2.2: Verificar Logging de Login
**Acción**:
1. Iniciar sesión en admin panel
2. Verificar en Supabase que se creó un log

```sql
SELECT * FROM admin_audit_logs 
WHERE action = 'login' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado Esperado**: Log creado con `action = 'login'`, `admin_id` no null, `status = 'success'`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.2.3: Verificar Logging de Login Fallido
**Acción**:
1. Intentar login con credenciales incorrectas
2. Verificar en Supabase que se creó un log

```sql
SELECT * FROM admin_audit_logs 
WHERE action = 'login_failed' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado Esperado**: Log creado con `action = 'login_failed'`, `admin_id = null`, `status = 'error'`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.2.4: Verificar Logging de Acciones
**Acción**:
1. Actualizar un usuario
2. Verificar/rechazar un pago
3. Configurar 2FA
4. Verificar en Supabase que se crearon los logs

**Resultado Esperado**: Logs creados para cada acción con detalles correctos

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 3.2.5: Verificar Página de Audit Logs
**Acción**:
1. Ve a `/audit-logs` en el admin panel
2. Verifica que se muestran los logs
3. Prueba los filtros (acción, estado, fecha)
4. Verifica la paginación

**Resultado Esperado**: Logs visibles, filtros funcionando, paginación correcta

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

## 📊 RESUMEN DE TESTING

### Tests por Fase

| Fase | Componente | Tests | Pasados | Fallidos |
|------|------------|-------|---------|----------|
| **Fase 1** | RLS Deshabilitado | 2 | ___ | ___ |
| | Bcrypt | 3 | ___ | ___ |
| | Rate Limiting | 4 | ___ | ___ |
| | Error Handling | 3 | ___ | ___ |
| | Zod Validation | 4 | ___ | ___ |
| **Fase 2** | CSRF Protection | 4 | ___ | ___ |
| | Security Headers | 3 | ___ | ___ |
| | Env Validation | 3 | ___ | ___ |
| | Logging Seguro | 2 | ___ | ___ |
| **Fase 3** | 2FA | 5 | ___ | ___ |
| | Audit Logs | 5 | ___ | ___ |
| **TOTAL** | | **38** | ___ | ___ |

### Tasa de Éxito: ___%

---

## 🔍 VERIFICACIONES ADICIONALES

### Verificar Imports
- [ ] Todos los endpoints usan `handleError`
- [ ] Todos los endpoints usan `validateWithZod`
- [ ] Endpoints críticos usan `requireCSRF`
- [ ] Rate limiting aplicado a endpoints críticos
- [ ] Logging condicional implementado

### Verificar Archivos
- [ ] `src/lib/errorHandler.ts` existe
- [ ] `src/lib/validations.ts` existe
- [ ] `src/lib/rateLimit.ts` existe
- [ ] `src/lib/csrf.ts` existe
- [ ] `src/lib/securityHeaders.ts` existe
- [ ] `src/lib/logger.ts` existe
- [ ] `admin-dashboard/src/lib/totp-helpers.ts` existe
- [ ] `admin-dashboard/src/lib/audit-logger.ts` existe

### Verificar Variables de Entorno
- [ ] `UPSTASH_REDIS_REST_URL` configurada
- [ ] `UPSTASH_REDIS_REST_TOKEN` configurada
- [ ] Variables en `.env.local`
- [ ] Variables en `admin-dashboard/.env.local`
- [ ] No hay secrets en el código

---

## ✅ CRITERIO DE APROBACIÓN

**Testing se considera completo cuando**:
- ✅ Al menos 90% de los tests pasan
- ✅ Todos los tests críticos pasan:
  - RLS deshabilitado
  - Bcrypt funcionando
  - Rate limiting activo
  - CSRF protection funcionando
  - Security headers presentes
  - 2FA funcionando
  - Audit logs registrando
- ✅ No hay errores de compilación
- ✅ No hay errores de linter
- ✅ No hay secrets hardcodeados

---

**Fecha de Testing**: ___________  
**Tester**: ___________  
**Resultado Final**: [ ] ✅ APROBADO / [ ] ❌ REQUIERE CORRECCIONES

---

## 📝 NOTAS

- Marca cada test como ✅ o ❌
- Si un test falla, anota el error en la sección de detalles
- Al final, calcula la tasa de éxito
- Si hay tests fallidos, revisa los detalles y corrige
- Guarda este documento como registro de testing

