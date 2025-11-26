# 🔍 AUDITORÍA DE LOGS DE SEGURIDAD

**Fecha**: 2025  
**Objetivo**: Identificar logs que puedan exponer información sensible  
**Estado**: En revisión

---

## 📊 RESUMEN EJECUTIVO

### Problemas Encontrados
- ⚠️ **147 instancias** de `console.log/error/warn` en endpoints de API
- ⚠️ **Algunos logs** pueden exponer información sensible en producción
- ✅ **Sistema de logger** existe pero no se usa en todos los lugares

### Estado General
- ✅ **Logger seguro** implementado (`src/lib/logger.ts`)
- ⚠️ **Muchos endpoints** aún usan `console.*` directamente
- ⚠️ **Algunos logs** pueden exponer datos sensibles

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. Logs en Endpoints de API (147 instancias)

**Ubicación**: `src/app/api/**/*.ts`

**Problema**:
- Muchos endpoints usan `console.log/error/warn` directamente
- Algunos pueden exponer información sensible en producción
- No usan el sistema de logger seguro

**Archivos más críticos**:
- `src/app/api/webhooks/whatsapp/route.ts`
- `src/app/api/webhooks/baileys/route.ts`
- `src/app/api/audio/process/route.ts`
- `src/app/api/payments/create/route.ts`
- `src/app/api/notifications/send/route.ts`

---

## 🔍 REVISIÓN DETALLADA

### Endpoints que Necesitan Revisión

#### 1. Webhooks (`/api/webhooks/*`)
**Riesgo**: ALTO
- Pueden recibir datos sensibles de WhatsApp
- Necesitan logging seguro

#### 2. Procesamiento de Audio (`/api/audio/process`)
**Riesgo**: MEDIO
- Puede recibir `user_id` en el body
- Necesita validación y logging seguro

#### 3. Pagos (`/api/payments/*`)
**Riesgo**: ALTO
- Maneja información financiera sensible
- Necesita logging muy seguro

#### 4. Notificaciones (`/api/notifications/*`)
**Riesgo**: MEDIO
- Puede recibir tokens FCM
- Necesita logging seguro

---

## ✅ SOLUCIONES RECOMENDADAS

### 1. Reemplazar `console.*` con `logger.*`

**Mapeo**:
```typescript
// ❌ ANTES
console.log('Mensaje')        → logger.debug('Mensaje')
console.error('Error:', err)  → logger.error('Error:', err)
console.warn('Advertencia')   → logger.warn('Advertencia')

// ✅ DESPUÉS
import { logger } from '@/lib/logger';
logger.debug('Mensaje')
logger.error('Error:', err)
logger.warn('Advertencia')
```

### 2. Sanitizar Datos Sensibles

**Antes de loguear**:
```typescript
// ❌ MAL
console.log('User data:', user)  // Puede exponer password, tokens, etc.

// ✅ BIEN
logger.debug('User data:', {
  id: user.id,
  email: user.email,
  // NO incluir: password, tokens, API keys, etc.
})
```

### 3. No Loguear en Producción

**El logger.ts ya maneja esto**:
- `logger.debug()` - Solo en desarrollo
- `logger.info()` - Solo en desarrollo
- `logger.warn()` - Siempre visible
- `logger.error()` - Siempre visible

---

## 📝 PLAN DE ACCIÓN

### FASE 1: Endpoints Críticos (Prioridad ALTA)
1. Revisar y corregir `/api/webhooks/*`
2. Revisar y corregir `/api/payments/*`
3. Revisar y corregir `/api/audio/process`

### FASE 2: Endpoints Importantes (Prioridad MEDIA)
1. Revisar y corregir `/api/notifications/*`
2. Revisar y corregir otros endpoints de API

### FASE 3: Verificación Final
1. Buscar todos los `console.*` restantes
2. Verificar que no expongan información sensible
3. Reemplazar con `logger.*` donde sea necesario

---

## 🔒 REGLAS DE SEGURIDAD PARA LOGS

### ❌ NUNCA Loguear
- Contraseñas (ni hasheadas)
- Tokens (JWT, API keys, etc.)
- Secrets (claves de servicio, etc.)
- Datos financieros completos (solo IDs o montos sin contexto)
- Información personal completa (solo IDs o datos anonimizados)

### ✅ SÍ Loguear (con cuidado)
- IDs de usuario (sin otros datos)
- Errores (sin stack traces completos en producción)
- Operaciones exitosas (solo en desarrollo)
- Métricas y estadísticas (sin datos personales)

---

## 📊 ESTADÍSTICAS

- **Total de `console.*` encontrados**: 147 instancias
- **Archivos afectados**: ~40 archivos
- **Endpoints críticos**: 5
- **Riesgo general**: MEDIO-ALTO

---

**Próximo paso**: Revisar y corregir endpoints críticos







