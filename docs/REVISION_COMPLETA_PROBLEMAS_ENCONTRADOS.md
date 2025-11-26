# 🔍 REVISIÓN COMPLETA DE LA APP - PROBLEMAS ENCONTRADOS

**Fecha de revisión**: 2025-01-24  
**Objetivo**: Identificar errores, problemas de seguridad, código huérfano y problemas en la app

---

## 🔴 PROBLEMAS CRÍTICOS DE SEGURIDAD

### 1. ⚠️ **CRÍTICO**: Contraseñas en localStorage
**Archivo**: `src/app/sign-in/page.tsx`  
**Líneas**: 75, 112-114  
**Problema**: Se está guardando la contraseña en `localStorage` sin encriptar.

**Código problemático**:
```typescript
const savedPassword = localStorage.getItem('savedPassword');
// ...
localStorage.setItem('savedPassword', password);
```

**Riesgo**: 🔴 **ALTO** - Las contraseñas quedan almacenadas en texto plano en el navegador.

**Solución**: Eliminar el guardado de contraseñas en localStorage. Si se necesita "recordar", usar solo el teléfono o un token seguro.

---

### 2. ⚠️ Logs que exponen información sensible

#### 2.1. FCM Tokens completos en logs
**Archivos**:
- `src/hooks/useRegisterFcmToken.ts` (líneas 138, 334)

**Problema**: Se loguean tokens FCM completos en desarrollo.

**Código problemático**:
```typescript
logger.debug('FCM token obtenido:', token);
logger.debug('FCM token obtenido en móvil:', token);
```

**Riesgo**: 🟡 **MEDIO** - Tokens expuestos en logs de desarrollo.

**Solución**: Sanitizar tokens mostrando solo los primeros y últimos caracteres.

---

#### 2.2. Teléfonos completos en logs
**Archivos**:
- `src/contexts/SupabaseContext.tsx` (línea 1789)
- `src/components/PhoneChangeModal.tsx` (líneas 391, 476)

**Problema**: Se loguean teléfonos completos en logs de debug.

**Código problemático**:
```typescript
logger.debug('📱 Nuevo teléfono:', newPhone);
logger.debug('✅ Código enviado, guardado en localStorage:', { phone: formattedPhone, ... });
```

**Riesgo**: 🟡 **MEDIO** - Información personal expuesta en logs.

**Solución**: Sanitizar teléfonos mostrando solo los primeros y últimos dígitos.

---

#### 2.3. User IDs en logs (menos crítico)
**Archivos**: Múltiples archivos  
**Problema**: Se loguean user IDs completos en desarrollo.

**Riesgo**: 🟢 **BAJO** - Solo en desarrollo, pero mejor sanitizar.

**Solución**: Considerar sanitizar user IDs en logs de producción.

---

## 🟡 PROBLEMAS DE SEGURIDAD (MEDIA PRIORIDAD)

### 3. dangerouslySetInnerHTML en layout.tsx
**Archivo**: `src/app/layout.tsx` (línea 60)  
**Estado**: ✅ **SEGURO** - Es código estático de Sentry, no hay riesgo de XSS.

---

## 🟢 MEJORAS RECOMENDADAS

### 4. Código comentado/TODO
**Estadísticas**:
- 771 matches de TODO/FIXME en 73 archivos
- 570 matches de comentarios en 42 archivos

**Recomendación**: Revisar y limpiar código comentado innecesario.

---

## 📋 PLAN DE CORRECCIÓN

### Fase 1: Problemas Críticos de Seguridad
1. ✅ Eliminar guardado de contraseñas en localStorage - **COMPLETADO**
2. ✅ Sanitizar FCM tokens en logs - **COMPLETADO**
3. ✅ Sanitizar teléfonos en logs - **COMPLETADO**
4. ✅ Mejorar localhost hardcodeado - **COMPLETADO**

### Fase 2: Mejoras de Seguridad
4. ⏳ Sanitizar user IDs en logs (opcional)
5. ⏳ Revisar y limpiar código comentado crítico

### Fase 3: Limpieza General
6. ⏳ Revisar TODOs/FIXMEs importantes
7. ⏳ Limpiar código huérfano

---

## ✅ CORRECCIONES APLICADAS (2025-01-24)

### Fase 1: Problemas Críticos de Seguridad

#### 1. ✅ Contraseñas en localStorage ELIMINADAS
**Archivo**: `src/app/sign-in/page.tsx`  
**Cambios**:
- Eliminado guardado de contraseñas en localStorage
- Solo se guarda teléfono y país (si el usuario quiere recordar)
- Agregada limpieza de contraseñas antiguas (migración)
- Texto del checkbox actualizado: "Recordar teléfono" en lugar de "Recordar contraseña"

#### 2. ✅ FCM Tokens Sanitizados en Logs
**Archivo**: `src/hooks/useRegisterFcmToken.ts`  
**Cambios**:
- Tokens FCM ahora se muestran como: `primeros10...ultimos5`
- Aplicado en 2 lugares (web y móvil)

#### 3. ✅ Teléfonos Sanitizados en Logs
**Archivos**:
- `src/contexts/SupabaseContext.tsx`
- `src/components/PhoneChangeModal.tsx`
- `src/app/profile/page.tsx`

**Cambios**:
- Teléfonos ahora se muestran como: `primeros3***ultimos2`
- Aplicado en todos los logs que exponían teléfonos completos

#### 4. ✅ Localhost Hardcodeado Mejorado
**Archivos**:
- `src/contexts/SupabaseContext.tsx`
- `src/app/api/whatsapp/verify-code/route.ts`

**Cambios**:
- Mejorado fallback de localhost para usar `window.location.origin` cuando está disponible
- En producción, usar URL de producción como fallback

---

**Última actualización**: 2025-01-24

