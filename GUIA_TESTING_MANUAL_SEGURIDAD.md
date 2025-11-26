# 🧪 Guía de Testing Manual de Seguridad

**Fecha de creación**: 2025-01-17  
**Versión**: 1.0  
**Estado**: Listo para ejecutar

---

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación del Entorno](#preparación-del-entorno)
3. [Tests de Rate Limiting](#tests-de-rate-limiting)
4. [Tests de CSRF Protection](#tests-de-csrf-protection)
5. [Tests de Validación de Inputs](#tests-de-validación-de-inputs)
6. [Tests de Security Headers](#tests-de-security-headers)
7. [Tests de Error Handling](#tests-de-error-handling)
8. [Tests de Autenticación](#tests-de-autenticación)
9. [Registro de Resultados](#registro-de-resultados)

---

## 🔧 Requisitos Previos

### Software Necesario

- ✅ Node.js instalado
- ✅ Servidor de desarrollo corriendo (`npm run dev`)
- ✅ Herramientas de desarrollo del navegador (Chrome DevTools, Firefox DevTools)
- ✅ `curl` o Postman para pruebas de API
- ✅ Acceso a Supabase Dashboard (para verificar logs)

### Variables de Entorno

Asegúrate de tener configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_API_URL` (o `CAPACITOR_SERVER_URL`)

---

## 🚀 Preparación del Entorno

### 1. Iniciar Servidores

```bash
# Terminal 1: App Principal
cd .
npm run dev
# Debe estar corriendo en http://localhost:3000

# Terminal 2: Core API (si está separado)
cd packages/core-api
npm run dev
# Debe estar corriendo en http://localhost:3001 (o el puerto configurado)
```

### 2. Verificar que los Servidores Están Corriendo

```bash
# Verificar App Principal
curl http://localhost:3000

# Verificar Core API
curl http://localhost:3001/api/health
# O el endpoint de health que tengas configurado
```

---

## 🚦 Tests de Rate Limiting

### Test 1: Rate Limiting en Login

**Objetivo**: Verificar que el sistema bloquea múltiples intentos de login fallidos.

**Pasos**:
1. Abre las herramientas de desarrollo del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login con credenciales incorrectas **más de 5 veces** en menos de 1 minuto
4. Observa las respuestas HTTP

**Resultado Esperado**:
- ✅ Las primeras 5 solicitudes retornan `401 Unauthorized`
- ✅ La 6ta solicitud retorna `429 Too Many Requests`
- ✅ El header `Retry-After` está presente en la respuesta 429
- ✅ El mensaje de error es genérico: "Demasiadas solicitudes. Por favor, intenta más tarde."

**Comando curl** (para automatizar):
```bash
# Hacer 10 intentos de login fallidos rápidamente
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n" \
    -s
  sleep 0.5
done
```

**Registro**:
- [ ] Test 1.1: Rate limiting funciona en login
- [ ] Status codes correctos (401 → 429)
- [ ] Header Retry-After presente
- [ ] Mensaje genérico en producción

---

### Test 2: Rate Limiting en Procesamiento de Audio

**Objetivo**: Verificar que el procesamiento de audio tiene rate limiting.

**Pasos**:
1. Prepara un archivo de audio de prueba
2. Intenta procesar el mismo audio **más de 3 veces** en menos de 1 minuto
3. Observa las respuestas

**Resultado Esperado**:
- ✅ Las primeras 3 solicitudes procesan correctamente
- ✅ La 4ta solicitud retorna `429 Too Many Requests`

**Comando curl**:
```bash
# Hacer 5 solicitudes de procesamiento de audio
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/audio/process \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"audio":"base64encoded..."}' \
    -w "\nStatus: %{http_code}\n" \
    -s
  sleep 0.3
done
```

**Registro**:
- [ ] Test 2.1: Rate limiting funciona en procesamiento de audio
- [ ] Límite correcto (3 solicitudes/minuto)
- [ ] Mensaje genérico en producción

---

### Test 3: Rate Limiting en Notificaciones

**Objetivo**: Verificar rate limiting en envío de notificaciones.

**Pasos**:
1. Intenta enviar notificaciones **más de 10 veces** en menos de 1 minuto
2. Observa las respuestas

**Resultado Esperado**:
- ✅ Las primeras 10 solicitudes procesan correctamente
- ✅ La 11va solicitud retorna `429 Too Many Requests`

**Registro**:
- [ ] Test 3.1: Rate limiting funciona en notificaciones
- [ ] Límite correcto (10 solicitudes/minuto)
- [ ] Mensaje genérico en producción

---

## 🛡️ Tests de CSRF Protection

### Test 4: CSRF Token Requerido

**Objetivo**: Verificar que los endpoints protegidos requieren CSRF token.

**Pasos**:
1. Intenta hacer una solicitud `POST` a un endpoint protegido **sin** incluir el CSRF token
2. Observa la respuesta

**Resultado Esperado**:
- ✅ La solicitud retorna `403 Forbidden`
- ✅ El mensaje indica que falta el CSRF token
- ✅ El mensaje es genérico en producción

**Comando curl**:
```bash
# Intentar crear un pago sin CSRF token
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":100,"description":"Test"}' \
  -w "\nStatus: %{http_code}\n" \
  -s
```

**Registro**:
- [ ] Test 4.1: CSRF protection funciona en POST
- [ ] Test 4.2: CSRF protection funciona en PUT
- [ ] Test 4.3: CSRF protection funciona en DELETE
- [ ] Status code 403 correcto
- [ ] Mensaje genérico en producción

---

### Test 5: CSRF Token Inválido

**Objetivo**: Verificar que un CSRF token inválido es rechazado.

**Pasos**:
1. Intenta hacer una solicitud con un CSRF token **inválido** o **expirado**
2. Observa la respuesta

**Resultado Esperado**:
- ✅ La solicitud retorna `403 Forbidden`
- ✅ El mensaje indica que el CSRF token es inválido
- ✅ El mensaje es genérico en producción

**Registro**:
- [ ] Test 5.1: CSRF token inválido es rechazado
- [ ] Mensaje genérico en producción

---

## ✅ Tests de Validación de Inputs

### Test 6: Inputs Maliciosos - SQL Injection

**Objetivo**: Verificar que el sistema rechaza intentos de SQL injection.

**Pasos**:
1. Intenta enviar datos con caracteres SQL maliciosos en campos de texto
2. Observa las respuestas

**Payloads de Prueba**:
```json
{
  "email": "test@test.com'; DROP TABLE usuarios; --",
  "description": "'; DELETE FROM transacciones; --",
  "amount": "100'; UPDATE usuarios SET saldo = 999999; --"
}
```

**Resultado Esperado**:
- ✅ La solicitud retorna `400 Bad Request`
- ✅ El mensaje indica que los datos no son válidos
- ✅ **NO se ejecuta ninguna query SQL maliciosa**
- ✅ El mensaje es genérico (no expone detalles del error SQL)

**Comando curl**:
```bash
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":"100'\''; DROP TABLE usuarios; --","description":"Test"}' \
  -w "\nStatus: %{http_code}\n" \
  -s
```

**Registro**:
- [ ] Test 6.1: SQL injection en email rechazado
- [ ] Test 6.2: SQL injection en description rechazado
- [ ] Test 6.3: SQL injection en amount rechazado
- [ ] No se ejecuta SQL malicioso
- [ ] Mensaje genérico en producción

---

### Test 7: Inputs Maliciosos - XSS

**Objetivo**: Verificar que el sistema sanitiza o rechaza scripts XSS.

**Payloads de Prueba**:
```json
{
  "description": "<script>alert('XSS')</script>",
  "title": "<img src=x onerror=alert('XSS')>",
  "body": "javascript:alert('XSS')"
}
```

**Resultado Esperado**:
- ✅ La solicitud retorna `400 Bad Request` o procesa el input sanitizado
- ✅ Si se guarda, el contenido está sanitizado (sin tags `<script>`)
- ✅ El mensaje es genérico

**Registro**:
- [ ] Test 7.1: XSS en description rechazado/sanitizado
- [ ] Test 7.2: XSS en title rechazado/sanitizado
- [ ] Test 7.3: XSS en body rechazado/sanitizado
- [ ] Contenido sanitizado si se guarda
- [ ] Mensaje genérico en producción

---

### Test 8: Inputs Maliciosos - Validación de Tipos

**Objetivo**: Verificar que el sistema valida tipos de datos correctamente.

**Payloads de Prueba**:
```json
{
  "amount": "not a number",
  "userId": 12345,  // Debe ser UUID
  "email": "not-an-email",
  "phone": "invalid-phone"
}
```

**Resultado Esperado**:
- ✅ La solicitud retorna `400 Bad Request`
- ✅ El mensaje indica qué campos son inválidos
- ✅ El mensaje es genérico (no expone detalles internos de validación)

**Registro**:
- [ ] Test 8.1: Tipo incorrecto en amount rechazado
- [ ] Test 8.2: UUID inválido rechazado
- [ ] Test 8.3: Email inválido rechazado
- [ ] Test 8.4: Teléfono inválido rechazado
- [ ] Mensaje genérico en producción

---

## 🔒 Tests de Security Headers

### Test 9: Verificar Security Headers en Respuestas

**Objetivo**: Verificar que todas las respuestas incluyen security headers.

**Pasos**:
1. Abre las herramientas de desarrollo del navegador (F12)
2. Ve a la pestaña "Network"
3. Realiza cualquier solicitud (GET, POST, etc.)
4. Inspecciona los headers de la respuesta

**Headers Esperados**:
- ✅ `Content-Security-Policy` presente
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy` presente
- ✅ `Permissions-Policy` presente
- ✅ `Strict-Transport-Security` presente (solo en producción con HTTPS)

**Comando curl**:
```bash
# Verificar headers en respuesta
curl -I http://localhost:3000 \
  -H "Accept: text/html"

# Verificar headers en API
curl -I http://localhost:3001/api/health \
  -H "Accept: application/json"
```

**Registro**:
- [ ] Test 9.1: Security headers presentes en App Principal
- [ ] Test 9.2: Security headers presentes en Core API
- [ ] Test 9.3: CSP configurado correctamente
- [ ] Test 9.4: X-Frame-Options configurado
- [ ] Test 9.5: HSTS presente (solo en producción)

---

## 🚨 Tests de Error Handling

### Test 10: Errores Genéricos en Producción

**Objetivo**: Verificar que los errores no exponen detalles internos en producción.

**Pasos**:
1. Configura `NODE_ENV=production` (o usa el modo producción)
2. Provoca errores intencionalmente (datos inválidos, endpoints inexistentes, etc.)
3. Observa las respuestas de error

**Resultado Esperado**:
- ✅ Los mensajes de error son genéricos
- ✅ **NO se exponen**:
  - Stack traces
  - Códigos de error internos
  - Detalles de base de datos
  - Rutas de archivos
  - Variables de entorno
- ✅ Solo se muestra el tipo de error y mensaje genérico

**Comando curl**:
```bash
# Provocar error 404
curl http://localhost:3001/api/endpoint-inexistente \
  -w "\nStatus: %{http_code}\n" \
  -s

# Provocar error 500 (si es posible)
curl -X POST http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n" \
  -s
```

**Registro**:
- [ ] Test 10.1: Errores 400 genéricos
- [ ] Test 10.2: Errores 404 genéricos
- [ ] Test 10.3: Errores 500 genéricos
- [ ] No se exponen stack traces
- [ ] No se exponen detalles internos
- [ ] Mensajes genéricos en producción

---

### Test 11: Errores con Detalles en Desarrollo

**Objetivo**: Verificar que en desarrollo SÍ se muestran detalles (para debugging).

**Pasos**:
1. Configura `NODE_ENV=development`
2. Provoca errores intencionalmente
3. Observa las respuestas de error

**Resultado Esperado**:
- ✅ Los mensajes de error incluyen detalles
- ✅ Se muestran:
  - Stack traces (opcional)
  - Códigos de error
  - Detalles de validación
- ✅ Esto es **solo en desarrollo**, no en producción

**Registro**:
- [ ] Test 11.1: Errores con detalles en desarrollo
- [ ] Detalles solo visibles en desarrollo
- [ ] Producción sigue siendo genérica

---

## 🔐 Tests de Autenticación

### Test 12: Endpoints Protegidos Requieren Autenticación

**Objetivo**: Verificar que los endpoints protegidos requieren autenticación.

**Pasos**:
1. Intenta acceder a un endpoint protegido **sin** token de autenticación
2. Observa la respuesta

**Resultado Esperado**:
- ✅ La solicitud retorna `401 Unauthorized`
- ✅ El mensaje indica que se requiere autenticación
- ✅ El mensaje es genérico

**Comando curl**:
```bash
# Intentar acceder sin token
curl http://localhost:3001/api/payments/create \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s
```

**Registro**:
- [ ] Test 12.1: Endpoints protegidos requieren auth
- [ ] Status code 401 correcto
- [ ] Mensaje genérico en producción

---

### Test 13: Token Inválido o Expirado

**Objetivo**: Verificar que tokens inválidos o expirados son rechazados.

**Pasos**:
1. Intenta acceder con un token **inválido** o **expirado**
2. Observa la respuesta

**Resultado Esperado**:
- ✅ La solicitud retorna `401 Unauthorized`
- ✅ El mensaje indica que el token es inválido
- ✅ El mensaje es genérico

**Comando curl**:
```bash
# Intentar con token inválido
curl http://localhost:3001/api/payments/create \
  -H "Authorization: Bearer invalid-token-12345" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s
```

**Registro**:
- [ ] Test 13.1: Token inválido rechazado
- [ ] Test 13.2: Token expirado rechazado
- [ ] Mensaje genérico en producción

---

## 📊 Registro de Resultados

### Plantilla de Registro

Crea un archivo `TESTING_MANUAL_RESULTADOS_[FECHA].md` con el siguiente formato:

```markdown
# Resultados de Testing Manual de Seguridad

**Fecha**: 2025-01-17
**Ejecutado por**: [Tu nombre]
**Entorno**: Desarrollo / Producción

## Resumen
- Total de tests: 13
- Tests pasados: X
- Tests fallidos: Y
- Tests pendientes: Z

## Resultados Detallados

### Rate Limiting
- [ ] Test 1.1: Login - ✅ / ❌
- [ ] Test 2.1: Audio - ✅ / ❌
- [ ] Test 3.1: Notificaciones - ✅ / ❌

### CSRF Protection
- [ ] Test 4.1-4.3: CSRF requerido - ✅ / ❌
- [ ] Test 5.1: CSRF inválido - ✅ / ❌

### Validación de Inputs
- [ ] Test 6.1-6.3: SQL Injection - ✅ / ❌
- [ ] Test 7.1-7.3: XSS - ✅ / ❌
- [ ] Test 8.1-8.4: Tipos de datos - ✅ / ❌

### Security Headers
- [ ] Test 9.1-9.5: Headers presentes - ✅ / ❌

### Error Handling
- [ ] Test 10.1-10.3: Errores genéricos - ✅ / ❌
- [ ] Test 11.1: Detalles en desarrollo - ✅ / ❌

### Autenticación
- [ ] Test 12.1: Auth requerida - ✅ / ❌
- [ ] Test 13.1-13.2: Token inválido - ✅ / ❌

## Problemas Encontrados

[Lista de problemas encontrados con detalles]

## Recomendaciones

[Recomendaciones para mejorar la seguridad]
```

---

## 🔄 Proceso de Testing

### Orden Recomendado

1. **Preparación** (5 min)
   - Iniciar servidores
   - Verificar que están corriendo
   - Configurar herramientas

2. **Tests Básicos** (15 min)
   - Security Headers
   - Error Handling
   - Autenticación

3. **Tests de Protección** (30 min)
   - Rate Limiting
   - CSRF Protection
   - Validación de Inputs

4. **Registro y Documentación** (10 min)
   - Documentar resultados
   - Reportar problemas
   - Crear recomendaciones

**Tiempo total estimado**: ~1 hora

---

## ⚠️ Notas Importantes

1. **No ejecutar tests destructivos en producción**: Algunos tests pueden intentar modificar datos. Asegúrate de estar en un entorno de desarrollo o staging.

2. **Backup antes de testing**: Si vas a probar con datos reales, haz un backup primero.

3. **Documentar todo**: Registra todos los resultados, incluso los que pasan, para tener un historial completo.

4. **Repetir periódicamente**: El testing de seguridad debe ser periódico, especialmente después de cambios importantes.

---

## 📚 Referencias

- `SEGURIDAD_ESTADO_ACTUAL.md` - Estado general de seguridad
- `packages/core-api/src/lib/errorHandler.ts` - Implementación de error handling
- `packages/core-api/src/lib/rateLimit.ts` - Implementación de rate limiting
- `packages/core-api/src/lib/csrf.ts` - Implementación de CSRF protection

---

**Última actualización**: 2025-01-17  
**Próxima revisión**: Después de cada cambio importante en seguridad

