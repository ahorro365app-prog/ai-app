# 🧪 Plan de Testing Manual - Error Handling

**Fecha**: 2025-01-17  
**Estado**: Listo para ejecutar cuando el servidor esté corriendo  
**Versión**: 1.0

---

## 📋 Objetivo

Verificar que todos los endpoints de Core API manejan errores correctamente y retornan mensajes genéricos en producción, sin exponer detalles internos.

---

## ✅ Pre-requisitos

1. **Servidor de desarrollo corriendo**:
   ```bash
   cd packages/core-api
   npm run dev
   ```

2. **Variables de entorno configuradas**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production` (para probar mensajes genéricos)

3. **Herramientas**:
   - `curl` o `Postman` o `Thunder Client` (extensión VS Code)
   - Navegador con DevTools abierto

---

## 🎯 Tests a Ejecutar

### 1. Tests de Validación (400 Bad Request)

#### 1.1. Endpoint: `POST /api/notifications/register-token`
**Test**: Enviar request sin `token`
```bash
curl -X POST http://localhost:3000/api/notifications/register-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "123e4567-e89b-12d3-a456-426614174000"}'
```
**Resultado esperado**:
- Status: `400`
- Mensaje: "Token FCM requerido" (genérico)
- NO debe exponer detalles internos

#### 1.2. Endpoint: `POST /api/referrals/validate-code`
**Test**: Enviar código inválido (menos de 8 caracteres)
```bash
curl -X POST http://localhost:3000/api/referrals/validate-code \
  -H "Content-Type: application/json" \
  -d '{"code": "ABC123"}'
```
**Resultado esperado**:
- Status: `400`
- Mensaje: "El código debe tener 8 caracteres"
- NO debe exponer detalles internos

#### 1.3. Endpoint: `POST /api/whatsapp/verify-code`
**Test**: Enviar código expirado o inválido
```bash
curl -X POST http://localhost:3000/api/whatsapp/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+59112345678", "code": "000000"}'
```
**Resultado esperado**:
- Status: `400`
- Mensaje: "Código inválido o expirado"
- NO debe exponer detalles internos

---

### 2. Tests de Autenticación (401 Unauthorized)

#### 2.1. Endpoint: `POST /api/notifications/campaigns/run`
**Test**: Enviar request sin token de autorización (si `NOTIFICATIONS_CRON_SECRET` está configurado)
```bash
curl -X POST http://localhost:3000/api/notifications/campaigns/run
```
**Resultado esperado**:
- Status: `401`
- Mensaje: "No autorizado" (genérico)
- NO debe exponer detalles del secret

---

### 3. Tests de Recurso No Encontrado (404 Not Found)

#### 3.1. Endpoint: `GET /api/admin/app-versions/[id]`
**Test**: Buscar versión inexistente
```bash
curl -X GET http://localhost:3000/api/admin/app-versions/00000000-0000-0000-0000-000000000000
```
**Resultado esperado**:
- Status: `404`
- Mensaje: "Campaña no encontrada" o similar (genérico)
- NO debe exponer detalles de la base de datos

#### 3.2. Endpoint: `GET /api/notifications/templates/[id]`
**Test**: Buscar template inexistente
```bash
curl -X GET http://localhost:3000/api/notifications/templates/00000000-0000-0000-0000-000000000000
```
**Resultado esperado**:
- Status: `404`
- Mensaje: "Template no encontrado"
- NO debe exponer detalles internos

---

### 4. Tests de Errores de Base de Datos (500 Internal Server Error)

#### 4.1. Endpoint: `POST /api/notifications/send`
**Test**: Enviar request con `userId` inválido (UUID mal formado)
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "invalid-uuid", "title": "Test", "body": "Test"}'
```
**Resultado esperado**:
- Status: `500` o `400` (dependiendo de validación)
- Mensaje genérico: "Error al procesar la solicitud" o similar
- NO debe exponer:
  - Mensajes de error de Supabase
  - Stack traces
  - Códigos de error internos
  - Detalles de la base de datos

#### 4.2. Endpoint: `GET /api/notifications/logs`
**Test**: Simular error de base de datos (desconectar Supabase temporalmente)
```bash
# Primero desconectar Supabase, luego:
curl -X GET http://localhost:3000/api/notifications/logs
```
**Resultado esperado**:
- Status: `500`
- Mensaje genérico: "Error obteniendo historial" o "Error interno"
- NO debe exponer:
  - Mensajes de conexión
  - Detalles de la base de datos
  - Stack traces

---

### 5. Tests de Errores de API Externa (502 Bad Gateway)

#### 5.1. Endpoint: `POST /api/process-expense`
**Test**: Enviar request sin `ANTHROPIC_API_KEY` configurado
```bash
# Temporalmente deshabilitar ANTHROPIC_API_KEY, luego:
curl -X POST http://localhost:3000/api/process-expense \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Gasté 50 pesos en comida"}'
```
**Resultado esperado**:
- Status: `500` o `502`
- Mensaje genérico: "Error de configuración del servidor" o "Error al procesar el gasto"
- NO debe exponer:
  - Que falta `ANTHROPIC_API_KEY`
  - Detalles de configuración

---

### 6. Verificación de Mensajes en Producción vs Desarrollo

#### 6.1. Comparar respuestas en diferentes entornos

**En desarrollo** (`NODE_ENV=development`):
```bash
NODE_ENV=development npm run dev
# Luego hacer un request que cause error
```
**Resultado esperado**:
- Incluye `details` con información adicional
- Puede incluir `stack`, `code`, `originalMessage`

**En producción** (`NODE_ENV=production`):
```bash
NODE_ENV=production npm run dev
# Luego hacer el mismo request
```
**Resultado esperado**:
- NO incluye `details`
- Solo mensaje genérico
- NO expone información interna

---

## 📊 Checklist de Verificación

Para cada test, verificar:

- [ ] **Status code correcto** (400, 401, 404, 500, etc.)
- [ ] **Mensaje genérico** (no expone detalles internos)
- [ ] **NO expone**:
  - [ ] Stack traces
  - [ ] Mensajes de error de base de datos
  - [ ] Códigos de error internos
  - [ ] Detalles de configuración
  - [ ] Información sensible
- [ ] **Estructura de respuesta consistente**:
  ```json
  {
    "success": false,
    "error": "Mensaje genérico",
    "type": "ERROR_TYPE"
  }
  ```
- [ ] **En producción**: NO incluye campo `details`
- [ ] **En desarrollo**: Puede incluir campo `details` (opcional)

---

## 🔍 Verificación de Logs

Después de cada test, verificar los logs del servidor:

1. **Los errores completos deben loggearse** (para debugging interno)
2. **Los logs NO deben exponerse** al cliente
3. **Los logs deben incluir**:
   - Tipo de error
   - Mensaje
   - Detalles (solo en logs, no en respuesta)

---

## 📝 Template de Reporte

Para cada endpoint probado, documentar:

```markdown
### Endpoint: [NOMBRE]
**Test**: [DESCRIPCIÓN]
**Request**: [COMANDO CURL]
**Resultado**:
- Status: [CÓDIGO]
- Mensaje: [MENSAJE]
- Expone detalles: [SÍ/NO]
- Logs: [VERIFICADO]
**Estado**: ✅ PASS / ❌ FAIL
```

---

## 🚨 Errores Comunes a Verificar

1. **Stack traces expuestos**: Verificar que no aparecen en la respuesta
2. **Mensajes de Supabase**: Verificar que no se exponen mensajes como "relation does not exist"
3. **Códigos de error**: Verificar que no se exponen códigos como "P2002", "PGRST116"
4. **Detalles de configuración**: Verificar que no se exponen nombres de variables de entorno
5. **Información sensible**: Verificar que no se exponen IDs internos, paths de archivos, etc.

---

## ✅ Criterios de Éxito

Todos los tests deben pasar si:

1. ✅ Todos los endpoints retornan mensajes genéricos en producción
2. ✅ No se exponen detalles internos en producción
3. ✅ Los errores se loggean correctamente (para debugging)
4. ✅ La estructura de respuesta es consistente
5. ✅ Los status codes son apropiados

---

## 📚 Referencias

- `packages/core-api/src/lib/errorHandler.ts` - Implementación del error handler
- `packages/core-api/ERROR_HANDLING_FASES.md` - Endpoints actualizados
- `SEGURIDAD_ESTADO_ACTUAL.md` - Estado general de seguridad

---

**Última actualización**: 2025-01-17

