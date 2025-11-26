# Restauración: Registro de Tokens FCM

**Fecha:** 2025-11-12  
**Estado:** ✅ Restaurado

---

## 🔍 Problema Identificado

El hook `useRegisterFcmToken` existía en el código pero **no estaba siendo usado** en ningún componente, por lo que los tokens FCM no se registraban automáticamente cuando los usuarios iniciaban sesión.

---

## ✅ Solución Implementada

### Cambio Realizado

**Archivo:** `src/components/RootClientWrapper.tsx`

1. **Importado el hook:**
   ```typescript
   import { useRegisterFcmToken } from '@/hooks/useRegisterFcmToken';
   ```

2. **Agregado el hook al componente:**
   ```typescript
   // Registrar token FCM cuando el usuario esté autenticado
   useRegisterFcmToken();
   ```

### ¿Por qué `RootClientWrapper`?

- Se renderiza en todas las páginas de la app
- Tiene acceso al contexto de Supabase (`user`)
- Es el lugar ideal para funcionalidad global como registro de tokens

---

## 🔄 Cómo Funciona

1. **Usuario inicia sesión:**
   - `RootClientWrapper` se renderiza
   - `useRegisterFcmToken` detecta que hay un `user` autenticado

2. **Solicita permisos:**
   - Verifica si el navegador soporta notificaciones
   - Solicita permisos al usuario (`Notification.requestPermission()`)

3. **Obtiene token FCM:**
   - Inicializa Firebase Messaging
   - Obtiene el token FCM del navegador/dispositivo

4. **Registra en Supabase:**
   - Envía el token al endpoint `/api/notifications/register-token`
   - El endpoint guarda/actualiza el token en `fcm_tokens`

---

## 🧪 Cómo Probar

### Paso 1: Iniciar Sesión

1. Ir a `http://localhost:3000/sign-in`
2. Iniciar sesión con una cuenta (ej: `+59176990076`)

### Paso 2: Verificar Permisos

1. El navegador debería mostrar un popup pidiendo permisos de notificaciones
2. Aceptar los permisos

### Paso 3: Verificar en Consola

Deberías ver en la consola del navegador:
```
FCM token obtenido: [token-largo]
```

### Paso 4: Verificar en Supabase

```sql
SELECT 
  id,
  user_id,
  token,
  is_active,
  device_type,
  created_at
FROM fcm_tokens 
WHERE user_id = 'd70c685f-b22f-4aa2-90d3-494e594cd043' 
  AND is_active = true;
```

**Resultado esperado:** Debe aparecer al menos 1 token con `is_active = true`

---

## 📋 Requisitos para que Funcione

1. ✅ **Hook agregado** en `RootClientWrapper`
2. ✅ **Service Worker** existe en `public/firebase-messaging-sw.js`
3. ✅ **Endpoint** `/api/notifications/register-token` existe
4. ⚠️ **Variables de entorno** necesarias:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY` ⚠️ **CRÍTICO**

---

## 🐛 Troubleshooting

### Problema: "NEXT_PUBLIC_FIREBASE_VAPID_KEY no está configurada"

**Causa:** Falta la variable de entorno `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

**Solución:**
1. Obtener la VAPID key desde Firebase Console
2. Agregar a `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu-vapid-key-aqui
   ```
3. Reiniciar el servidor de desarrollo

### Problema: "El navegador no soporta notificaciones push"

**Causa:** El navegador no soporta la API de Notificaciones

**Solución:** Usar un navegador moderno (Chrome, Firefox, Edge)

### Problema: "Este navegador no soporta Service Workers"

**Causa:** El navegador no soporta Service Workers o está en modo HTTP (no HTTPS)

**Solución:** 
- Usar HTTPS (en producción)
- En localhost, HTTP funciona para Service Workers

### Problema: No aparece el popup de permisos

**Causa:** Ya se otorgaron permisos anteriormente (o se denegaron)

**Solución:**
- **Chrome:** Configuración → Privacidad y seguridad → Notificaciones → Buscar el sitio → Permitir
- **Firefox:** Configuración → Privacidad y seguridad → Permisos → Notificaciones → Buscar el sitio → Permitir

---

## ✅ Estado Actual

- ✅ Hook agregado a `RootClientWrapper`
- ✅ Service Worker existe
- ✅ Endpoint existe
- ⚠️ **PENDIENTE:** Verificar variables de entorno (especialmente `NEXT_PUBLIC_FIREBASE_VAPID_KEY`)

---

## 🚀 Próximos Pasos

1. **Verificar variables de entorno** en `.env.local`
2. **Iniciar sesión** con la cuenta del referidor
3. **Aceptar permisos** de notificaciones
4. **Verificar** que el token se registró en `fcm_tokens`
5. **Probar** el flujo completo de referidos

---

## 📝 Notas

- El hook se ejecuta automáticamente cuando hay un usuario autenticado
- Si el usuario ya otorgó permisos, no aparecerá el popup
- El token se actualiza automáticamente si ya existe
- Los tokens inactivos se pueden reactivar si el usuario vuelve a usar la app

