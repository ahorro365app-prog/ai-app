# ⚠️ Implicaciones de las Rutas API en la App Móvil

## 📋 ¿Qué son las Rutas API?

Las rutas API (`/api/*`) son endpoints del servidor que procesan datos, realizan operaciones en la base de datos, y manejan lógica del backend. En Next.js, estas rutas **NO se pueden exportar estáticamente** porque requieren un servidor Node.js en ejecución.

## 🔍 Rutas API que Tiene Tu Aplicación

### **Rutas Críticas (Funcionalidad Principal)**

1. **`/api/ai`** - Procesamiento de IA para transacciones
2. **`/api/process-expense`** - Procesamiento de gastos
3. **`/api/audio/process`** - Procesamiento de audio/transcripción
4. **`/api/payments/create`** - Creación de pagos
5. **`/api/payments/upload-receipt`** - Subida de comprobantes
6. **`/api/referrals/validate-code`** - Validación de códigos de referido
7. **`/api/referrals/activate-smart`** - Activación de plan Smart
8. **`/api/whatsapp/send-verification-code`** - Envío de códigos WhatsApp
9. **`/api/whatsapp/verify-code`** - Verificación de códigos WhatsApp
10. **`/api/csrf-token`** - Tokens de seguridad CSRF
11. **`/api/feedback/confirm`** - Confirmación de feedback
12. **`/api/notifications/*`** - Sistema completo de notificaciones
13. **`/api/app/version-check`** - Verificación de versiones

### **Rutas de Webhooks (Solo Servidor)**

- `/api/webhooks/baileys` - Webhook de Baileys
- `/api/webhooks/whatsapp` - Webhook de WhatsApp

## ❌ ¿Qué Implica que NO Funcionen?

### **Funcionalidades que DEJARÁN de Funcionar:**

1. **❌ Procesamiento de IA**
   - No podrás procesar transacciones con IA
   - No funcionará el chat con IA
   - No se procesarán gastos automáticamente

2. **❌ Procesamiento de Audio**
   - No se podrán procesar grabaciones de voz
   - No funcionará la transcripción de audio

3. **❌ Sistema de Pagos**
   - No se podrán crear pagos
   - No se podrán subir comprobantes
   - El sistema de facturación no funcionará

4. **❌ Sistema de Referidos**
   - No se podrán validar códigos de referido
   - No se podrá activar el plan Smart mediante referidos

5. **❌ Verificación WhatsApp**
   - No se podrán enviar códigos de verificación
   - No se podrá verificar números de WhatsApp

6. **❌ Notificaciones Push**
   - No se registrarán tokens FCM
   - No se enviarán notificaciones
   - El sistema completo de notificaciones no funcionará

7. **❌ Seguridad CSRF**
   - Los tokens CSRF no funcionarán
   - Puede haber problemas de seguridad

8. **❌ Verificación de Versiones**
   - No se podrá verificar si hay actualizaciones disponibles

## ✅ Funcionalidades que SÍ Funcionarán:

1. **✅ Autenticación** (si usas Supabase directamente)
2. **✅ Visualización de datos** (dashboard, historial, etc.)
3. **✅ Navegación** entre páginas
4. **✅ UI/UX** completa
5. **✅ Operaciones CRUD básicas** (si usas Supabase directamente desde el cliente)

## 🔧 Soluciones Posibles

### **Opción 1: Servidor Remoto (RECOMENDADO) ⭐**

**Ventajas:**
- ✅ Todas las APIs funcionan
- ✅ Mejor seguridad (APIs no expuestas en el cliente)
- ✅ Escalable
- ✅ Fácil de mantener

**Desventajas:**
- ⚠️ Requiere un servidor (Vercel, Railway, etc.)
- ⚠️ Costos de hosting

**Implementación:**
1. Despliega tu app Next.js en Vercel/Railway
2. Configura las variables de entorno en el servidor
3. En la app móvil, apunta todas las llamadas API a: `https://tu-app.vercel.app/api/*`

**Cambios necesarios:**
```typescript
// Crear un archivo de configuración
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tu-app.vercel.app';

// En lugar de:
fetch('/api/ai', ...)

// Usar:
fetch(`${API_BASE_URL}/api/ai`, ...)
```

### **Opción 2: Usar Supabase Directamente (PARCIAL)**

**Ventajas:**
- ✅ No requiere servidor para operaciones básicas
- ✅ Funciona offline parcialmente
- ✅ Gratis hasta cierto límite

**Desventajas:**
- ❌ No funciona para APIs que requieren procesamiento (IA, audio, etc.)
- ❌ Lógica de negocio en el cliente (menos seguro)
- ❌ No funciona para webhooks

**Implementación:**
- Ya lo estás usando para algunas cosas
- Necesitarías mover más lógica a Supabase Functions o Edge Functions

### **Opción 3: Híbrida (RECOMENDADA PARA TU CASO) ⭐⭐**

**Combinar:**
1. **Supabase directamente** para operaciones CRUD básicas
2. **Servidor remoto** para:
   - Procesamiento de IA
   - Procesamiento de audio
   - Webhooks
   - Lógica compleja

**Ventajas:**
- ✅ Mejor rendimiento (menos llamadas al servidor)
- ✅ Funciona offline parcialmente
- ✅ Costos optimizados

## 📊 Impacto por Funcionalidad

| Funcionalidad | Impacto | Solución Recomendada |
|--------------|---------|---------------------|
| Dashboard (visualización) | ✅ Funciona | Supabase directo |
| Agregar transacciones básicas | ✅ Funciona | Supabase directo |
| Procesamiento IA | ❌ No funciona | Servidor remoto |
| Procesamiento audio | ❌ No funciona | Servidor remoto |
| Pagos | ❌ No funciona | Servidor remoto |
| Referidos | ❌ No funciona | Servidor remoto |
| WhatsApp verification | ❌ No funciona | Servidor remoto |
| Notificaciones | ❌ No funciona | Servidor remoto |
| Chat con IA | ❌ No funciona | Servidor remoto |

## 🚀 Recomendación Final

**Para tu aplicación, la mejor solución es:**

1. **Desplegar la app Next.js completa en Vercel** (gratis para empezar)
2. **Configurar una variable de entorno** `NEXT_PUBLIC_API_URL` que apunte a tu servidor
3. **Modificar las llamadas API** para usar la URL del servidor cuando esté en modo móvil
4. **Mantener Supabase directo** para operaciones simples (CRUD básico)

**Ejemplo de implementación:**
```typescript
// src/lib/api-client.ts
const getApiUrl = () => {
  // En móvil (Capacitor), usar servidor remoto
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return process.env.NEXT_PUBLIC_API_URL || 'https://tu-app.vercel.app';
  }
  // En web, usar ruta relativa
  return '';
};

export const apiFetch = (endpoint: string, options?: RequestInit) => {
  const baseUrl = getApiUrl();
  return fetch(`${baseUrl}${endpoint}`, options);
};
```

## 📝 Próximos Pasos

1. **Decide qué solución quieres implementar**
2. **Si eliges servidor remoto:**
   - Despliega en Vercel/Railway
   - Configura variables de entorno
   - Crea el helper `api-client.ts`
   - Reemplaza todas las llamadas `fetch('/api/...')` por `apiFetch('/api/...')`

3. **Si eliges híbrida:**
   - Mantén Supabase directo para CRUD
   - Usa servidor remoto solo para APIs complejas
   - Implementa el helper condicional

¿Quieres que te ayude a implementar alguna de estas soluciones?



