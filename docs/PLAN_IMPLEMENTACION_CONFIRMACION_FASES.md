# 🚀 PLAN DE IMPLEMENTACIÓN: Sistema de Confirmación WhatsApp Cloud API

## 📋 OBJETIVO

Replicar **EXACTAMENTE** el sistema de confirmación de transacciones que funcionaba en Baileys (Fly.io) para WhatsApp Cloud API, manteniendo toda la funcionalidad, lógica y comportamiento idéntico.

---

## ✅ VERIFICACIÓN PREVIA

Antes de comenzar, verificar que existan en Supabase:

- [ ] Tabla `predicciones_groq` con todas las columnas necesarias
- [ ] Tabla `pending_confirmations` con `parent_message_id`
- [ ] Tabla `feedback_confirmation_config` con datos iniciales
- [ ] Tabla `feedback_usuarios` con columnas `origen` y `confiabilidad`
- [ ] Tabla `transacciones` con todas las columnas necesarias

**Si faltan columnas o tablas, ejecutar las migraciones SQL correspondientes primero.**

---

## 📦 FASES DE IMPLEMENTACIÓN

### **FASE 1: Utilidades Base** ⚙️

**Objetivo**: Crear todas las funciones de utilidad necesarias.

**Archivos a crear**:

1. **`packages/core-api/src/lib/parseConfirmation.ts`**
   - Función `parseConfirmation(message: string)`
   - Detectar palabras y emojis de confirmación
   - Retornar `{ type, confidence }`

2. **`packages/core-api/src/lib/construirPreview.ts`**
   - Función `construirPreviewMultiple(transactions, processedType)`
   - Función `construirPreviewSimple(expenseData, processedType)`
   - Formato exacto de mensajes

3. **`packages/core-api/src/lib/whatsapp-deduplication-endpoint.ts`**
   - Función `checkDuplicateWhatsAppMessage(waMessageId)`
   - Función `insertPredictionWithDedup(payload)`
   - Lógica de deduplicación

4. **`packages/core-api/src/lib/calculateWeightedAccuracy.ts`**
   - Función `calculateWeightedAccuracy(supabase, country_code)`
   - Cálculo de accuracy ponderado
   - Solo contar `whatsapp_reaction` y `app_edit`

5. **`packages/core-api/src/lib/whatsappCloudApi.ts`**
   - Función `sendWhatsAppMessage(to, message)`
   - Usar WhatsApp Cloud API Graph API
   - Requiere: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`

**Verificación**:
- [ ] Todas las funciones compilan sin errores
- [ ] Tests unitarios básicos (opcional pero recomendado)

---

### **FASE 2: Modificar Webhook Principal** 🔄

**Objetivo**: Modificar el webhook de WhatsApp para crear `pending_confirmations` y enviar mensajes de confirmación.

**Archivo a modificar**:
- `packages/core-api/src/app/api/webhooks/whatsapp/route.ts`

**Cambios necesarios**:

1. **Manejar usuarios NO registrados** (simple, sin mensaje de invitación):
   ```typescript
   if (userError || !user) {
     // Retornar error simple sin procesar (ahorro de recursos Groq)
     return NextResponse.json({
       success: false,
       error: 'user_not_registered',
       message: 'Usuario no está registrado en la plataforma'
     }, { status: 200 });
   }
   ```
   ⚠️ **NO enviar mensaje de invitación** (esto NO estaba en Baileys original)

2. **Importar utilidades**:
   ```typescript
   import { insertPredictionWithDedup, checkDuplicateWhatsAppMessage } from '@/lib/whatsapp-deduplication-endpoint';
   import { construirPreviewMultiple, construirPreviewSimple } from '@/lib/construirPreview';
   import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
   import type { GroqMultipleResponse } from '@/services/groqService';
   ```

2. **Cambiar extracción de Groq**:
   - De: `groqService.extractExpenseWithCountryContext()`
   - A: `groqService.processTranscriptionMultiple()`
   - Manejar respuesta `GroqMultipleResponse`

3. **Verificar configuración por país**:
   ```typescript
   const { data: config } = await supabase
     .from('feedback_confirmation_config')
     .select('require_confirmation')
     .eq('country_code', user.country_code || 'BOL')
     .single();
   
   const requireConfirmation = config?.require_confirmation ?? true;
   ```

4. **Lógica para MÚLTIPLES transacciones**:
   - Si `groqResult?.esMultiple && groqResult.transacciones.length > 1`
   - Crear N predicciones con `parent_message_id`
   - Crear N `pending_confirmations` con mismo `parent_message_id`

5. **Lógica para SIMPLE transacción**:
   - Crear 1 predicción
   - Crear 1 `pending_confirmations` (solo si `requireConfirmation && !cached`)

6. **NO guardar transacción inmediatamente**:
   - ❌ Eliminar código que crea `transacciones` directamente
   - ✅ Solo crear `predicciones_groq` y `pending_confirmations`

7. **Construir y enviar preview**:
   ```typescript
   let previewMessage: string;
   if (groqResult?.esMultiple && groqResult.transacciones.length > 1) {
     previewMessage = construirPreviewMultiple(groqResult.transacciones, processedType);
   } else {
     previewMessage = construirPreviewSimple(expenseData, processedType);
   }
   
   // Enviar mensaje al usuario
   await sendWhatsAppMessage(rawPhoneNumber, previewMessage);
   ```

8. **Manejar mensajes de texto** (confirmaciones):
   - Si `message.type === 'text'`
   - Verificar si es confirmación usando `parseConfirmation()`
   - Si es confirmación, llamar a endpoint `/api/webhooks/whatsapp/confirm`
   - Retornar respuesta apropiada

**Verificación**:
- [ ] Webhook detecta usuarios no registrados correctamente
- [ ] Webhook retorna error simple sin procesar (NO envía mensaje de invitación)
- [ ] Webhook NO valida límites de audio/texto (procesa sin restricciones)
- [ ] Webhook crea `pending_confirmations` correctamente
- [ ] Webhook envía mensaje de preview al usuario
- [ ] Webhook maneja mensajes de texto (confirmaciones)
- [ ] Soporte para múltiples transacciones funciona
- [ ] NO crea transacciones inmediatamente

---

### **FASE 3: Endpoint de Confirmación** ✅

**Objetivo**: Crear endpoint para procesar confirmaciones del usuario.

**Archivo a crear**:
- `packages/core-api/src/app/api/webhooks/whatsapp/confirm/route.ts`

**Funcionalidad**:

1. **Obtener usuario y país**
2. **Parsear confirmación** con `parseConfirmation()`
3. **Obtener predicción pendiente** (más reciente o por `prediction_id`)
4. **Detectar si es SIMPLE o MÚLTIPLE** (por `parent_message_id`)
5. **Confirmar todas las predicciones del grupo** (si es múltiple)
6. **Para cada predicción**:
   - Actualizar `predicciones_groq.confirmado = true`
   - Actualizar `predicciones_groq.confirmado_por = 'whatsapp_reaction'`
   - Crear registro en `feedback_usuarios`
   - Crear transacción usando `original_timestamp`
   - Marcar `pending_confirmations.confirmed = true`
7. **Recalcular accuracy ponderado**
8. **Verificar auto-habilitación** (accuracy >= 90% y >= 1000 TX)
9. **Enviar mensaje de confirmación exitosa** al usuario
10. **Retornar respuesta JSON**

**Verificación**:
- [ ] Endpoint procesa confirmaciones simples correctamente
- [ ] Endpoint procesa confirmaciones múltiples correctamente
- [ ] Crea transacciones con `original_timestamp` correcto
- [ ] Recalcula accuracy correctamente
- [ ] Auto-habilita cuando corresponde
- [ ] Envía mensaje de confirmación al usuario

---

### **FASE 4: Cron Job de Auto-guardado** ⏰

**Objetivo**: Crear cron job para auto-guardar transacciones después de 30 minutos.

**Archivo a crear**:
- `packages/core-api/src/app/api/cron/confirm-expired/route.ts`

**Funcionalidad**:

1. **Verificar autenticación** (`CRON_SECRET`)
2. **Buscar confirmaciones expiradas**:
   ```sql
   SELECT * FROM pending_confirmations
   WHERE expires_at < NOW()
     AND confirmed IS NULL
   ```
3. **Para cada expirada**:
   - Obtener predicción completa
   - Actualizar `predicciones_groq.confirmado = true`
   - Actualizar `predicciones_groq.confirmado_por = 'timeout'`
   - Crear transacción usando `original_timestamp`
   - Marcar `pending_confirmations.confirmed = true`
4. **Retornar estadísticas** (procesadas, errores)

**Configuración Vercel Cron**:
```json
{
  "crons": [{
    "path": "/api/cron/confirm-expired",
    "schedule": "*/5 * * * *"
  }]
}
```
(Ejecutar cada 5 minutos)

**Verificación**:
- [ ] Cron job encuentra confirmaciones expiradas
- [ ] Auto-guarda transacciones correctamente
- [ ] Usa `original_timestamp` correcto
- [ ] Marca `confirmado_por = 'timeout'`
- [ ] No cuenta `timeout` para accuracy

---

### **FASE 5: Migraciones SQL** 🗄️

**Objetivo**: Asegurar que todas las tablas y columnas existan.

**Archivos a crear/verificar**:

1. **`packages/core-api/supabase/migrations/007_pending_confirmations.sql`**
   - Crear tabla `pending_confirmations`
   - Agregar índices necesarios

2. **`packages/core-api/supabase/migrations/006_feedback_config.sql`**
   - Crear tabla `feedback_confirmation_config`
   - Insertar datos iniciales por país

3. **`packages/core-api/supabase/migrations/010_add_parent_message_id.sql`**
   - Agregar `parent_message_id` a `predicciones_groq`
   - Agregar `parent_message_id` a `pending_confirmations`

4. **`packages/core-api/supabase/migrations/009_add_original_timestamp.sql`**
   - Agregar `original_timestamp` a `predicciones_groq`

5. **`packages/core-api/supabase/migrations/008_add_feedback_columns.sql`**
   - Agregar `confirmado_por` a `predicciones_groq`
   - Agregar `origen` y `confiabilidad` a `feedback_usuarios`

**Verificación**:
- [ ] Todas las tablas existen
- [ ] Todas las columnas existen
- [ ] Índices creados correctamente
- [ ] Datos iniciales insertados

---

### **FASE 6: Verificación y Testing** 🧪

**Objetivo**: Verificar que todo funcione exactamente como en Baileys.

**Checklist de verificación**:

1. **Flujo Simple (1 transacción)**:
   - [ ] Usuario envía audio/texto
   - [ ] Se crea predicción con `confirmado = null`
   - [ ] Se crea `pending_confirmations` con `expires_at = +30 min`
   - [ ] Se envía mensaje de preview al usuario
   - [ ] Usuario responde "sí"
   - [ ] Se actualiza `confirmado = true`
   - [ ] Se crea transacción con `original_timestamp` correcto
   - [ ] Se envía mensaje de confirmación exitosa

2. **Flujo Múltiple (N transacciones)**:
   - [ ] Usuario envía audio/texto con múltiples transacciones
   - [ ] Se crean N predicciones con mismo `parent_message_id`
   - [ ] Se crean N `pending_confirmations` con mismo `parent_message_id`
   - [ ] Se envía mensaje de preview con todas las transacciones
   - [ ] Usuario responde "ok"
   - [ ] Se confirman TODAS las transacciones juntas
   - [ ] Se crean N transacciones con `original_timestamp` correcto
   - [ ] Se envía mensaje de confirmación exitosa

3. **Flujo Timeout (30 minutos)**:
   - [ ] Usuario envía audio/texto
   - [ ] Se crea `pending_confirmations` con `expires_at = +30 min`
   - [ ] Usuario NO responde
   - [ ] Cron job ejecuta después de 30 minutos
   - [ ] Se auto-guarda transacción con `confirmado_por = 'timeout'`
   - [ ] Se usa `original_timestamp` correcto

4. **Configuración por País**:
   - [ ] Se verifica `feedback_confirmation_config` por país
   - [ ] Si `require_confirmation = false`, NO se crea `pending_confirmations`
   - [ ] Si `require_confirmation = false`, se guarda transacción inmediatamente

5. **Accuracy y Auto-habilitación**:
   - [ ] Se recalcula accuracy después de cada confirmación
   - [ ] Solo cuenta `whatsapp_reaction` (1.0) y `app_edit` (2.0)
   - [ ] NO cuenta `timeout` (0.0)
   - [ ] Auto-habilita cuando `accuracy >= 90%` y `verified_count >= 1000`

6. **Deduplicación**:
   - [ ] Mensajes duplicados se detectan por `wa_message_id`
   - [ ] Se retorna caché sin reprocesar

7. **Formato de Mensajes**:
   - [ ] Preview simple tiene formato correcto
   - [ ] Preview múltiple tiene formato correcto
   - [ ] Mensaje de confirmación exitosa se envía correctamente

8. **Usuarios No Registrados**:
   - [ ] Usuario no registrado envía mensaje
   - [ ] Se retorna error simple `user_not_registered`
   - [ ] NO se envía mensaje de invitación (esto NO estaba en Baileys)
   - [ ] NO se procesa con Groq (ahorro de recursos)

---

## 🚨 PUNTOS CRÍTICOS A VERIFICAR

1. **Timestamp Original**: ⚠️ SIEMPRE usar `original_timestamp` al crear transacciones, NO `created_at`

2. **Parent Message ID**: ⚠️ Para múltiples transacciones, todas deben tener el mismo `parent_message_id`

3. **Confirmación Pendiente**: ⚠️ Solo crear si `requireConfirmation === true` y NO es caché

4. **Timeout**: ⚠️ Exactamente 30 minutos desde la creación

5. **Accuracy**: ⚠️ NO contar `timeout` (peso 0.0), solo `whatsapp_reaction` (1.0) y `app_edit` (2.0)

6. **Formato de Teléfono**: ⚠️ Buscar usuario con/sin `+` para compatibilidad

7. **Usuarios No Registrados**: ⚠️ **NO enviar mensaje de invitación** (solo retornar error)

8. **Validaciones**: ⚠️ **NO validar límites** de audio/texto (procesar sin restricciones)

---

## 📝 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. ✅ **FASE 1**: Utilidades Base (sin dependencias)
2. ✅ **FASE 5**: Migraciones SQL (verificar tablas primero)
3. ✅ **FASE 2**: Modificar Webhook Principal (usa utilidades de FASE 1)
4. ✅ **FASE 3**: Endpoint de Confirmación (usa utilidades de FASE 1)
5. ✅ **FASE 4**: Cron Job (usa utilidades de FASE 1)
6. ✅ **FASE 6**: Verificación y Testing (verificar todo)

---

## ✅ CRITERIOS DE ÉXITO

El sistema está completo cuando:

- ✅ Todas las fases están implementadas
- ✅ Todas las verificaciones pasan
- ✅ El comportamiento es **IDÉNTICO** a Baileys
- ✅ Los mensajes tienen el formato exacto
- ✅ Las transacciones se crean con `original_timestamp` correcto
- ✅ El sistema de múltiples transacciones funciona
- ✅ El cron job auto-guarda correctamente
- ✅ La configuración por país funciona
- ✅ El accuracy se recalcula correctamente
- ✅ La auto-habilitación funciona cuando corresponde

---

**Última actualización**: 2025-11-21
**Versión**: 1.0.0
**Estado**: Plan de implementación por fases

