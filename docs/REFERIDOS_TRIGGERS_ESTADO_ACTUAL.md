# 👥 REFERIDOS Y TRIGGERS - DOCUMENTO MAESTRO

**Última actualización**: 2025-01-17 17:15:00 UTC  
**Versión**: 1.0  
**Este es el documento oficial y único de referencia para referidos y triggers**

> ⚠️ **IMPORTANTE**: Este es el único documento de referidos y triggers que debes consultar. Los demás documentos están obsoletos o son históricos.

---

## 📋 REGLAS DE USO Y ACTUALIZACIÓN

### 🔴 REGLAS OBLIGATORIAS

1. **SIEMPRE actualizar fecha y hora** al modificar sistema de referidos
2. **SIEMPRE actualizar el historial de cambios** al modificar triggers
3. **SIEMPRE verificar** que los triggers funcionan después de cambios
4. **NO modificar este documento** sin seguir estas reglas

---

## 📊 RESUMEN EJECUTIVO

### Estado General: ✅ **COMPLETO**

**Funcionalidades implementadas**:
- ✅ Generación de códigos de referido
- ✅ Verificación de códigos
- ✅ Activación de plan Smart por referidos
- ✅ Triggers de Supabase para actualización automática
- ✅ Notificaciones de referidos

---

## 🗄️ ESTRUCTURA DE TABLAS

### 1. `usuarios`
**Columnas relevantes**:
- `id` - UUID (PK)
- `codigo_referido` - TEXT - Código único del usuario
- `referido_de` - UUID - ID del usuario que lo refirió (FK)
- `referidos_verificados` - INTEGER - Contador de referidos verificados
- `ha_ganado_smart` - BOOLEAN - Si ya ganó plan Smart
- `smart_fecha_inicio_programada` - TIMESTAMP - Fecha programada para activar Smart

### 2. `referidos`
**Columnas**:
- `id` - UUID (PK)
- `referidor_id` - UUID - ID del usuario que refirió (FK → usuarios.id)
- `referido_id` - UUID - ID del usuario referido (FK → usuarios.id)
- `codigo_usado` - TEXT - Código de referido usado
- `fecha_registro` - TIMESTAMP - Cuándo se registró
- `fecha_verificacion` - TIMESTAMP - Cuándo verificó WhatsApp
- `verifico_whatsapp` - BOOLEAN - Si verificó WhatsApp

### 3. `codigos_verificacion`
**Columnas**:
- `id` - UUID (PK)
- `telefono` - TEXT - Número de teléfono
- `codigo` - TEXT - Código de 6 dígitos
- `usado` - BOOLEAN - Si ya fue usado
- `expira_en` - TIMESTAMP - Fecha de expiración (10 minutos)
- `fecha_creacion` - TIMESTAMP

---

## 🔧 FUNCIONES Y TRIGGERS DE SUPABASE

### 1. `actualizar_contador_referidos()`

**Qué hace**:
- ✅ Detecta cuando `verifico_whatsapp` cambia de `false/null` a `true`
- ✅ Actualiza contador `referidos_verificados` en `usuarios`
- ✅ Actualiza `fecha_verificacion = NOW()` en `referidos`

**Trigger**: `trigger_actualizar_contador_referidos`
- Se ejecuta: `BEFORE UPDATE` en tabla `referidos`
- Condición: Cuando `verifico_whatsapp` cambia a `true`

### 2. `limpiar_codigos_verificacion_expirados()`

**Qué hace**:
- ✅ Limpia códigos de verificación expirados
- ✅ Se ejecuta automáticamente cuando hay >1000 códigos

**Trigger**: `trigger_limpieza_codigos`
- Se ejecuta: Automáticamente cuando hay muchos códigos

---

## 📱 FUNCIONALIDADES IMPLEMENTADAS

### 1. Generación de Código de Referido ✅

**Ubicación**: `src/contexts/SupabaseContext.tsx`

**Función**: Se genera automáticamente al crear usuario
- Código único de 8 caracteres alfanuméricos
- Se guarda en `usuarios.codigo_referido`

### 2. Procesar Código de Referido ✅

**Flujo**:
1. Usuario ingresa código de referido al registrarse
2. Se valida que el código existe
3. Se crea registro en tabla `referidos`
4. Se actualiza `usuarios.referido_de`

**Endpoint**: `/api/referrals/process-code`

### 3. Verificación de WhatsApp ✅

**Flujo**:
1. Usuario verifica WhatsApp con código de 6 dígitos
2. Se actualiza `referidos.verifico_whatsapp = true`
3. Trigger `actualizar_contador_referidos` se ejecuta automáticamente
4. Se actualiza contador `referidos_verificados` en `usuarios`
5. Se envía notificación al referidor (si está configurado)

**Endpoints**:
- `/api/whatsapp/send-verification-code` - Envía código
- `/api/whatsapp/verify-code` - Verifica código

### 4. Activación de Plan Smart ✅

**Condición**: Usuario tiene 3 referidos verificados

**Flujo**:
1. Trigger detecta que `referidos_verificados >= 3`
2. Se verifica que usuario no haya ganado Smart antes (`ha_ganado_smart = false`)
3. Si tiene plan activo (FREE/PRO), se programa activación:
   - `smart_fecha_inicio_programada` = Fecha de fin del plan actual
4. Si no tiene plan activo, se activa inmediatamente

**Endpoint**: `/api/referrals/activate-smart`

---

## 🎯 PLAN DE IMPLEMENTACIÓN (Histórico)

### Fase 1: Generar Código de Referido ✅
- ✅ Código único generado al crear usuario
- ✅ Se muestra en UI de referidos

### Fase 2: Procesar Código de Referido ✅
- ✅ Endpoint `/api/referrals/process-code` implementado
- ✅ Validación de código
- ✅ Creación de registro en `referidos`

### Fase 3: Verificación de WhatsApp ✅
- ✅ Endpoint `/api/whatsapp/send-verification-code` implementado
- ✅ Endpoint `/api/whatsapp/verify-code` implementado
- ✅ Trigger de actualización de contador implementado

### Fase 4: Activación de Plan Smart ✅
- ✅ Endpoint `/api/referrals/activate-smart` implementado
- ✅ Lógica de activación programada implementada
- ✅ Verificación de elegibilidad implementada

---

## 🔍 VERIFICACIÓN Y TESTING

### Verificar Código de Referido

#### Paso 1: Obtener Código
1. Login como usuario
2. Ir a `/referrals`
3. Copiar código de referido

#### Paso 2: Usar Código
1. Crear nuevo usuario
2. Ingresar código en registro
3. Verificar que se crea registro en `referidos`

### Verificar Trigger de Contador

#### Paso 1: Verificar WhatsApp
1. Usuario referido verifica WhatsApp
2. Verificar en Supabase:
   - `referidos.verifico_whatsapp = true`
   - `referidos.fecha_verificacion` tiene fecha
   - `usuarios.referidos_verificados` incrementó

#### Paso 2: Verificar Activación Smart
1. Usuario tiene 3 referidos verificados
2. Verificar en Supabase:
   - `usuarios.ha_ganado_smart = true` (si no tenía plan)
   - O `usuarios.smart_fecha_inicio_programada` tiene fecha (si tenía plan)

### Testing Completo

#### Checklist
- [ ] Código de referido se genera correctamente
- [ ] Código de referido se puede usar al registrarse
- [ ] Verificación de WhatsApp actualiza contador
- [ ] Activación de Smart funciona con 3 referidos
- [ ] Notificaciones se envían correctamente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: Código de Referido No Se Genera

#### Verificar
- [ ] Usuario tiene `codigo_referido` en tabla `usuarios`
- [ ] Función de generación se ejecuta al crear usuario

#### Solución
1. Verificar que función de generación está en `createUser`
2. Verificar que se guarda en Supabase
3. Generar manualmente si es necesario

### Problema: Trigger No Se Ejecuta

#### Verificar
- [ ] Trigger existe en Supabase
- [ ] Trigger está activo
- [ ] Condición del trigger es correcta

#### Solución
1. Verificar triggers en Supabase Dashboard
2. Probar trigger manualmente
3. Revisar logs de Supabase

### Problema: Contador No Se Actualiza

#### Verificar
- [ ] `verifico_whatsapp` cambió a `true`
- [ ] Trigger se ejecutó
- [ ] Función `actualizar_contador_referidos` existe

#### Solución
1. Verificar que trigger está activo
2. Ejecutar función manualmente si es necesario
3. Revisar logs de Supabase

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 17:15:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Consolidación completa de documentos de referidos y triggers
- ✅ Agregadas reglas de uso y actualización
- ✅ Estructura de tablas documentada
- ✅ Funciones y triggers documentados
- ✅ Plan de implementación histórico documentado
- ✅ Verificación y testing documentados
- ✅ Historial de cambios implementado

**Componentes afectados**: Todos (documentación)

---

## 📝 NOTAS IMPORTANTES

1. **Este es el único documento oficial** de referidos y triggers
2. **Los demás documentos** están obsoletos o son históricos
3. **Siempre actualizar fecha/hora** al modificar sistema
4. **Siempre verificar** que los triggers funcionan después de cambios
5. **Documentar problemas** en `PROBLEMAS_SOLUCIONES_ESTADO_ACTUAL.md`

---

**Última actualización**: 2025-01-17 17:15:00 UTC  
**Próxima revisión programada**: 2025-02-17

