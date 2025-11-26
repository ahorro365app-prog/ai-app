# 🚀 Guía de Migración: Core API Separado

## ✅ Estado Actual

### Completado:
- ✅ Estructura `packages/core-api/` creada
- ✅ APIs de app móvil copiadas a `packages/core-api/src/app/api/`
- ✅ Código compartido movido a `packages/shared/lib/`
- ✅ Workspaces configurados en `package.json` root
- ✅ Configuración de Vercel para `core-api`

### Pendiente:
- ⏳ Actualizar imports en APIs (usar `@ahorro365/shared`)
- ⏳ Copiar dependencias necesarias (services, etc.)
- ⏳ Crear proyecto Vercel `ahorro365-core-api`
- ⏳ Actualizar `capacitor.config.ts`
- ⏳ Deploy y verificar

---

## 📋 Próximos Pasos

### 1. Actualizar Imports en Core API

Las APIs en `packages/core-api/src/app/api/` necesitan actualizar sus imports:

**Antes:**
```typescript
import { createClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';
```

**Después:**
```typescript
import { createClient } from '@ahorro365/shared/lib/supabase';
import { checkRateLimit } from '@ahorro365/shared/lib/rateLimit';
```

### 2. Copiar Servicios y Dependencias

Mover servicios que usan las APIs:
- `src/services/groqService.ts` → `packages/core-api/src/services/`
- `src/services/groqWhisperService.ts` → `packages/core-api/src/services/`
- Otros servicios necesarios

### 3. Crear Proyecto Vercel

1. Ve a Vercel Dashboard
2. Clic en "Add New Project"
3. Conecta el repositorio `ai-app`
4. Configura:
   - **Root Directory**: `packages/core-api`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Agrega variables de entorno (mismas que el proyecto actual)
6. Deploy

### 4. Actualizar Capacitor Config

```typescript
// capacitor.config.ts
const SERVER_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.CAPACITOR_SERVER_URL ||
  'https://ahorro365-core-api.vercel.app'; // Nuevo dominio
```

### 5. Re-compilar APK

```bash
npm run build:apk
```

---

## 🔍 Verificación

### Probar Core API:
```bash
# Health check
curl https://ahorro365-core-api.vercel.app/api/ping

# Debería retornar:
{
  "ok": true,
  "service": "core",
  "runtime": "node",
  "timestamp": 1234567890
}
```

### Probar en App Móvil:
1. Instalar nuevo APK
2. Verificar que las APIs funcionen
3. Probar funcionalidades principales

---

## 📝 Notas

- El proyecto `ahorro365-core` actual puede quedar como backup
- Una vez verificado, podemos eliminar las APIs del proyecto principal
- El admin-dashboard seguirá funcionando independientemente

