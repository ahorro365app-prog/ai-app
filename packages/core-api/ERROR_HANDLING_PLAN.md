# 🔧 Plan de Error Handling Consistente - Core API

**Fecha**: 2025-01-17  
**Estado**: En progreso

---

## ✅ Endpoints que YA usan handleError() (8)

1. ✅ `webhooks/baileys/route.ts`
2. ✅ `webhooks/whatsapp/route.ts`
3. ✅ `audio/process/route.ts`
4. ✅ `feedback/confirm/route.ts`
5. ✅ `payments/create/route.ts`
6. ✅ `payments/upload-receipt/route.ts`
7. ✅ `notifications/send/route.ts` (actualizado 2025-01-17)
8. ✅ `notifications/register-token/route.ts` (actualizado 2025-01-17)

---

## ⏳ Endpoints Pendientes de Actualización

### Prioridad ALTA (Críticos - Usan datos sensibles)

1. ⏳ `referrals/activate-smart/route.ts`
2. ⏳ `whatsapp/verify-code/route.ts`
3. ⏳ `whatsapp/send-verification-code/route.ts`
4. ⏳ `process-expense/route.ts`

### Prioridad MEDIA (Notificaciones)

5. ⏳ `notifications/campaigns/run/route.ts`
6. ⏳ `notifications/campaigns/route.ts`
7. ⏳ `notifications/campaigns/[id]/route.ts`
8. ⏳ `notifications/campaigns/[id]/execute/route.ts`
9. ⏳ `notifications/templates/route.ts`
10. ⏳ `notifications/templates/[id]/route.ts`
11. ⏳ `notifications/logs/route.ts`
12. ⏳ `notifications/logs/summary/route.ts`
13. ⏳ `notifications/logs/trend/route.ts`
14. ⏳ `notifications/preferences/route.ts`
15. ⏳ `notifications/triggers/route.ts`
16. ⏳ `notifications/triggers/[key]/route.ts`
17. ⏳ `notifications/triggers/[key]/run/route.ts`
18. ⏳ `notifications/triggers/referral-invited/route.ts`
19. ⏳ `notifications/triggers/referral-verified/route.ts`
20. ⏳ `notifications/events/route.ts`
21. ⏳ `notifications/monitoring/route.ts`
22. ⏳ `notifications/debug/create-log/route.ts`

### Prioridad BAJA (Admin, Migraciones, etc.)

23. ⏳ `admin/app-versions/route.ts`
24. ⏳ `admin/app-versions/stats/route.ts`
25. ⏳ `referrals/validate-code/route.ts`
26. ⏳ `feedback/stats/route.ts`
27. ⏳ `migrations/add-smart-fecha-inicio-programada/route.ts`
28. ⏳ `ai/route.ts`
29. ⏳ `app/version-check/route.ts`

---

## 🔧 Patrón de Actualización

### Antes:
```typescript
} catch (error: any) {
  console.error('Error en endpoint:', error);
  return NextResponse.json(
    { success: false, message: error?.message || 'Error interno' },
    { status: 500 }
  );
}
```

### Después:
```typescript
import { handleError, ErrorType } from '@/lib/errorHandler';

} catch (error: any) {
  return handleError(
    error,
    'Error interno',
    ErrorType.INTERNAL
  );
}
```

### Para errores de validación:
```typescript
import { handleValidationError } from '@/lib/errorHandler';

if (!body.field) {
  return handleValidationError('Campo requerido');
}
```

### Para errores de base de datos:
```typescript
if (dbError) {
  return handleError(
    dbError,
    'Error al procesar la solicitud',
    ErrorType.DATABASE
  );
}
```

---

## 📋 Checklist de Actualización

Para cada endpoint:

- [ ] Agregar import: `import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';`
- [ ] Reemplazar `console.error` + `NextResponse.json` con `handleError()`
- [ ] Reemplazar validaciones manuales con `handleValidationError()`
- [ ] Usar `ErrorType` apropiado (INTERNAL, DATABASE, VALIDATION, etc.)
- [ ] Verificar que no se exponen detalles internos en producción
- [ ] Probar que los errores retornan mensajes genéricos

---

## 🎯 Progreso

**Completado**: 8/37 endpoints (22%)  
**Pendiente**: 29 endpoints

---

**Última actualización**: 2025-01-17


