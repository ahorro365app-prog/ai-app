# ✅ FASE 2.1: CSRF PROTECTION - COMPLETADO

**Fecha**: 2025  
**Tiempo estimado**: 1 hora  
**Tiempo real**: ~1 hora  
**Estado**: ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha implementado protección CSRF completa para todos los endpoints que modifican datos (POST, PUT, DELETE). Los tokens CSRF se generan en el servidor, se almacenan en cookies HttpOnly, y se validan en cada request.

---

## 🔧 CAMBIOS REALIZADOS

### 1. Sistema CSRF Creado
- ✅ `src/lib/csrf.ts` - Sistema de CSRF para app principal
- ✅ `admin-dashboard/src/lib/csrf.ts` - Sistema de CSRF para admin
- ✅ `src/lib/csrf-client.ts` - Helper para frontend
- ✅ `admin-dashboard/src/lib/csrf-client.ts` - Helper para frontend admin

### 2. Endpoints CSRF
- ✅ `GET /api/csrf-token` - Obtiene/genera token CSRF
- ✅ `GET /api/csrf-token` (admin) - Obtiene/genera token CSRF

### 3. Endpoints Protegidos con CSRF

#### App Principal
- ✅ `/api/payments/create` - Crear pago
- ✅ `/api/audio/process` - Procesar audio
- ✅ `/api/feedback/confirm` - Confirmar feedback
- ✅ `/api/payments/upload-receipt` - Subir comprobante

#### Admin Dashboard
- ✅ `/api/auth/simple-login` - Login admin

**Total**: 5 endpoints protegidos

---

## 🔐 SEGURIDAD IMPLEMENTADA

### Características de Seguridad

1. **Tokens Aleatorios y Seguros**
   - Generados con `crypto.randomBytes(32)`
   - 64 caracteres hexadecimales
   - Imposible de predecir

2. **Cookies HttpOnly**
   - No accesibles desde JavaScript
   - Previene robo de tokens vía XSS
   - `sameSite: 'strict'` para protección adicional

3. **Validación Timing-Safe**
   - Comparación de tokens con `crypto.timingSafeEqual`
   - Previene ataques de timing

4. **Múltiples Fuentes de Token**
   - Header: `x-csrf-token`
   - Body JSON: `csrfToken`
   - FormData: `csrfToken`

5. **Expiración de Tokens**
   - Tokens válidos por 24 horas
   - Se regeneran automáticamente si expiran

---

## 📝 USO DEL SISTEMA CSRF

### En el Backend

```typescript
import { requireCSRF } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  // Validar CSRF token
  const csrfError = await requireCSRF(req);
  if (csrfError) {
    return csrfError; // Retorna 403 si el token es inválido
  }

  // Tu código aquí...
}
```

### En el Frontend (Opción 1: Helper Automático)

```typescript
import { fetchWithCSRF } from '@/lib/csrf-client';

// Para requests JSON
const response = await fetchWithCSRF('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan: 'pro', monto_usdt: 10 }),
});

// Para requests con FormData
import { fetchFormDataWithCSRF } from '@/lib/csrf-client';

const formData = new FormData();
formData.append('file', file);
const response = await fetchFormDataWithCSRF('/api/payments/upload-receipt', formData);
```

### En el Frontend (Opción 2: Manual)

```typescript
import { getCSRFToken } from '@/lib/csrf-client';

// Obtener token
const token = await getCSRFToken();

// Incluir en header
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  },
  body: JSON.stringify({ plan: 'pro', monto_usdt: 10 }),
});

// O incluir en body
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    plan: 'pro', 
    monto_usdt: 10,
    csrfToken: token,
  }),
});
```

---

## 🛡️ PROTECCIONES IMPLEMENTADAS

### Ataques Prevenidos

1. **Cross-Site Request Forgery (CSRF)**
   - ✅ Tokens únicos por sesión
   - ✅ Validación en cada request
   - ✅ Cookies HttpOnly

2. **Token Theft**
   - ✅ Cookies HttpOnly (no accesibles desde JS)
   - ✅ SameSite Strict (no se envían en cross-site)
   - ✅ Secure en producción (solo HTTPS)

3. **Timing Attacks**
   - ✅ Comparación timing-safe
   - ✅ No expone información sobre tokens válidos

---

## 📊 ENDPOINTS PROTEGIDOS

| Endpoint | Método | CSRF | Estado |
|----------|--------|------|--------|
| `/api/payments/create` | POST | ✅ | Protegido |
| `/api/audio/process` | POST | ✅ | Protegido |
| `/api/feedback/confirm` | POST | ✅ | Protegido |
| `/api/payments/upload-receipt` | POST | ✅ | Protegido |
| `/api/auth/simple-login` | POST | ✅ | Protegido |

---

## ✅ VERIFICACIÓN

### Test 1: Obtener Token CSRF
```bash
curl http://localhost:3000/api/csrf-token
```

**Resultado Esperado**: 
```json
{
  "success": true,
  "csrfToken": "abc123..."
}
```
Y cookie `csrf-token` establecida

### Test 2: Request sin Token CSRF
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"plan": "pro", "monto_usdt": 10}'
```

**Resultado Esperado**: 403 Forbidden
```json
{
  "success": false,
  "error": "Token CSRF inválido o faltante",
  "message": "Token CSRF no encontrado en la request"
}
```

### Test 3: Request con Token CSRF Válido
```bash
# 1. Obtener token
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

# 2. Hacer request con token
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -H "Cookie: csrf-token=$TOKEN" \
  -d '{"plan": "pro", "monto_usdt": 10}'
```

**Resultado Esperado**: 200 OK (si otros validadores pasan)

---

## 🎯 PRÓXIMOS PASOS

Después de completar esta tarea, continúa con:

1. **2.2 Security Headers** (1h)
2. **2.3 Content Security Policy** (1h)
3. **Aplicar CSRF a formularios del frontend** (opcional, gradual)

---

## ✅ CHECKLIST

- [x] Sistema CSRF creado
- [x] Endpoint para obtener tokens
- [x] Validación en endpoints críticos
- [x] Helper para frontend
- [x] Documentación creada
- [ ] Aplicar a formularios del frontend (opcional)

---

## 📚 REFERENCIAS

- `src/lib/csrf.ts` - Sistema CSRF backend
- `src/lib/csrf-client.ts` - Helper frontend
- `src/app/api/csrf-token/route.ts` - Endpoint de tokens
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## 💡 MEJORES PRÁCTICAS

1. **Siempre usa `requireCSRF`** en endpoints POST/PUT/DELETE
2. **Usa `fetchWithCSRF`** en el frontend para requests automáticos
3. **No expongas tokens** en logs o respuestas de error
4. **Regenera tokens** periódicamente (cada 24h)
5. **Usa cookies HttpOnly** siempre

---

## ⚠️ NOTAS IMPORTANTES

1. **Webhooks**: Los webhooks de WhatsApp/Baileys NO requieren CSRF porque vienen de servidores externos. Se validan con otros métodos (firma, tokens, etc.)

2. **GET Requests**: Los métodos GET, HEAD, OPTIONS NO requieren CSRF porque no modifican datos

3. **FormData**: Cuando uses formData, el token CSRF debe incluirse en el formData, no en headers

---

**Estado final**: ✅ **COMPLETADO** - Protección CSRF implementada

