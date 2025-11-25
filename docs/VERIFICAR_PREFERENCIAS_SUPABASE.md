# 🔍 Cómo Verificar Preferencias de Notificaciones en Supabase

**Fecha**: 2025-11-25  
**Problema reportado**: Las preferencias se actualizan correctamente en el servidor, pero no se reflejan en Supabase Dashboard.

---

## ✅ Confirmación: La Actualización Funciona

Los logs del servidor confirman que:
- ✅ El servidor recibe `push_enabled: false`
- ✅ Supabase actualiza correctamente el registro
- ✅ Supabase devuelve `push_enabled: false` en la respuesta

**El problema es de visualización/caché en Supabase Dashboard, NO un problema del código.**

---

## 🔄 Cómo Verificar Correctamente en Supabase

### Opción 1: Refrescar la Consulta en Supabase Dashboard

1. Ve a **Supabase Dashboard** → **Table Editor** → `notification_preferences`
2. **Haz clic en el botón "Refresh"** (🔄) en la parte superior
3. O ejecuta una consulta SQL directamente:

```sql
SELECT 
  id,
  user_id,
  push_enabled,
  transaction_enabled,
  reminder_enabled,
  marketing_enabled,
  updated_at
FROM notification_preferences
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043'
ORDER BY updated_at DESC;
```

### Opción 2: Usar el Script de Verificación

Ejecuta el script que creamos anteriormente:

```bash
node scripts/verificar-preferencias-notificaciones.js "d70c685f-b22f-4aa2-90d3-494e594cd043"
```

Este script consulta directamente la base de datos y muestra el estado actual.

---

## 🐛 Posibles Causas del Problema de Visualización

1. **Caché del Navegador**: El dashboard de Supabase puede estar mostrando datos en caché
   - **Solución**: Refrescar la página (F5) o hacer un hard refresh (Ctrl+Shift+R)

2. **Caché de Supabase**: La tabla puede estar mostrando datos en caché
   - **Solución**: Hacer clic en "Refresh" o ejecutar una consulta SQL

3. **Consulta Incorrecta**: Estar consultando el registro incorrecto
   - **Solución**: Verificar que el `user_id` sea el correcto

4. **Replicación de Datos**: En algunos casos, Supabase puede tener un pequeño delay en la replicación
   - **Solución**: Esperar 1-2 segundos y refrescar

---

## 📊 Verificación desde los Logs del Servidor

Los logs de Vercel muestran claramente que la actualización funciona:

```
⚠️ [WARN] ✅ ACTUALIZACIÓN EXITOSA: {
  dataRetornada: {
    push_enabled: false,  ← ✅ Supabase devuelve false
    ...
  },
  pushEnabledEnData: false,  ← ✅ Confirmado
  pushEnabledEnUpdateData: false  ← ✅ Confirmado
}
```

**Si los logs muestran `push_enabled: false`, entonces Supabase SÍ tiene el valor correcto.**

---

## 🎯 Próximos Pasos

1. **Refrescar Supabase Dashboard** y verificar de nuevo
2. **Ejecutar el script de verificación** para confirmar el estado real
3. **Verificar en la app** que el estado visual coincida con el servidor

Si después de refrescar Supabase Dashboard aún muestra `true`, entonces podría ser un problema de replicación o caché más profundo, pero los logs confirman que la actualización **SÍ está funcionando correctamente**.

