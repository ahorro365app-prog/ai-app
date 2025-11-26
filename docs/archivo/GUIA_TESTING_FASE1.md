# 🧪 GUÍA DE TESTING - FASE 1 SEGURIDAD

**Fecha**: 2025  
**Fase**: 1 - Crítico  
**Estado**: ⚙️ TESTING MANUAL

---

## 📋 CHECKLIST DE TESTING

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

#### Test 1.1.2: Probar Query sin Autenticación
**Acción**: Desde el código, hacer query sin headers de autenticación
```typescript
// Debería funcionar porque RLS está deshabilitado
const { data } = await supabase.from('usuarios').select('id').limit(1);
```

**Resultado Esperado**: Query exitosa (RLS deshabilitado permite acceso)

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
       END as tipo_hash,
       LEFT(password_hash, 20) as hash_preview
FROM admin_users;
```

**Resultado Esperado**: Todos los usuarios deben mostrar `tipo_hash = 'bcrypt ✅'`

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.2.2: Probar Login con Contraseña Correcta
**Acción**: 
1. Ir a http://localhost:3001/login
2. Ingresar credenciales correctas
3. Verificar que el login funciona

**Resultado Esperado**: Login exitoso

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.2.3: Probar Login con Contraseña Incorrecta
**Acción**:
1. Ir a http://localhost:3001/login
2. Ingresar email correcto pero contraseña incorrecta
3. Verificar que el login falla

**Resultado Esperado**: Error "Contraseña incorrecta"

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.2.4: Verificar Migración Automática
**Acción**:
1. Si hay un usuario con contraseña en texto plano en BD
2. Hacer login con ese usuario
3. Revisar logs del servidor

**Resultado Esperado**: Ver en logs "⚠️ Password en texto plano detectado, migrando a bcrypt..."

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

#### Test 1.3.2: Probar Rate Limiting en Login
**Acción**:
1. Ir a http://localhost:3001/login
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
  "error": "Usuario no encontrado",
  "type": "NOT_FOUND",
  "details": {
    "originalMessage": "...",
    "stack": "..."
  }
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
  "error": "El recurso solicitado no fue encontrado",
  "type": "NOT_FOUND"
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
# Pago con monto como string
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": "not-a-number"}'
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "error": "monto_usdt: Expected number, received string",
  "type": "VALIDATION_ERROR"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.2: Validación de XSS
**Acción**: Enviar request con script
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": 10, "notas": "<script>alert(1)</script>"}'
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "error": "notas: Texto contiene caracteres no permitidos",
  "type": "VALIDATION_ERROR"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.3: Validación de UUID Inválido
**Acción**: Enviar request con UUID inválido
```bash
curl -X GET "http://localhost:3000/api/feedback/confirm?usuario_id=not-a-uuid"
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "error": "ID debe ser un UUID válido",
  "type": "VALIDATION_ERROR"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.4: Validación de Email Inválido
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
  "error": "email: Email inválido",
  "type": "VALIDATION_ERROR"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.5: Validación de Rangos
**Acción**: Enviar pago con monto negativo o muy grande
```bash
# Monto negativo
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": -10}'

# Monto muy grande
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "pro", "monto_usdt": 999999}'
```

**Resultado Esperado**: Ambos deben retornar error de validación

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

#### Test 1.5.6: Validación de Plan Inválido
**Acción**: Enviar pago con plan diferente a "pro"
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-user-id: [tu-user-id]" \
  -d '{"plan": "premium", "monto_usdt": 10}'
```

**Resultado Esperado**: 
```json
{
  "success": false,
  "error": "plan: Solo se acepta el plan \"pro\"",
  "type": "VALIDATION_ERROR"
}
```

**Estado**: [ ] ✅ Pasó / [ ] ❌ Falló

---

## 📊 RESUMEN DE TESTING

### Tests por Componente

| Componente | Tests | Pasados | Fallidos |
|------------|-------|---------|----------|
| RLS Deshabilitado | 2 | ___ | ___ |
| Bcrypt | 4 | ___ | ___ |
| Rate Limiting | 3 | ___ | ___ |
| Error Handling | 3 | ___ | ___ |
| Zod Validation | 6 | ___ | ___ |
| **TOTAL** | **18** | ___ | ___ |

### Tasa de Éxito: ___%

---

## 🔍 VERIFICACIONES ADICIONALES

### Verificar Imports
- [ ] Todos los endpoints usan `handleError`
- [ ] Todos los endpoints usan `validateWithZod`
- [ ] Rate limiting aplicado a endpoints críticos

### Verificar Archivos
- [ ] `src/lib/errorHandler.ts` existe
- [ ] `src/lib/validations.ts` existe
- [ ] `src/lib/rateLimit.ts` existe
- [ ] `admin-dashboard/src/lib/errorHandler.ts` existe
- [ ] `admin-dashboard/src/lib/validations.ts` existe
- [ ] `admin-dashboard/src/lib/rateLimit.ts` existe

### Verificar Variables de Entorno
- [ ] `UPSTASH_REDIS_REST_URL` configurada
- [ ] `UPSTASH_REDIS_REST_TOKEN` configurada
- [ ] Variables en `.env.local`
- [ ] Variables en `admin-dashboard/.env.local`

---

## 📝 NOTAS

- Marca cada test como ✅ o ❌
- Si un test falla, anota el error en la sección de detalles
- Al final, calcula la tasa de éxito
- Si hay tests fallidos, revisa los detalles y corrige

---

## ✅ CRITERIO DE APROBACIÓN

**Fase 1 se considera completa cuando**:
- ✅ Al menos 90% de los tests pasan
- ✅ Todos los tests críticos (RLS, Bcrypt, Rate Limiting) pasan
- ✅ No hay errores de compilación
- ✅ No hay errores de linter

---

**Fecha de Testing**: ___________  
**Tester**: ___________  
**Resultado Final**: [ ] ✅ APROBADO / [ ] ❌ REQUIERE CORRECCIONES

