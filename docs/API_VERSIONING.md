# 📋 Estrategia de Versionado de API

Este documento describe la estrategia de versionado de APIs para el proyecto.

## 🎯 Objetivo

Permitir evolución de APIs sin romper clientes existentes mediante versionado explícito.

## 📐 Estructura Propuesta

### Opción 1: Versionado en URL (Recomendado)

```
/api/v1/payments/create
/api/v1/payments/upload-receipt
/api/v2/payments/create  (nueva versión)
```

**Ventajas**:
- Claro y explícito
- Fácil de entender
- Permite mantener múltiples versiones activas

**Desventajas**:
- Requiere refactorizar rutas existentes
- Puede crear duplicación de código

### Opción 2: Versionado en Header

```
POST /api/payments/create
Headers:
  API-Version: 1
```

**Ventajas**:
- No requiere cambiar URLs
- Más limpio desde el punto de vista de URLs

**Desventajas**:
- Menos visible
- Requiere middleware adicional

## 🚀 Plan de Implementación

### Fase 1: Preparación (Actual)

1. ✅ Documentar estrategia (este documento)
2. ⏳ Identificar endpoints críticos que necesitan versionado
3. ⏳ Planificar migración de endpoints existentes

### Fase 2: Implementación Inicial

1. Crear estructura de carpetas:
   ```
   src/app/api/v1/
   src/app/api/v2/
   ```

2. Migrar endpoints críticos a `/api/v1/`:
   - `/api/payments/create` → `/api/v1/payments/create`
   - `/api/payments/upload-receipt` → `/api/v1/payments/upload-receipt`
   - `/api/audio/process` → `/api/v1/audio/process`

3. Mantener compatibilidad temporal:
   - Redirigir `/api/payments/create` → `/api/v1/payments/create`
   - O mantener ambos activos durante período de transición

### Fase 3: Versionado Activo

1. Cuando se necesite cambiar un endpoint:
   - Crear nueva versión en `/api/v2/`
   - Mantener `/api/v1/` activo
   - Documentar cambios en changelog

2. Deprecar versiones antiguas:
   - Agregar header `Deprecation: true` en respuestas
   - Agregar header `Sunset: <fecha>` indicando cuándo se desactivará
   - Notificar a clientes con tiempo suficiente

## 📝 Endpoints Críticos para Versionado

### Prioridad Alta (Versionar primero)

1. **Payments**
   - `/api/payments/create`
   - `/api/payments/upload-receipt`

2. **Audio Processing**
   - `/api/audio/process`

3. **Feedback**
   - `/api/feedback/confirm`

### Prioridad Media

4. **Notifications**
   - `/api/notifications/register-token`
   - `/api/notifications/preferences`

5. **Referrals**
   - `/api/referrals/activate-smart`

## 🔄 Proceso de Migración

### Cuando crear una nueva versión:

1. **Identificar necesidad de cambio breaking**:
   - Cambio en estructura de request/response
   - Eliminación de campos
   - Cambio en validaciones que rompe clientes existentes

2. **Crear nueva versión**:
   - Copiar endpoint a `/api/v2/`
   - Implementar cambios
   - Documentar diferencias

3. **Comunicar cambio**:
   - Actualizar documentación
   - Notificar a clientes (si aplica)
   - Agregar headers de deprecación a versión antigua

4. **Planificar sunset**:
   - Establecer fecha de desactivación (mínimo 3 meses)
   - Comunicar a clientes
   - Monitorear uso de versión antigua

## 📊 Headers de Versionado

### Headers en Respuestas

```http
API-Version: 1
Deprecation: false
Sunset: (solo si está deprecado)
```

### Headers en Requests (Opcional)

```http
API-Version: 1
Accept-Version: 1
```

## 📚 Ejemplo de Implementación

### Endpoint v1 (Actual)

```typescript
// src/app/api/v1/payments/create/route.ts
export async function POST(req: NextRequest) {
  // Implementación actual
}
```

### Endpoint v2 (Nueva versión)

```typescript
// src/app/api/v2/payments/create/route.ts
export async function POST(req: NextRequest) {
  // Nueva implementación con cambios
  const response = NextResponse.json({...});
  response.headers.set('API-Version', '2');
  return response;
}
```

## ⚠️ Mejores Prácticas

1. **No versionar por cambios menores**:
   - Solo versionar cuando hay breaking changes
   - Cambios no-breaking pueden ir en la misma versión

2. **Mantener versiones activas**:
   - Mínimo 2 versiones activas simultáneamente
   - Dar tiempo suficiente para migración (3-6 meses)

3. **Documentar cambios**:
   - Mantener changelog por versión
   - Documentar diferencias entre versiones

4. **Monitorear uso**:
   - Trackear qué versión usa cada cliente
   - Identificar cuándo es seguro deprecar versión antigua

## 🔮 Roadmap

- **Q1 2025**: Implementar estructura de versionado
- **Q2 2025**: Migrar endpoints críticos a v1
- **Q3 2025**: Implementar v2 para primeros cambios breaking
- **Q4 2025**: Deprecar endpoints sin versión explícita

---

**Última actualización**: 2025-01-18


