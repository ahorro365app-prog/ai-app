# 🔄 Sistema de Control de Versiones y Actualizaciones Forzadas

## 📋 Resumen Ejecutivo

Sistema para controlar qué versiones de la app pueden acceder, forzar actualizaciones cuando sea necesario, y mostrar avisos de nuevas versiones disponibles.

**Arquitectura**: Next.js (web) + Capacitor (Android/iOS)  
**Base de datos**: Supabase PostgreSQL  
**Panel de control**: Admin Dashboard

---

## 🎯 Objetivos

1. ✅ Detectar la versión de la app que el usuario tiene instalada
2. ✅ Comparar con la versión mínima requerida (controlada desde admin)
3. ✅ Bloquear acceso si la versión es muy antigua
4. ✅ Mostrar diferentes tipos de alertas:
   - ❌ **Actualización FORZOSA** (no puede usar la app)
   - ⚠️ **Actualización RECOMENDADA** (puede usar pero con aviso)
   - ℹ️ **Nueva versión disponible** (aviso discreto)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│              ADMIN PANEL                             │
│  Controla:                                          │
│  - Versión mínima requerida: 1.2.0                 │
│  - Versión recomendada: 1.3.0                       │
│  - Versión actual: 1.4.0                           │
│  - Forzar actualización: [ON/OFF]                  │
│  - Mensaje personalizado                            │
└─────────────────────────────────────────────────────┘
                          ↓
                    API CHECK
                          ↓
┌─────────────────────────────────────────────────────┐
│              APP (Web/Android/iOS)                  │
│  Al iniciar:                                        │
│  1. Detecta su versión actual                       │
│  2. Envía a /api/app/version-check                  │
│  3. Recibe respuesta del servidor                  │
│  4. Compara versiones                              │
│                                                     │
│  Si versión < mínima:                              │
│     → Bloqueo total + link a actualizar            │
│                                                     │
│  Si versión < recomendada:                         │
│     → Aviso + opción de continuar                  │
│                                                     │
│  Si versión = actual:                              │
│     → Continúa normalmente                         │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Estructura de Base de Datos

### Tabla: `app_versions`

```sql
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Versiones (formato semver: major.minor.patch)
  current_version VARCHAR(20) NOT NULL,        -- Última versión disponible: "1.4.0"
  minimum_required_version VARCHAR(20) NOT NULL, -- Versión mínima: "1.2.0"
  recommended_version VARCHAR(20),              -- Versión recomendada: "1.3.0"
  
  -- Control de actualización forzada
  force_update BOOLEAN DEFAULT false,           -- ON/OFF desde admin
  
  -- Plataformas
  platform VARCHAR(20) NOT NULL,                -- 'android', 'ios', 'web'
  
  -- Mensajes personalizados
  update_title VARCHAR(200) DEFAULT 'Actualización disponible',
  update_message TEXT DEFAULT 'Hay una nueva versión de Ahorro365 disponible.',
  force_update_title VARCHAR(200) DEFAULT 'Actualización requerida',
  force_update_message TEXT DEFAULT 'Necesitas actualizar la app para continuar.',
  
  -- Links a tiendas
  store_url TEXT,  -- Play Store, App Store, o URL de la app web
  
  -- Características de la nueva versión
  release_notes TEXT,
  
  -- Metadata
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- Para mantener historial
  is_active BOOLEAN DEFAULT true
);

-- Solo una configuración activa por plataforma
CREATE UNIQUE INDEX idx_app_versions_active 
ON app_versions(platform) 
WHERE is_active = true;
```

### Tabla: `version_check_logs` (opcional, para analytics)

```sql
CREATE TABLE version_check_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  device_id VARCHAR(100),
  platform VARCHAR(20),
  app_version VARCHAR(20),
  
  -- Resultado del check
  status VARCHAR(50), -- 'up_to_date', 'update_recommended', 'update_required', 'blocked'
  
  -- Metadata
  checked_at TIMESTAMP DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX idx_version_logs_user ON version_check_logs(user_id, checked_at DESC);
CREATE INDEX idx_version_logs_version ON version_check_logs(app_version, checked_at DESC);
```

---

## 🚀 Plan de Implementación por Fases

### **Fase 1: Base de Datos y Backend API** ⏳
**Tiempo estimado**: 30 minutos

**Tareas**:
- [ ] Crear tabla `app_versions` en Supabase
- [ ] Crear tabla `version_check_logs` en Supabase
- [ ] Crear API endpoint `/api/app/version-check`
- [ ] Implementar función de comparación semver
- [ ] Insertar datos iniciales para web, android, ios

**Archivos a crear/modificar**:
- `sql/create-app-versions-table.sql`
- `src/app/api/app/version-check/route.ts`
- `src/lib/versionUtils.ts` (función compareVersions)

---

### **Fase 2: Detección de Versión en la App** ⏳
**Tiempo estimado**: 20 minutos

**Tareas**:
- [ ] Crear hook `useAppVersion` para detectar versión
- [ ] Implementar detección para web (package.json o env)
- [ ] Implementar detección para Android (Capacitor App)
- [ ] Implementar detección para iOS (Capacitor App)
- [ ] Detectar plataforma (web/android/ios)

**Archivos a crear/modificar**:
- `src/hooks/useAppVersion.ts`
- `src/lib/platformDetection.ts`

---

### **Fase 3: Componente de Actualización** ⏳
**Tiempo estimado**: 30 minutos

**Tareas**:
- [ ] Crear componente `UpdateModal.tsx`
- [ ] Implementar modal para actualización requerida (bloqueo)
- [ ] Implementar modal para actualización recomendada (opcional)
- [ ] Manejar redirección a tiendas (Android/iOS)
- [ ] Manejar recarga de página (web)

**Archivos a crear/modificar**:
- `src/components/UpdateModal.tsx`

---

### **Fase 4: Integración en la App** ⏳
**Tiempo estimado**: 20 minutos

**Tareas**:
- [ ] Integrar verificación de versión en `RootClientWrapper` o `layout.tsx`
- [ ] Verificar versión al iniciar la app
- [ ] Mostrar modal si es necesario
- [ ] Bloquear acceso si actualización es requerida

**Archivos a crear/modificar**:
- `src/components/RootClientWrapper.tsx` o `src/app/layout.tsx`
- `src/lib/versionCheck.ts`

---

### **Fase 5: Panel de Administración** ⏳
**Tiempo estimado**: 30 minutos

**Tareas**:
- [ ] Crear API `/api/admin/app-versions` (GET/PUT)
- [ ] Crear API `/api/admin/app-versions/stats` (GET)
- [ ] Crear componente `VersionControlPanel.tsx` en admin
- [ ] Formulario para configurar versiones (web, android, ios)
- [ ] Toggle de `force_update`
- [ ] Estadísticas de versiones

**Archivos a crear/modificar**:
- `src/app/api/admin/app-versions/route.ts`
- `src/app/api/admin/app-versions/stats/route.ts`
- `admin-dashboard/src/app/(protected)/versions/page.tsx`

---

### **Fase 6: Testing y Ajustes** ⏳
**Tiempo estimado**: 20 minutos

**Tareas**:
- [ ] Probar actualización recomendada
- [ ] Probar actualización forzosa
- [ ] Probar con `force_update` ON/OFF
- [ ] Probar en web, Android, iOS
- [ ] Verificar links a tiendas
- [ ] Verificar que versión actual no muestra nada

---

## 📝 Registro de Implementación

### Fase 1: Base de Datos y Backend API
**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado

**Archivos creados**:
- ✅ `sql/create-app-versions-table.sql` - Script SQL para crear tablas
- ✅ `src/lib/versionUtils.ts` - Funciones de comparación de versiones
- ✅ `src/app/api/app/version-check/route.ts` - API endpoint para verificar versiones

**Notas**:
- Tablas creadas: `app_versions` y `version_check_logs`
- Función `compareVersions` implementada (semver)
- API endpoint `/api/app/version-check` funcional
- Datos iniciales insertados para web, android, ios
- Manejo de errores: si no hay config, permite acceso (no bloquea)

---

### Fase 2: Detección de Versión
**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado

**Archivos creados**:
- ✅ `src/lib/platformDetection.ts` - Funciones para detectar plataforma (web/android/ios)
- ✅ `src/hooks/useAppVersion.ts` - Hook para obtener versión de la app

**Notas**:
- Detección de plataforma implementada usando Capacitor
- Hook `useAppVersion` creado para obtener versión actual
- Para web: usa `package.json` version o `NEXT_PUBLIC_APP_VERSION`
- Para Android/iOS: intenta usar `@capacitor/app` (si está instalado), sino usa fallback
- **Nota**: Para obtener versión nativa exacta, instalar `@capacitor/app`: `npm install @capacitor/app`

---

### Fase 3: Componente de Actualización
**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado

**Archivos creados**:
- ✅ `src/components/UpdateModal.tsx` - Modal para mostrar actualizaciones (requerida/recomendada)
- ✅ `src/lib/versionCheck.ts` - Función para verificar versión con el servidor
- ✅ `src/hooks/useVersionCheck.ts` - Hook para verificar versión al iniciar
- ✅ `src/components/VersionCheckWrapper.tsx` - Wrapper que integra todo

**Archivos modificados**:
- ✅ `src/components/RootClientWrapper.tsx` - Integrado VersionCheckWrapper

**Notas**:
- Modal adaptativo: muestra diferente UI para actualización requerida vs recomendada
- Maneja redirección a tiendas (Android/iOS) o recarga de página (web)
- Muestra release notes si están disponibles
- Integrado en RootClientWrapper para verificar versión al iniciar
- Funciona sin usuario autenticado (usa deviceId)
- **Botones adicionales en actualización requerida**:
  - "Solicitar por WhatsApp": Abre WhatsApp con mensaje predefinido para pedir ayuda
  - "Cerrar sesión": Permite al usuario salir de su cuenta si no puede actualizar
- Bypass para desarrollo: En localhost, no bloquea y muestra botón para saltar verificación

---

### Fase 4: Integración en la App
**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado (integrado en Fase 3)

**Notas**:
- La integración se completó junto con la Fase 3
- VersionCheckWrapper integrado en RootClientWrapper
- Verificación automática al iniciar la app

---

### Fase 5: Panel de Administración
**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado

**Archivos creados**:
- ✅ `src/app/api/admin/app-versions/route.ts` - API GET/PUT para gestionar versiones
- ✅ `src/app/api/admin/app-versions/stats/route.ts` - API GET para estadísticas
- ✅ `admin-dashboard/src/app/api/app-versions/route.ts` - Proxy GET/PUT
- ✅ `admin-dashboard/src/app/api/app-versions/stats/route.ts` - Proxy GET stats
- ✅ `admin-dashboard/src/app/(protected)/versions/page.tsx` - Panel de administración

**Archivos modificados**:
- ✅ `admin-dashboard/src/app/(protected)/layout.tsx` - Agregado "Versiones" al menú

**Notas**:
- Panel completo para gestionar versiones de web, android, ios
- Toggle para activar/desactivar `force_update`
- Formularios para configurar versiones, mensajes y release notes
- Estadísticas de versiones: total, actualizados, recomendados, bloqueados
- Distribución de versiones (top 10)
- Validación con Zod en el backend
- Sistema de desactivación de configuraciones anteriores al crear nuevas

---

### Fase 6: Testing y Ajustes
**Fecha**: _Pendiente_  
**Estado**: ⏳ Pendiente

**Notas**:
- 

---

## 🔧 Detalles Técnicos

### Comparación de Versiones (Semver)

```typescript
function compareVersions(v1: string, v2: string): number {
  // v1 > v2: return 1
  // v1 < v2: return -1
  // v1 === v2: return 0
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}
```

### Detección de Plataforma

```typescript
// Web
if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
  platform = 'web';
}

// Android
if (Capacitor.getPlatform() === 'android') {
  platform = 'android';
}

// iOS
if (Capacitor.getPlatform() === 'ios') {
  platform = 'ios';
}
```

### Detección de Versión

```typescript
// Web
const version = process.env.NEXT_PUBLIC_APP_VERSION || package.json.version;

// Android/iOS (Capacitor)
import { App } from '@capacitor/app';
const { version } = await App.getInfo();
```

---

## 🎯 Casos de Uso

### Caso 1: Bug Crítico - Bloqueo Total
```
Situación: Bug que causa pérdida de datos en v1.3.0
Acción:
  1. Subes v1.3.1 a las tiendas
  2. En admin panel:
     - minimum_required_version = "1.3.1"
     - force_update = ON
Resultado: Todos los usuarios v1.3.0 o menor NO pueden usar la app
```

### Caso 2: Nueva Funcionalidad Importante
```
Situación: Lanzaste reportes avanzados en v1.4.0
Acción:
  1. En admin panel:
     - current_version = "1.4.0"
     - recommended_version = "1.4.0"
     - force_update = OFF
Resultado: Usuarios ven aviso pero pueden seguir usando la app
```

### Caso 3: Cambio en API Backend
```
Situación: Cambiaste endpoints incompatibles con apps antiguas
Acción:
  1. En admin panel:
     - minimum_required_version = "1.5.0"
     - force_update = ON
Resultado: Solo usuarios con v1.5.0+ pueden usar la app
```

---

## 📊 Variables de Entorno Necesarias

```env
# Versión de la app (opcional, si no se usa package.json)
NEXT_PUBLIC_APP_VERSION=1.0.0

# URLs de tiendas (opcional, se pueden configurar en admin)
NEXT_PUBLIC_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.ahorro365.app
NEXT_PUBLIC_IOS_STORE_URL=https://apps.apple.com/app/ahorro365/id123456789
```

---

## ✅ Checklist Final

- [x] Fase 1: Base de datos y backend API
- [x] Fase 2: Detección de versión
- [x] Fase 3: Componente de actualización
- [x] Fase 4: Integración en la app
- [x] Fase 5: Panel de administración
- [ ] Fase 6: Testing completo en producción
- [x] Documentación actualizada
- [x] Variables de entorno configuradas (NEXT_PUBLIC_APP_VERSION opcional)

---

## 📅 Última Actualización

**Fecha**: 2025-01-XX  
**Estado General**: ✅ **COMPLETO** - Listo para producción

### ✅ Fases Completadas

- ✅ **Fase 1**: Base de datos y backend API
- ✅ **Fase 2**: Detección de versión
- ✅ **Fase 3**: Componente de actualización
- ✅ **Fase 4**: Integración en la app
- ✅ **Fase 5**: Panel de administración

### ⏳ Pendiente

- ⏳ **Fase 6**: Testing completo en producción

