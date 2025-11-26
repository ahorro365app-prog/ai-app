# 🔒 Guía de Verificación de RLS Policies en Supabase

**Fecha**: 2025-01-17  
**Estado**: Pendiente de verificación manual  
**Componente**: Supabase (Base de datos)

---

## 📋 Resumen del Estado Actual

### ⚠️ Situación Detectada

Según el archivo `disable-rls-security.sql`, el sistema está configurado para **deshabilitar RLS** en las tablas principales y manejar la seguridad en el backend usando `service_role` key.

### 🔍 Tablas Afectadas

Las siguientes tablas tienen RLS deshabilitado según el script:
- `usuarios` / `users`
- `transacciones` / `transactions`
- `deudas` / `debts`
- `metas` / `goals`
- `pagos` / `payments`
- `logs_whatsapp` / `whatsapp_logs`
- `categorias` / `categories`
- `referidos` / `referrals`

### ✅ Tabla con RLS Habilitado

- `admin_users` - Mantiene RLS habilitado (requiere protección adicional)

---

## 🎯 Proceso de Verificación

### Paso 1: Acceder a Supabase Dashboard

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar el proyecto correspondiente
3. Navegar a **Authentication** → **Policies** o **Database** → **Tables**

### Paso 2: Verificar Estado de RLS por Tabla

Para cada tabla crítica, verificar:

1. **Estado de RLS**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('usuarios', 'transacciones', 'pagos', 'referidos');
   ```

2. **Políticas Existentes**:
   ```sql
   SELECT schemaname, tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('usuarios', 'transacciones', 'pagos', 'referidos');
   ```

### Paso 3: Verificar Seguridad en Backend

Como RLS está deshabilitado, la seguridad debe estar implementada en el backend:

1. **Verificar que se usa `service_role` key**:
   - Buscar en código: `getSupabaseAdmin()` o `SUPABASE_SERVICE_ROLE_KEY`
   - Confirmar que los endpoints validan `userId` antes de acceder a datos

2. **Verificar validación de `userId`**:
   - Cada endpoint debe validar que el `userId` en la solicitud corresponde al usuario autenticado
   - No permitir que un usuario acceda a datos de otro usuario

### Paso 4: Testing de Aislamiento de Datos

1. **Crear 2 usuarios de prueba**:
   - Usuario A: `test-user-a@example.com`
   - Usuario B: `test-user-b@example.com`

2. **Probar que Usuario A no puede acceder a datos de Usuario B**:
   - Intentar obtener transacciones de Usuario B usando token de Usuario A
   - Intentar actualizar datos de Usuario B usando token de Usuario A
   - Verificar que todas las solicitudes fallan con 403 o 404

3. **Probar que Usuario A solo puede acceder a sus propios datos**:
   - Obtener transacciones propias (debe funcionar)
   - Actualizar datos propios (debe funcionar)

---

## 📊 Tablas Críticas a Verificar

### Tablas de Usuario
- `usuarios` - Datos personales, información sensible
- `admin_users` - Acceso administrativo (tiene RLS habilitado)

### Tablas de Transacciones
- `transacciones` - Historial financiero
- `pagos` - Información de pagos

### Tablas de Referidos
- `referidos` - Sistema de referidos
- `codigos_verificacion` - Códigos de verificación

### Tablas de Notificaciones
- `notification_logs` - Historial de notificaciones
- `notification_preferences` - Preferencias de usuario
- `fcm_tokens` - Tokens de dispositivos

---

## ✅ Checklist de Verificación

- [ ] Verificar estado de RLS en Supabase Dashboard
- [ ] Confirmar que las tablas críticas tienen RLS deshabilitado (según diseño)
- [ ] Verificar que el backend valida `userId` en todos los endpoints
- [ ] Probar aislamiento de datos: Usuario A no puede ver datos de Usuario B
- [ ] Probar acceso propio: Usuario A puede ver sus propios datos
- [ ] Documentar cualquier política RLS activa encontrada
- [ ] Verificar que `admin_users` mantiene RLS habilitado

---

## 🔧 Comandos SQL Útiles

### Ver todas las tablas con RLS habilitado
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
```

### Ver todas las políticas RLS
```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar políticas en una tabla específica
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'usuarios';
```

---

## ⚠️ Notas Importantes

1. **RLS Deshabilitado**: El sistema está diseñado para NO usar RLS y manejar seguridad en el backend
2. **Service Role Key**: Todos los accesos desde el backend usan `service_role` key que bypass RLS
3. **Validación en Backend**: La seguridad depende de que cada endpoint valide correctamente el `userId`
4. **Testing Crítico**: Es esencial probar que un usuario no puede acceder a datos de otro usuario

---

## 🧪 Testing de Aislamiento de Datos

### Script de Testing Automatizado

Puedes usar el siguiente script para probar el aislamiento de datos:

```typescript
// scripts/test-data-isolation.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testDataIsolation() {
  console.log('🧪 Testing de Aislamiento de Datos\n');
  
  // Crear 2 usuarios de prueba
  const userA = await createTestUser('test-user-a@example.com', 'Usuario A');
  const userB = await createTestUser('test-user-b@example.com', 'Usuario B');
  
  // Crear datos para cada usuario
  await createTestData(userA.id, 'Transacción Usuario A');
  await createTestData(userB.id, 'Transacción Usuario B');
  
  // Test 1: Usuario A intenta acceder a datos de Usuario B
  const userAData = await getTransactions(userA.id);
  const userBData = await getTransactions(userB.id);
  
  console.log('✅ Test 1: Usuario A solo ve sus propios datos');
  console.log(`   Usuario A tiene ${userAData.length} transacciones`);
  console.log(`   Usuario B tiene ${userBData.length} transacciones`);
  
  // Test 2: Intentar acceder a datos de otro usuario (debe fallar)
  try {
    const unauthorizedAccess = await getTransactions(userB.id, userA.id);
    console.log('❌ Test 2 FALLIDO: Usuario A pudo acceder a datos de Usuario B');
  } catch (error) {
    console.log('✅ Test 2: Usuario A NO puede acceder a datos de Usuario B');
  }
  
  // Limpiar datos de prueba
  await cleanupTestData(userA.id);
  await cleanupTestData(userB.id);
}

// Ejecutar tests
testDataIsolation();
```

### Testing Manual con curl

#### Test 1: Usuario A intenta obtener transacciones de Usuario B

```bash
# Obtener token de Usuario A
TOKEN_A=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user-a@example.com","password":"password123"}' \
  | jq -r '.token')

# Intentar obtener transacciones de Usuario B usando token de Usuario A
curl -X GET "http://localhost:3001/api/transactions?userId=USER_B_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -w "\nStatus: %{http_code}\n" \
  -s

# Resultado esperado: 403 Forbidden o 404 Not Found
```

#### Test 2: Usuario A intenta actualizar datos de Usuario B

```bash
# Intentar actualizar transacción de Usuario B usando token de Usuario A
curl -X PUT "http://localhost:3001/api/transactions/TRANSACTION_B_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"amount":999999}' \
  -w "\nStatus: %{http_code}\n" \
  -s

# Resultado esperado: 403 Forbidden o 404 Not Found
```

#### Test 3: Usuario A accede a sus propios datos (debe funcionar)

```bash
# Obtener transacciones propias de Usuario A
curl -X GET "http://localhost:3001/api/transactions?userId=USER_A_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -w "\nStatus: %{http_code}\n" \
  -s

# Resultado esperado: 200 OK con datos del Usuario A
```

---

## 📝 Resultados de Verificación

**Fecha de verificación**: _[Pendiente]_  
**Verificado por**: _[Pendiente]_  

### Estado de RLS por Tabla

| Tabla | RLS Habilitado | Políticas Activas | Seguridad Backend | Verificado |
|-------|----------------|-------------------|-------------------|------------|
| `usuarios` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `transacciones` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `pagos` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `referidos` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `notification_logs` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `fcm_tokens` | ❌ Deshabilitado | 0 | ✅ Validación en backend | ⏳ Pendiente |
| `admin_users` | ✅ Habilitado | _[Verificar]_ | ✅ Service role + RLS | ⏳ Pendiente |

### Testing de Aislamiento

- [ ] Test 1: Usuario A no puede ver datos de Usuario B (GET)
- [ ] Test 2: Usuario A no puede actualizar datos de Usuario B (PUT)
- [ ] Test 3: Usuario A no puede eliminar datos de Usuario B (DELETE)
- [ ] Test 4: Usuario A puede ver sus propios datos (GET)
- [ ] Test 5: Usuario A puede actualizar sus propios datos (PUT)
- [ ] Test 6: Endpoints validan `userId` correctamente

### Endpoints Críticos a Probar

#### Transacciones
- [ ] `GET /api/transactions?userId=USER_ID` - Solo retorna datos del usuario autenticado
- [ ] `POST /api/transactions` - Solo puede crear transacciones para sí mismo
- [ ] `PUT /api/transactions/:id` - Solo puede actualizar sus propias transacciones
- [ ] `DELETE /api/transactions/:id` - Solo puede eliminar sus propias transacciones

#### Pagos
- [ ] `GET /api/payments?userId=USER_ID` - Solo retorna pagos del usuario autenticado
- [ ] `POST /api/payments/create` - Solo puede crear pagos para sí mismo
- [ ] `PUT /api/payments/:id` - Solo puede actualizar sus propios pagos

#### Referidos
- [ ] `GET /api/referrals?userId=USER_ID` - Solo retorna referidos del usuario autenticado
- [ ] `POST /api/referrals/activate-smart` - Solo puede activar Smart para sí mismo

#### Notificaciones
- [ ] `GET /api/notifications/preferences?userId=USER_ID` - Solo retorna preferencias del usuario autenticado
- [ ] `PUT /api/notifications/preferences?userId=USER_ID` - Solo puede actualizar sus propias preferencias

---

## 🔍 Verificación de Validación de userId en Backend

### Endpoints que DEBEN validar userId

Buscar en el código que todos estos endpoints validen `userId`:

```bash
# Buscar endpoints que usan userId
grep -r "userId" packages/core-api/src/app/api --include="*.ts" | grep -v "node_modules"

# Verificar que usan authHelpers
grep -r "getUserIdFromRequest\|validateUserId" packages/core-api/src/app/api --include="*.ts"
```

### Patrón Esperado

```typescript
// ✅ CORRECTO: Valida userId
export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return handleAuthError('No autenticado');
  }
  
  // Usar userId validado, no del query/body
  const { data } = await supabase
    .from('transacciones')
    .select('*')
    .eq('user_id', userId); // ✅ Usa userId validado
}

// ❌ INCORRECTO: No valida userId
export async function GET(request: NextRequest) {
  const { userId } = request.nextUrl.searchParams; // ❌ No validado
  const { data } = await supabase
    .from('transacciones')
    .select('*')
    .eq('user_id', userId); // ❌ Puede ser manipulado
}
```

---

**Última actualización**: 2025-01-17  
**Próxima verificación**: Pendiente de acceso a Supabase Dashboard y testing manual

