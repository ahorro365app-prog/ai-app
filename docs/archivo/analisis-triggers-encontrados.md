# Análisis de Triggers Encontrados en Supabase

## ✅ Trigger Relevante Encontrado

### `trigger_actualizar_contado...` en tabla `referidos`

**Detalles:**
- **Tabla:** `referidos`
- **Función:** `actualizar_contador_re...` (nombre truncado)
- **Evento:** `BEFORE UPDATE`
- **Orientación:** `ROW`
- **Estado:** ✅ Habilitado

**Análisis:**
- Este trigger se ejecuta **ANTES** de actualizar un registro en `referidos`
- Probablemente actualiza contadores (como `referidos_verificados` en la tabla `usuarios`)
- **NO invoca notificaciones** (es `BEFORE UPDATE`, no `AFTER UPDATE`)
- **NO crea referidos** (es `UPDATE`, no `INSERT`)

## ❌ Triggers NO Encontrados (Importantes)

### 1. Trigger para CREAR referidos
- ❌ **NO hay** trigger `AFTER INSERT` en `referidos`
- **Conclusión:** Los referidos se crean desde el **código de la aplicación**, no automáticamente por la base de datos

### 2. Trigger para NOTIFICAR cuando se verifica WhatsApp
- ❌ **NO hay** trigger `AFTER UPDATE` que detecte cambio de `verifico_whatsapp = true`
- **Conclusión:** Necesitamos integrar el trigger de notificación en el código

## 🔍 Próximos Pasos

### 1. Revisar la Función `actualizar_contador_re...`

**Acción:** Ve a **Database → Functions** y busca la función completa:
- Nombre completo de la función
- Código SQL de la función
- Qué hace exactamente (probablemente actualiza `referidos_verificados` en `usuarios`)

**Pregunta clave:** ¿Esta función podría ser un buen lugar para invocar el trigger de notificación?

### 2. Buscar Dónde se CREAN los Referidos

Como **NO hay trigger de INSERT**, los referidos se crean desde el código. Necesitamos buscar:

**Lugares posibles:**
- Endpoint de API: `/api/referrals` o similar
- Función en `SupabaseContext.tsx`: `createUser` o similar
- Proceso de registro: cuando un usuario se registra con código de referido

**Cómo buscar:**
```bash
# En el código, buscar:
grep -r "referidos.*insert" --include="*.ts" --include="*.tsx"
grep -r "\.from('referidos')" --include="*.ts" --include="*.tsx"
```

### 3. Revisar la Función del Trigger Existente

**Pregunta:** ¿Podríamos modificar `actualizar_contador_re...` para que también invoque el trigger de notificación?

**Consideraciones:**
- ✅ Ya se ejecuta cuando se actualiza `referidos`
- ⚠️ Es `BEFORE UPDATE`, no `AFTER UPDATE` (podría ser un problema)
- ⚠️ Modificar funciones existentes puede afectar funcionalidad actual

**Mejor opción:** Crear un nuevo trigger `AFTER UPDATE` específico para notificaciones

## 📋 Plan de Acción

### Opción A: Integración en Código (Recomendado)

1. **Encontrar dónde se crean referidos** (código)
   - Agregar invocación de `/api/notifications/triggers/referral-invited` después de INSERT

2. **Encontrar dónde se actualiza `verifico_whatsapp`** (código)
   - Agregar invocación de `/api/notifications/triggers/referral-verified` después de UPDATE

### Opción B: Nuevo Trigger en Supabase

1. **Crear función PostgreSQL** que invoque el endpoint de API
2. **Crear trigger `AFTER UPDATE`** en `referidos` que:
   - Detecte cuando `verifico_whatsapp` cambia de `false` a `true`
   - Invoque el endpoint `/api/notifications/triggers/referral-verified`

**⚠️ Limitación:** Requiere extensión `pg_net` o `http` en Supabase

## ✅ Conclusión

**Hallazgos:**
- ✅ Hay un trigger en `referidos` pero solo actualiza contadores
- ❌ NO hay trigger que cree referidos automáticamente
- ❌ NO hay trigger que invoque notificaciones

**Recomendación:**
- **Integración en código** es la mejor opción (más control, mejor debugging)
- El trigger existente puede quedarse como está (solo actualiza contadores)
- Necesitamos encontrar dónde se crean/actualizan referidos en el código

