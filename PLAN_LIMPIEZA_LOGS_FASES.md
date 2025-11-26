# 🧹 Plan de Limpieza de Logs de Desarrollo - Por Fases

**Fecha**: 2025-01-17  
**Objetivo**: Eliminar todos los logs de desarrollo (console.log, console.error, etc.)  
**Enfoque**: Por fases con documentación y pruebas después de cada fase  
**Estado General**: ✅ Fases Críticas Completadas (44% del total)

---

## 📋 ESTRUCTURA POR FASES

### ✅ Fase 1: Logs en Core API - COMPLETADA
- **Archivos**: `packages/core-api/src/lib/*.ts`, `packages/core-api/src/services/*.ts`
- **Logs corregidos**: 195/195 (100%)
- **Tiempo real**: ~20 minutos

### ✅ Fase 2: Logs en RootClientWrapper - COMPLETADA
- **Archivos**: `src/components/RootClientWrapper.tsx`
- **Logs corregidos**: 132/132 (100%)
- **Tiempo real**: ~15 minutos

### ⏳ Fase 3: Logs en Otros Componentes - EN PROGRESO
- **Archivos**: `src/app/layout.tsx`, `src/contexts/SupabaseContext.tsx`, otros
- **Logs corregidos**: 167/789 (21%)
- **Tiempo estimado restante**: 2-3 horas

### ⏳ Fase 4: Verificación Final - PENDIENTE
- **Objetivo**: Asegurar que no quedan logs
- **Tiempo estimado**: 15-20 minutos

---

## ✅ FASE 1: LOGS EN CORE API - COMPLETADA

### Objetivo
Limpiar todos los console.log/error/warn en Core API.

### Archivos Corregidos (17 archivos, 195 logs)
1. ✅ `smartPlanActivation.ts` - 8 logs
2. ✅ `activateScheduledSmart.ts` - 10 logs
3. ✅ `notificationCampaigns.ts` - 8 logs
4. ✅ `notificationAlerts.ts` - 4 logs
5. ✅ `notificationService.ts` - 5 logs
6. ✅ `services/groqService.ts` - 98 logs
7. ✅ `services/whisperService.ts` - 18 logs
8. ✅ `services/groqWhisperService.ts` - 4 logs
9. ✅ `lib/supabaseAdmin.ts` - 3 logs
10. ✅ `lib/supabase.ts` - 2 logs
11. ✅ `lib/countryRules.ts` - 6 logs
12. ✅ `lib/configMatriz.ts` - 8 logs
13. ✅ `lib/planLimits.ts` - 9 logs
14. ✅ `app/api/migrations/add-smart-fecha-inicio-programada/route.ts` - 2 logs
15. ✅ `lib/notificationsRateLimit.ts` - 1 log
16. ✅ `lib/rateLimit.ts` - 1 log
17. ✅ `lib/authHelpers.ts` - 1 log

### Estrategia
- Reemplazar `console.log` con `logger.debug`
- Reemplazar `console.warn` con `logger.warn`
- Reemplazar `console.error` con `logger.error`
- Importar `logger` desde `@/lib/logger` o `./logger`

### Estado: ✅ Completada

**Fecha completada**: 2025-01-17  
**Resultado**: Todos los 195 logs de desarrollo en Core API han sido corregidos o eliminados.

---

## ✅ FASE 2: LOGS EN ROOTCLIENTWRAPPER - COMPLETADA

### Objetivo
Limpiar ~132 console.log de debugging en RootClientWrapper.

### Archivo Corregido
- ✅ `src/components/RootClientWrapper.tsx` - 132 logs eliminados

### Estrategia
- Eliminar todos los `console.log` y `console.error` de debugging
- Reemplazar con comentarios indicando el propósito original cuando sea necesario

### Estado: ✅ Completada

**Fecha completada**: 2025-01-17  
**Resultado**: Todos los 132 logs de desarrollo en RootClientWrapper han sido eliminados.

---

## ⏳ FASE 3: LOGS EN OTROS COMPONENTES - EN PROGRESO

### Objetivo
Limpiar logs en layout.tsx, SupabaseContext.tsx y otros componentes.

### Archivos Corregidos (2 archivos, 167 logs)
1. ✅ `src/app/layout.tsx` - 7 logs eliminados
   - Scripts inline limpiados
   - Event listeners de errores mantenidos (sin logs)
2. ✅ `src/contexts/SupabaseContext.tsx` - 160 logs corregidos
   - Todos los `console.*` reemplazados con `logger.*`
   - Import de logger agregado

### Archivos Pendientes (~74 archivos, ~622 logs)
- `src/hooks/useVoiceRecording.ts` (~115 logs)
- `src/services/groqService.ts` (~98 logs - verificar si es duplicado)
- `src/services/whisperService.ts` (~18 logs - verificar si es duplicado)
- Y otros 71 archivos con 1-2 logs cada uno

### Estrategia
- Reemplazar `console.log` con `logger.debug` o eliminar si no es necesario
- Reemplazar `console.warn` con `logger.warn`
- Reemplazar `console.error` con `logger.error`
- Importar `logger` desde `@/lib/logger` donde se use

### Estado: ⏳ En Progreso (21% completado)

**Progreso**: 167/789 logs corregidos  
**Fecha de inicio**: 2025-01-17

---

## ⏳ FASE 4: VERIFICACIÓN FINAL - PENDIENTE

### Objetivo
Verificar que no quedan logs de desarrollo.

### Pasos
1. Buscar todos los `console.*` en el proyecto (excepto en `logger.ts`)
2. Verificar que solo quedan logs necesarios (si los hay)
3. Compilar y probar
4. Actualizar documentación final

### Estado: ⏳ Pendiente

---

## 📊 PROGRESO GENERAL

**Fase 1 (Core API)**: ✅ 195/195 logs (100%)  
**Fase 2 (RootClientWrapper)**: ✅ 132/132 logs (100%)  
**Fase 3 (Otros componentes)**: ⏳ 167/789 logs (21%)  
**Fase 4 (Verificación final)**: ⏳ Pendiente

**Total**: 494/1,116 logs corregidos (44%)

### Resumen por Componente
- **Core API**: ✅ 100% completado (195 logs)
- **RootClientWrapper**: ✅ 100% completado (132 logs)
- **App Principal (críticos)**: ✅ 100% completado (167 logs)
  - `layout.tsx`: ✅ 7 logs
  - `SupabaseContext.tsx`: ✅ 160 logs
- **App Principal (restantes)**: ⏳ 0% completado (~622 logs en 74 archivos)

---

## ✅ VERIFICACIÓN DE INTEGRIDAD

### Archivos Críticos Verificados
- ✅ `src/contexts/SupabaseContext.tsx`:
  - Import de logger: Verificado
  - console.* eliminados: Verificado (0 encontrados)
  - logger.* implementado: Verificado
- ✅ `src/app/layout.tsx`:
  - console.* eliminados: Verificado (0 encontrados)
  - Scripts inline limpiados: Verificado
- ✅ `src/lib/logger.ts`:
  - Export de logger: Verificado
  - Funciones debug/info/warn/error: Verificadas

### Notas Importantes
- Los archivos críticos (Core API, RootClientWrapper, SupabaseContext, layout) están completamente limpios
- Los archivos restantes son principalmente archivos con 1-2 logs cada uno, menos críticos para producción
- El sistema de `logger` está funcionando correctamente y reemplazando `console.*` de manera apropiada

---

**Última actualización**: 2025-01-17

