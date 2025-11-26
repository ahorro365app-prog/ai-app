# 📋 DOCUMENTACIÓN COMPLETA: Sistema de Confirmación WhatsApp

## 🎯 OBJETIVO

Este documento describe **EXACTAMENTE** cómo funcionaba el sistema de confirmación de transacciones en Baileys (Fly.io) para replicarlo idénticamente en WhatsApp Cloud API.

---

## 📊 ARQUITECTURA DEL SISTEMA

### 1. TABLAS DE BASE DE DATOS

#### `predicciones_groq`
```sql
- id (UUID, PK)
- usuario_id (UUID, FK → usuarios)
- country_code (VARCHAR(3))
- transcripcion (TEXT)
- resultado (JSONB) -- Datos extraídos por Groq LLM
- confirmado (BOOLEAN) -- NULL=pending, true=confirmed, false=rejected
- confirmado_por (VARCHAR(50)) -- 'whatsapp_reaction', 'app_edit', 'timeout', 'manual'
- wa_message_id (VARCHAR(255)) -- ID único del mensaje WhatsApp (deduplicación)
- parent_message_id (VARCHAR(255)) -- ID del mensaje original (para múltiples TX)
- mensaje_origen (VARCHAR(50)) -- 'whatsapp', 'app', 'web'
- categoria_detectada (VARCHAR(100)) -- Para búsquedas rápidas
- original_timestamp (TIMESTAMP) -- Hora exacta cuando usuario envió (NO cambia)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `pending_confirmations`
```sql
- id (UUID, PK)
- prediction_id (UUID, FK → predicciones_groq, ON DELETE CASCADE)
- usuario_id (UUID)
- country_code (VARCHAR(3))
- wa_message_id (VARCHAR(255))
- parent_message_id (VARCHAR(255)) -- Para agrupar múltiples TX del mismo mensaje
- expires_at (TIMESTAMP) -- Cuándo se auto-confirma (30 minutos después)
- confirmed (BOOLEAN) -- NULL=pending, true=confirmed, false=cancelled
- confirmed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### `feedback_confirmation_config`
```sql
- id (UUID, PK)
- country_code (VARCHAR(3), UNIQUE)
- require_confirmation (BOOLEAN) -- true=requiere confirmación, false=auto
- confirmation_timeout_minutes (INT) -- 30 minutos por defecto
- min_accuracy_for_auto (FLOAT) -- 90.0% mínimo para auto-habilitar
- min_transactions_for_auto (INT) -- 1000 transacciones mínimo
- total_transactions (INT) -- Total de transacciones verificadas
- confirmed_correct (INT) -- Total confirmadas como correctas
- accuracy (FLOAT) -- Accuracy ponderado actual
- is_auto_enabled (BOOLEAN) -- Si está en modo automático
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `feedback_usuarios`
```sql
- id (UUID, PK)
- prediction_id (UUID, FK → predicciones_groq)
- usuario_id (UUID, FK → usuarios)
- country_code (VARCHAR(3))
- era_correcto (BOOLEAN) -- true=correcto, false=incorrecto
- comentario (TEXT) -- Opcional
- origen (VARCHAR(50)) -- 'whatsapp_reaction', 'app_edit', 'manual'
- confiabilidad (FLOAT) -- 1.0=normal, 2.0=máximo (app_edit)
- created_at (TIMESTAMP)
```

#### `transacciones`
```sql
- id (UUID, PK)
- usuario_id (UUID, FK → usuarios)
- tipo (VARCHAR) -- 'gasto', 'ingreso'
- monto (DECIMAL)
- categoria (VARCHAR)
- descripcion (TEXT)
- fecha (TIMESTAMP) -- Usa original_timestamp de predicción
- metodo_pago (VARCHAR)
- moneda (VARCHAR) -- 'BOB', 'USD', etc.
- created_at (TIMESTAMP)
```


---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### FASE 1: RECEPCIÓN Y PROCESAMIENTO

1. **Usuario envía audio/texto por WhatsApp**
   - Baileys Worker recibe el mensaje
   - Envía al backend: `POST /api/webhooks/baileys`

2. **Validaciones iniciales**
   - ✅ Verificar usuario registrado (buscar con/sin `+` en teléfono)
   - ✅ **Si NO está registrado**: Retornar error `user_not_registered` (NO procesar con Groq)
   - ✅ Verificar duplicado por `wa_message_id` (early return si existe)
   - ⚠️ **NO hay validación de límites** (audio/texto se procesan sin restricciones)

3. **Transcripción**
   - Audio: Convertir base64 → Blob → File → Groq Whisper
   - Texto: Usar directamente como transcripción

4. **Extracción con Groq LLM**
   - Llamar: `groqService.processTranscriptionMultiple(transcription, country_code)`
   - Retorna: `GroqMultipleResponse`
     ```typescript
     {
       transacciones: GroqTransaction[],
       esMultiple: boolean
     }
     ```

5. **Verificar configuración por país**
   - Consultar: `feedback_confirmation_config` por `country_code`
   - Obtener: `require_confirmation` (default: `true`)

### FASE 2: CREACIÓN DE PREDICCIONES Y PENDIENTES

#### Si es MÚLTIPLE (`esMultiple === true` y `transacciones.length > 1`):

1. **Crear N predicciones** (una por cada transacción):
   ```typescript
   for (let i = 0; i < groqResult.transacciones.length; i++) {
     const tx = groqResult.transacciones[i];
     await insertPredictionWithDedup({
       usuario_id: user.id,
       country_code: user.country_code || 'BOL',
       transcripcion: `${transcription} [TX ${i+1}/${groqResult.transacciones.length}]`,
       resultado: tx,
       wa_message_id: `${wa_message_id}_${i}`, // ID único por TX
       mensaje_origen: 'whatsapp',
       original_timestamp: now,
       parent_message_id: wa_message_id // KEY: Mismo parent para todas
     });
   }
   ```

2. **Crear N confirmaciones pendientes** (si `requireConfirmation === true`):
   ```typescript
   const expiresAt = new Date();
   expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutos
   
   for (let i = 0; i < predictions.length; i++) {
     await supabase.from('pending_confirmations').insert({
       prediction_id: predictions[i].id,
       usuario_id: user.id,
       country_code: user.country_code || 'BOL',
       wa_message_id: `${wa_message_id}_${i}`,
       parent_message_id: wa_message_id, // KEY: Agrupar todas
       expires_at: expiresAt.toISOString()
     });
   }
   ```

#### Si es SIMPLE (1 transacción):

1. **Crear 1 predicción**:
   ```typescript
   await insertPredictionWithDedup({
     usuario_id: user.id,
     country_code: user.country_code || 'BOL',
     transcripcion: transcription,
     resultado: expenseData,
     wa_message_id: wa_message_id,
     mensaje_origen: 'whatsapp',
     original_timestamp: now
     // NO tiene parent_message_id (solo para múltiples)
   });
   ```

2. **Crear 1 confirmación pendiente** (si `requireConfirmation === true` y NO es caché):
   ```typescript
   if (requireConfirmation && !cached) {
     const expiresAt = new Date();
     expiresAt.setMinutes(expiresAt.getMinutes() + 30);
     
     await supabase.from('pending_confirmations').insert({
       prediction_id: prediction.id,
       usuario_id: user.id,
       country_code: user.country_code || 'BOL',
       wa_message_id: wa_message_id || null,
       expires_at: expiresAt.toISOString()
       // NO tiene parent_message_id (solo para múltiples)
     });
   }
   ```

### FASE 3: CONSTRUCCIÓN Y ENVÍO DE PREVIEW

1. **Construir mensaje de preview** según tipo:

   **SIMPLE:**
   ```
   ✅ *TEXTO PROCESADO*
   *Monto (BOB):* 10
   *Tipo de transacción:* gasto
   *Método de Pago:* efectivo
   *Categoría:* comida
   *Descripción:* carne
   
   *¿Está bien?*
   ✅ *Responde:* sí / ok / perfecto / está bien
   ⏰ Sin confirmación se guarda automáticamente en 30 minutos
   📱 (Tienes 48h para editarla en la app)
   ```

   **MÚLTIPLE:**
   ```
   ✅ *4 TEXTOS PROCESADOS*
   
   1) 📉 5 BOB (comida)
      pan
      💳 efectivo
   
   2) 📉 10 BOB (transporte)
      taxi
      💳 efectivo
   
   3) 📉 70 BOB (comida)
      carne
      💳 efectivo
   
   4) 📈 +350 BOB (otros)
      venta
      💳 efectivo
   
   ⚠️ Tienes 4 transacciones pendientes
   
   *¿Están bien estas 4?*
   ✅ *Responde:* sí / ok / perfecto / está bien
   ⏰ Sin confirmación se guardan automáticamente en 30 minutos
   📱 (Puedes editarlas en 48h en la app)
   ```

2. **Retornar respuesta al Worker**:
   ```json
   {
     "success": true,
     "cached": false,
     "prediction_id": "...",
     "transcription": "...",
     "expense_data": {...},
     "preview_message": "..."
   }
   ```

3. **Worker envía mensaje de preview** al usuario por WhatsApp

### FASE 1.5: MANEJO DE USUARIOS NO REGISTRADOS

**Cuando un usuario NO registrado envía mensaje**:

1. **Backend detecta usuario no registrado**:
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

2. **Worker procesa respuesta**:
   - El worker recibe el error `user_not_registered`
   - **NO se envía ningún mensaje de invitación** (esto NO estaba implementado)
   - El mensaje simplemente se ignora

### FASE 4: CONFIRMACIÓN DEL USUARIO

1. **Usuario responde con texto** (sí, ok, perfecto, está bien, ✅, 👍, etc.)

2. **Worker detecta confirmación**:
   ```typescript
   function isConfirmation(text: string): boolean {
     const confirmations = ['sí', 'si', 'yes', 'ok', 'okay', 'perfecto', 
                            'está bien', 'esta bien', 'correcto', 'confirmado'];
     return confirmations.includes(text.toLowerCase().trim());
   }
   ```

3. **Worker llama al backend**:
   ```typescript
   POST /api/webhooks/whatsapp/confirm
   {
     phone_number: message.from,
     message: message.message
   }
   ```

4. **Backend procesa confirmación**:

   a) **Obtener usuario y país**
   
   b) **Parsear confirmación**:
      - Usar `parseConfirmation(message)` (detecta palabras y emojis)
      - Si no es `'confirm'`, rechazar con error
   
   c) **Obtener predicción pendiente**:
      - Si viene `prediction_id`, usarlo
      - Si NO viene, buscar la más reciente en `pending_confirmations`:
        ```sql
        SELECT prediction_id, parent_message_id
        FROM pending_confirmations
        WHERE usuario_id = ? 
          AND confirmed IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        ```
   
   d) **Determinar si es SIMPLE o MÚLTIPLE**:
      - Si `parent_message_id` existe → MÚLTIPLE
      - Si NO existe → SIMPLE
   
   e) **Si es MÚLTIPLE**:
      - Buscar TODAS las predicciones con mismo `parent_message_id`:
        ```sql
        SELECT prediction_id
        FROM pending_confirmations
        WHERE usuario_id = ?
          AND parent_message_id = ?
          AND confirmed IS NULL
        ```
      - Obtener todas las predicciones del grupo
      - Confirmar TODAS juntas
   
   f) **Procesar cada predicción**:
      ```typescript
      for (const pred of predictionsToConfirm) {
        // 1. Actualizar predicción
        await supabase
          .from('predicciones_groq')
          .update({
            confirmado: true,
            confirmado_por: 'whatsapp_reaction',
            updated_at: new Date().toISOString()
          })
          .eq('id', pred.id);
        
        // 2. Guardar feedback
        await supabase
          .from('feedback_usuarios')
          .insert({
            prediction_id: pred.id,
            usuario_id,
            era_correcto: true,
            country_code,
            origen: 'whatsapp_reaction',
            confiabilidad: 1.0
          });
        
        // 3. Crear transacción (usando original_timestamp)
        await supabase
          .from('transacciones')
          .insert({
            usuario_id,
            tipo: pred.resultado?.tipo || 'gasto',
            monto: pred.resultado?.monto,
            categoria: pred.resultado?.categoria,
            descripcion: pred.resultado?.descripcion,
            fecha: pred.original_timestamp, // ← TIMESTAMP ORIGINAL
            metodo_pago: pred.resultado?.metodoPago,
            moneda: pred.resultado?.moneda || 'BOB'
          });
        
        // 4. Marcar confirmación como completada
        await supabase
          .from('pending_confirmations')
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('prediction_id', pred.id);
      }
      ```
   
   g) **Recalcular accuracy ponderado**:
      ```typescript
      const { accuracy, verified_count } = await calculateWeightedAccuracy(
        supabase, 
        country_code
      );
      
      // Actualizar config
      await supabase
        .from('feedback_confirmation_config')
        .update({
          total_transactions: verified_count,
          accuracy: accuracy,
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code);
      ```
   
   h) **Verificar si auto-habilitar**:
      ```typescript
      if (accuracy >= 90 && verified_count >= 1000) {
        await supabase
          .from('feedback_confirmation_config')
          .update({
            require_confirmation: false,
            is_auto_enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('country_code', country_code);
        
        return { success: true, auto_enabled: true, accuracy };
      }
      ```
   
   i) **Retornar respuesta**:
      ```json
      {
        "success": true,
        "message": "✅ Perfecto. 4 transacciones guardadas.",
        "confirmado": true,
        "accuracy": 85.5
      }
      ```

5. **Worker envía mensaje de confirmación exitosa**:
   ```
   ✅ Transacción confirmada y guardada exitosamente! 🎉
   ```

### FASE 5: AUTO-GUARDADO POR TIMEOUT (CRON)

1. **Cron job ejecuta cada X minutos**:
   ```typescript
   GET /api/cron/confirm-expired
   Authorization: Bearer ${CRON_SECRET}
   ```

2. **Buscar confirmaciones expiradas**:
   ```sql
   SELECT *
   FROM pending_confirmations
   WHERE expires_at < NOW()
     AND confirmed IS NULL
   ```

3. **Procesar cada expirada**:
   ```typescript
   for (const exp of expired) {
     // 1. Obtener predicción
     const prediction = await supabase
       .from('predicciones_groq')
       .select('resultado, usuario_id, original_timestamp')
       .eq('id', exp.prediction_id)
       .single();
     
     // 2. Actualizar predicción (confirmado_por='timeout')
     await supabase
       .from('predicciones_groq')
       .update({
         confirmado: true,
         confirmado_por: 'timeout',
         updated_at: new Date().toISOString()
       })
       .eq('id', exp.prediction_id);
     
     // 3. Crear transacción (usando original_timestamp)
     await supabase
       .from('transacciones')
       .insert({
         usuario_id: prediction.usuario_id,
         tipo: prediction.resultado?.tipo || 'gasto',
         monto: prediction.resultado?.monto,
         categoria: prediction.resultado?.categoria,
         descripcion: prediction.resultado?.descripcion,
         fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL
         metodo_pago: prediction.resultado?.metodoPago,
         moneda: prediction.resultado?.moneda || 'BOB'
       });
     
     // 4. Marcar confirmación como completada
     await supabase
       .from('pending_confirmations')
       .update({
         confirmed: true,
         confirmed_at: new Date().toISOString()
       })
       .eq('id', exp.id);
   }
   ```

---

## 🔑 FUNCIONES Y UTILIDADES CLAVE

### 1. `parseConfirmation(message: string)`
```typescript
// Detecta confirmaciones positivas
// Retorna: { type: 'confirm' | 'unclear' | 'empty', confidence: number }

// Palabras que confirman:
['si', 'sí', 'ok', 'okey', 'está bien', 'esta bien', 'perfecto', 
 'correcto', 'yes', 'yep', 'ya', 'listo', 'bueno', 'vale', 
 'excelente', 'genial', 'bien', 'confirmado', 'aprobado', 
 'aceptado', 'ok gracias', 'si gracias', 'está correcto', 
 'esta correcto', 'claro', 'dale', 'va', 'vaya', 'oki']

// Emojis que confirman:
['✅', '👍', '✔️', '🆗', '👌']
```

### 2. `construirPreviewMultiple(transactions, processedType)`
```typescript
// Construye mensaje de preview para múltiples transacciones
// Formato específico con emojis y numeración
```

### 3. `insertPredictionWithDedup(payload)`
```typescript
// Inserta predicción con deduplicación por wa_message_id
// Si ya existe, retorna caché
// Si no existe, inserta nueva
```

### 4. `checkDuplicateWhatsAppMessage(waMessageId)`
```typescript
// Verifica si un mensaje WhatsApp ya fue procesado
// Retorna predicción existente o null
```

### 5. `calculateWeightedAccuracy(supabase, country_code)`
```typescript
// Calcula accuracy ponderado por país
// Solo cuenta: whatsapp_reaction (1.0) + app_edit (2.0)
// NO cuenta: timeout (0.0)
// Retorna: { accuracy, verified_count, correct_weighted, total_weighted }
```

### 6. `processTranscriptionMultiple(text, countryCode)`
```typescript
// Extrae múltiples transacciones de un texto usando Groq LLM
// Retorna: GroqMultipleResponse { transacciones: [], esMultiple: boolean }
```

---

## ⚙️ CONFIGURACIÓN POR PAÍS

### Auto-habilitación
- **Umbrales**: `accuracy >= 90%` Y `verified_count >= 1000`
- **Acción**: Cambiar `require_confirmation = false` y `is_auto_enabled = true`
- **Efecto**: Las transacciones se guardan automáticamente sin confirmación

### Accuracy Ponderado
- **Origenes con peso**:
  - `whatsapp_reaction`: 1.0
  - `app_edit`: 2.0 (máximo peso)
  - `timeout`: 0.0 (NO cuenta para accuracy)
- **Cálculo**: `(correct_weighted / total_weighted) * 100`

---

## 📝 NOTAS IMPORTANTES

1. **Timestamp Original**: SIEMPRE usar `original_timestamp` de la predicción al crear transacciones (NO usar `created_at`)

2. **Deduplicación**: Los mensajes duplicados se detectan por `wa_message_id` y se retorna caché sin reprocesar

3. **Múltiples Transacciones**: Se agrupan por `parent_message_id` para confirmarlas todas juntas

4. **Confirmación Pendiente**: Solo se crea si `requireConfirmation === true` y NO es caché

5. **Timeout**: 30 minutos exactos desde la creación de `pending_confirmations`

6. **Formato de Teléfono**: Buscar usuario con/sin `+` para compatibilidad

7. **Límites**: ⚠️ **NO hay límites de validación** (audio y texto se procesan sin restricciones)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Función `sendWhatsAppMessage()` para WhatsApp Cloud API
- [ ] Función `parseConfirmation()`
- [ ] Función `construirPreviewMultiple()`
- [ ] Función `insertPredictionWithDedup()`
- [ ] Función `checkDuplicateWhatsAppMessage()`
- [ ] Función `calculateWeightedAccuracy()`
- [ ] Modificar webhook para crear `pending_confirmations`
- [ ] Modificar webhook para enviar mensaje de preview
- [ ] Modificar webhook para manejar mensajes de texto (confirmaciones)
- [ ] Modificar webhook para manejar usuarios no registrados (retornar error simple)
- [ ] Endpoint `/api/webhooks/whatsapp/confirm`
- [ ] Cron job `/api/cron/confirm-expired`
- [ ] Migraciones SQL para tablas
- [ ] Soporte para múltiples transacciones
- [ ] Preservar `original_timestamp`
- [ ] Configuración por país
- [ ] Auto-habilitación por accuracy
- [ ] **Rate limiting para mensajes de invitación (24 horas)**

---

**Última actualización**: 2025-11-21
**Versión**: 1.0.0
**Estado**: Documentación completa del sistema Baileys

