# 📊 Estructura de Tablas Clave en Supabase

## Tablas Relevantes para la Implementación

### 1. `codigos_verificacion` ✅
**Uso:** Almacena códigos de verificación de WhatsApp

**Columnas (inferidas del código):**
- `id` - UUID (PK)
- `telefono` - TEXT - Número de teléfono al que se envió el código
- `codigo` - TEXT - Código de 6 dígitos
- `usado` - BOOLEAN - Si el código ya fue usado
- `expira_en` - TIMESTAMP - Fecha de expiración (10 minutos)
- `fecha_creacion` - TIMESTAMP - Cuándo se creó el código

**Funciones relacionadas:**
- `limpiar_codigos_verificacion_expirados()` - Limpia códigos expirados
- Trigger `trigger_limpieza_codigos` - Limpia automáticamente si hay >1000 códigos

**Uso en nuestro código:**
- ✅ `POST /api/whatsapp/send-verification-code` - Inserta códigos nuevos
- ⏳ `verifyWhatsAppCode` - Consulta y marca como usado

---

### 2. `referidos` ✅
**Uso:** Almacena relaciones de referidos entre usuarios

**Columnas (inferidas del código):**
- `id` - UUID (PK)
- `referidor_id` - UUID - ID del usuario que refirió (FK → usuarios.id)
- `referido_id` - UUID - ID del usuario referido (FK → usuarios.id)
- `codigo_usado` - TEXT - Código de referido usado
- `fecha_registro` - TIMESTAMP - Cuándo se registró el referido
- `fecha_verificacion` - TIMESTAMP - Cuándo verificó WhatsApp (NULL si no ha verificado)
- `verifico_whatsapp` - BOOLEAN - Si el referido verificó WhatsApp

**Funciones relacionadas:**
- `actualizar_contador_referidos()` - Actualiza `referidos_verificados` en `usuarios`
- Trigger `trigger_actualizar_contado...` - Se ejecuta cuando `verifico_whatsapp` cambia

**Uso en nuestro código:**
- ✅ `getReferidos()` - Consulta referidos de un usuario
- ⏳ `verifyWhatsAppCode` - Actualiza `verifico_whatsapp = true` cuando se verifica
- ⏳ Triggers de notificaciones - Se invocan cuando se crea/verifica un referido

---

### 3. `usuarios` ✅
**Uso:** Almacena información de usuarios

**Columnas relevantes:**
- `id` - UUID (PK)
- `telefono` - TEXT - Número de teléfono
- `whatsapp_verificado` - BOOLEAN - Si WhatsApp está verificado
- `referidos_verificados` - INTEGER - Contador de referidos que verificaron WhatsApp
- `telefono_pendiente` - TEXT - Nuevo teléfono pendiente de verificar
- `codigo_verificacion_pendiente` - TEXT - Código enviado al nuevo teléfono
- `fecha_ultimo_cambio_telefono` - TIMESTAMP - Última vez que cambió teléfono

**Uso en nuestro código:**
- ✅ `fetchUserData()` - Recarga datos del usuario
- ✅ `sendWhatsAppVerificationCode` - Verifica que el usuario existe
- ⏳ `verifyWhatsAppCode` - Actualiza `whatsapp_verificado = true`

---

### 4. `notification_triggers` ✅
**Uso:** Configuración de triggers de notificaciones

**Triggers relevantes:**
- `trigger.referral.invited` - Cuando se invita un referido
- `trigger.referral.verified` - Cuando un referido verifica WhatsApp

**Uso en nuestro código:**
- ⏳ Se invocan desde `verifyWhatsAppCode` y cuando se crea un referido

---

### 5. `notification_preferences` ✅
**Uso:** Preferencias de notificaciones por usuario

**Columnas:**
- `user_id` - UUID (PK, FK → usuarios.id)
- `push_enabled` - BOOLEAN
- `transaction_enabled` - BOOLEAN
- `reminder_enabled` - BOOLEAN
- `marketing_enabled` - BOOLEAN
- `quiet_hours_start` - TIME
- `quiet_hours_end` - TIME
- `timezone` - TEXT

**Uso en nuestro código:**
- ✅ `/api/notifications/preferences` - GET/PUT
- ✅ `/profile` - UI de preferencias

---

## 🔄 Flujo de Verificación de WhatsApp

```
1. Usuario solicita código
   ↓
2. POST /api/whatsapp/send-verification-code
   ↓
3. Genera código de 6 dígitos
   ↓
4. Guarda en codigos_verificacion
   ↓
5. (Futuro) Envía por WhatsApp
   ↓
6. Usuario ingresa código
   ↓
7. verifyWhatsAppCode()
   ↓
8. Verifica código en codigos_verificacion
   ↓
9. Si válido:
   - Marca código como usado
   - Actualiza usuarios.whatsapp_verificado = true
   - Si es referido: actualiza referidos.verifico_whatsapp = true
   - Invoca trigger de notificación (referral verified)
```

---

## 🔄 Flujo de Referidos

```
1. Usuario A invita a Usuario B
   ↓
2. Se crea registro en referidos:
   - referidor_id = Usuario A
   - referido_id = Usuario B
   - verifico_whatsapp = false
   ↓
3. Invoca trigger de notificación (referral invited)
   ↓
4. Usuario B verifica WhatsApp
   ↓
5. verifyWhatsAppCode() detecta que es referido
   ↓
6. Actualiza referidos:
   - verifico_whatsapp = true
   - fecha_verificacion = NOW()
   ↓
7. Trigger actualiza usuarios.referidos_verificados
   ↓
8. Invoca trigger de notificación (referral verified)
```

---

## ✅ Estado de Implementación

| Tabla | Función | Estado |
|-------|---------|--------|
| `codigos_verificacion` | Insertar código | ✅ Implementado |
| `codigos_verificacion` | Verificar código | ⏳ Pendiente (Fase 4) |
| `referidos` | Consultar referidos | ✅ Implementado (Fase 1) |
| `referidos` | Actualizar verificación | ⏳ Pendiente (Fase 4) |
| `usuarios` | Recargar datos | ✅ Implementado |
| `usuarios` | Actualizar verificación | ⏳ Pendiente (Fase 4) |
| `notification_triggers` | Invocar triggers | ⏳ Pendiente (Fase 5) |

---

## 📝 Notas Importantes

1. **Códigos de verificación expiran en 10 minutos**
2. **Los códigos se limpian automáticamente** cuando expiran o después de 1 hora de uso
3. **El trigger de referidos** se ejecuta automáticamente cuando `verifico_whatsapp` cambia
4. **Los triggers de notificaciones** deben invocarse manualmente desde el código

