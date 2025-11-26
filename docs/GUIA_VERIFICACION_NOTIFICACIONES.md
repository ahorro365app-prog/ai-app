# 🔍 GUÍA DE VERIFICACIÓN - NOTIFICACIONES FIREBASE

**Fecha**: 2025-01-XX  
**Propósito**: Verificar que las notificaciones Firebase se estén enviando correctamente

---

## ✅ HERRAMIENTAS CREADAS

### 1. Página de Prueba Visual
**URL**: `http://localhost:3000/test-notifications`

**Funcionalidades**:
- ✅ Verifica configuración de Firebase
- ✅ Muestra estado de variables de entorno
- ✅ Lista tokens FCM activos
- ✅ Muestra logs recientes
- ✅ Permite enviar notificación de prueba

### 2. Endpoints de Prueba

#### GET `/api/notifications/test-firebase`
Verifica toda la configuración de Firebase:
- Variables de entorno
- Inicialización de Firebase Admin
- Instancia de messaging
- Tokens FCM activos
- Logs recientes
- Preferencias de usuarios

**Ejemplo de uso**:
```bash
curl http://localhost:3000/api/notifications/test-firebase
```

#### POST `/api/notifications/test-send`
Envía una notificación de prueba.

**Body opcional**:
```json
{
  "userId": "uuid-del-usuario",  // Opcional
  "token": "fcm-token"            // Opcional
}
```

Si no se proporciona `userId` ni `token`, usa el primer token activo disponible.

**Ejemplo de uso**:
```bash
curl -X POST http://localhost:3000/api/notifications/test-send \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📋 PASOS PARA VERIFICAR

### Paso 1: Verificar Configuración

1. Abre `http://localhost:3000/test-notifications`
2. Haz clic en **"Verificar Configuración"**
3. Revisa los resultados:

#### ✅ Debe mostrar:
- ✅ Variables de entorno: Todas configuradas
- ✅ Firebase Admin SDK: Inicializado
- ✅ Instancia de Messaging: Disponible
- ✅ Tokens FCM Activos: Al menos 1 token
- ✅ Logs Recientes: Historial disponible

#### ⚠️ Si hay problemas:
- **Variables faltantes**: Agregar al `.env.local`
- **Firebase Admin no inicializado**: Verificar `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **No hay tokens**: Un usuario debe iniciar sesión y aceptar permisos de notificaciones

### Paso 2: Enviar Notificación de Prueba

1. Si la verificación pasó, haz clic en **"Enviar Notificación de Prueba"**
2. Deberías ver:
   - ✅ Mensaje de éxito
   - ✅ Notificación push en el navegador/dispositivo
   - ✅ Log en `notification_logs` en Supabase

### Paso 3: Verificar en Supabase

Ejecuta esta consulta en Supabase SQL Editor:

```sql
-- Ver logs recientes
SELECT 
  id,
  title,
  body,
  status,
  sent_at,
  error_message
FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Ver tokens activos
SELECT 
  id,
  user_id,
  device_type,
  is_active,
  created_at,
  last_used_at
FROM fcm_tokens
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 VERIFICACIÓN MANUAL

### 1. Verificar Variables de Entorno

**En `.env.local` (raíz del proyecto)**:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx
NEXT_PUBLIC_FIREBASE_VAPID_KEY=xxxxx  # ⚠️ CRÍTICO
FIREBASE_PROJECT_ID=xxxxx              # ⚠️ Para servidor
FIREBASE_CLIENT_EMAIL=xxxxx            # ⚠️ Para servidor
FIREBASE_PRIVATE_KEY="-----BEGIN..."   # ⚠️ Para servidor
```

**En `packages/core-api/.env.local`** (si existe):
```bash
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN..."
```

### 2. Verificar que un Usuario Tenga Token

1. Inicia sesión en la app
2. Acepta permisos de notificaciones cuando se solicite
3. Verifica en Supabase que el token se guardó:
```sql
SELECT * FROM fcm_tokens 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 1;
```

### 3. Enviar desde Panel Admin

1. Ve a `http://localhost:3001/notifications` (panel admin)
2. Selecciona un usuario o token
3. Escribe título y mensaje
4. Haz clic en "Enviar"
5. Verifica que llegue la notificación

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "Firebase Admin no inicializado"

**Causa**: Faltan variables de entorno del servidor

**Solución**:
1. Verificar que existan en `.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
2. Reiniciar el servidor después de agregar variables

### Problema: "No hay tokens FCM activos"

**Causa**: Ningún usuario ha aceptado permisos de notificaciones

**Solución**:
1. Iniciar sesión en la app
2. Aceptar permisos cuando se solicite
3. Verificar en Supabase que el token se guardó

### Problema: "Notificación no llega"

**Verificaciones**:
1. ✅ Token está activo en `fcm_tokens`
2. ✅ Usuario tiene `push_enabled = true` en `notification_preferences`
3. ✅ No está en quiet hours
4. ✅ Revisar logs en `notification_logs` para ver errores
5. ✅ Verificar consola del navegador para errores de Firebase
6. ✅ Verificar permisos del navegador (Chrome: `chrome://settings/content/notifications`)

### Problema: "Error: messaging/registration-token-not-registered"

**Causa**: Token FCM inválido o expirado

**Solución**:
- El sistema automáticamente desactiva tokens inválidos
- El usuario debe volver a iniciar sesión para obtener un nuevo token

---

## 📊 MÉTRICAS A MONITOREAR

### En Supabase:

```sql
-- Tasa de éxito de notificaciones
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Tokens activos por dispositivo
SELECT 
  device_type,
  COUNT(*) as count
FROM fcm_tokens
WHERE is_active = true
GROUP BY device_type;

-- Usuarios con notificaciones habilitadas
SELECT COUNT(*) 
FROM notification_preferences 
WHERE push_enabled = true;
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Variables de entorno configuradas (cliente y servidor)
- [ ] Firebase Admin inicializado correctamente
- [ ] Al menos 1 token FCM activo registrado
- [ ] Endpoint `/api/notifications/test-firebase` responde OK
- [ ] Endpoint `/api/notifications/test-send` envía notificación
- [ ] Notificación llega al navegador/dispositivo
- [ ] Log se crea en `notification_logs`
- [ ] Panel admin puede enviar notificaciones
- [ ] Notificaciones funcionan en segundo plano (service worker)

---

## 🎯 PRÓXIMOS PASOS

1. **Probar en producción**: Verificar que las variables estén en Vercel
2. **Monitorear logs**: Revisar `notification_logs` periódicamente
3. **Limpiar tokens inválidos**: Ejecutar limpieza de tokens inactivos
4. **Optimizar segmentación**: Ajustar filtros según necesidades

---

**Última actualización**: 2025-01-XX

