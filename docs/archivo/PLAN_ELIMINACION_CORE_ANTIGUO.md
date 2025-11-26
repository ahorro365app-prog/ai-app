# 🗑️ Plan de Eliminación: ahorro365-core (Antiguo)

## 📋 Estado Actual

- ✅ **ahorro365-core-api** - Nuevo proyecto separado (funcionando)
- ⚠️ **ahorro365-core** - Proyecto antiguo (con problemas de middleware)

## ✅ Recomendación: Mantener Ambos TEMPORALMENTE

### Razones para NO eliminar aún:

1. **Backup del proyecto original**
   - Si algo falla en el nuevo proyecto, tenemos rollback inmediato
   - Las APIs originales siguen funcionando (aunque con problemas)

2. **App móvil aún apunta al antiguo**
   - `capacitor.config.ts` apunta a `ahorro365-core.vercel.app`
   - Si eliminamos el proyecto, la app móvil dejará de funcionar inmediatamente

3. **Verificación pendiente**
   - Necesitamos verificar que `ahorro365-core-api` funciona correctamente
   - Probar todas las APIs antes de hacer el switch

---

## 🚀 Plan de Migración (Antes de Eliminar)

### Fase 1: Verificación (HOY)

1. ✅ Verificar que `ahorro365-core-api` está desplegado
2. ✅ Probar `/api/ping` en el nuevo dominio
3. ✅ Verificar que el build fue exitoso

### Fase 2: Actualización (HOY)

1. ⏳ Actualizar `capacitor.config.ts`:
   ```typescript
   const SERVER_URL = 'https://ahorro365-core-api.vercel.app';
   ```

2. ⏳ Re-compilar APK con nuevo dominio
3. ⏳ Probar app móvil end-to-end

### Fase 3: Verificación Final (HOY)

1. ⏳ Probar todas las funcionalidades:
   - Login/Registro
   - Procesamiento de audio
   - Procesamiento de gastos
   - Notificaciones
   - Pagos
   - Referidos

2. ⏳ Verificar que no hay errores

### Fase 4: Eliminación (DESPUÉS de verificar)

1. ⏳ Una vez que TODO funciona con `ahorro365-core-api`
2. ⏳ Eliminar proyecto `ahorro365-core` en Vercel
3. ⏳ Opcional: Eliminar APIs de `src/app/api/` del repo (limpieza)

---

## ⚠️ NO Eliminar Ahora Porque:

- ❌ La app móvil aún usa el dominio antiguo
- ❌ No hemos verificado que el nuevo proyecto funciona
- ❌ No tenemos rollback si algo falla

---

## ✅ Cuándo Eliminar:

- ✅ `ahorro365-core-api` está funcionando correctamente
- ✅ `capacitor.config.ts` apunta al nuevo dominio
- ✅ APK re-compilado y probado
- ✅ Todas las funcionalidades verificadas

---

## 📝 Nota

Una vez eliminado `ahorro365-core`, podemos también limpiar el código:
- Eliminar `src/app/api/` (ya están en `packages/core-api/`)
- Esto reducirá el tamaño del proyecto principal

