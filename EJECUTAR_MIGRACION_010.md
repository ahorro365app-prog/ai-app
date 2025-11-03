# 🚀 EJECUTAR MIGRACIÓN 010: parent_message_id

## ⚠️ IMPORTANTE
Esta migración es **CRÍTICA** para que funcione el sistema de múltiples transacciones.

---

## 📋 PASOS PARA EJECUTAR

### Opción 1: Via Dashboard de Supabase (RECOMENDADO)

1. **Ir a Supabase Dashboard:**
   - Abrir: https://supabase.com/dashboard
   - Seleccionar proyecto: `ahorro365` o similar

2. **Ir a SQL Editor:**
   - Menú lateral: `SQL Editor`
   - Clic en `New query`

3. **Copiar y pegar:**
   ```sql
   -- Agregar parent_message_id para agrupar transacciones del mismo mensaje
   -- Permite identificar múltiples predicciones que vienen de un solo mensaje WhatsApp

   ALTER TABLE predicciones_groq
   ADD COLUMN IF NOT EXISTS parent_message_id VARCHAR(255);

   ALTER TABLE pending_confirmations
   ADD COLUMN IF NOT EXISTS parent_message_id VARCHAR(255);

   -- Índices para búsquedas rápidas
   CREATE INDEX IF NOT EXISTS idx_parent_message_id 
   ON predicciones_groq(parent_message_id);

   CREATE INDEX IF NOT EXISTS idx_pending_parent_message 
   ON pending_confirmations(parent_message_id);

   -- Comentarios para documentación
   COMMENT ON COLUMN predicciones_groq.parent_message_id 
   IS 'ID del mensaje WhatsApp original que generó estas predicciones (para agrupar múltiples TX)';

   COMMENT ON COLUMN pending_confirmations.parent_message_id 
   IS 'ID del mensaje WhatsApp original que generó esta confirmación (para agrupar múltiples TX)';
   ```

4. **Ejecutar:**
   - Clic en `Run` o presionar `Ctrl+Enter`

5. **Verificar:**
   - Debería mostrar: `Success. No rows returned`
   - Si hay error, verificar que las tablas existan

---

### Opción 2: Via CLI (Si tienes supabase CLI instalado)

```bash
cd admin-dashboard
supabase db push
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

### Verificar que las columnas se agregaron:

```sql
-- Verificar predicciones_groq
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'predicciones_groq'
AND column_name = 'parent_message_id';

-- Verificar pending_confirmations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pending_confirmations'
AND column_name = 'parent_message_id';

-- Verificar índices
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN ('idx_parent_message_id', 'idx_pending_parent_message');
```

---

## 🧪 TEST RÁPIDO

Una vez ejecutada la migración, prueba enviando:

**WhatsApp:**
```
compré 5 bs de pan, pagué 10 de taxi, compré 70 de carne
```

**Resultado esperado:**
- Preview muestra las 3 transacciones
- Al confirmar, se guardan las 3
- En BD: 3 predicciones_groq con mismo parent_message_id
- En BD: 3 transacciones separadas

---

## ❌ SI FALLA

### Error: "column already exists"
**Solución:** La migración ya se ejecutó antes. Continuar.

### Error: "relation does not exist"
**Solución:** Las tablas no existen. Ejecutar migraciones anteriores primero:
- `007_pending_confirmations.sql`
- `009_add_original_timestamp.sql`

### Error: "permission denied"
**Solución:** Verificar que estás usando la SQL Editor con permisos de admin.

---

## 📝 NOTAS

- La migración usa `IF NOT EXISTS`, es **segura** de ejecutar múltiples veces
- No afecta datos existentes (columna nullable)
- Compatible con código ya desplegado en Vercel

---

## ✅ DESPUÉS DE LA MIGRACIÓN

1. ✅ Verificar en Supabase Dashboard
2. ✅ Esperar 1 min para que Vercel detecte cambios
3. ✅ Probar mensaje múltiple por WhatsApp
4. ✅ Revisar logs en Vercel para verificar

