## Configuración de Firebase Cloud Messaging (FCM)

### 1. Firebase Console
- Crea o usa un proyecto de Firebase.
- Habilita Cloud Messaging y genera la **Web Push certificate key pair (VAPID)**.
- Obtén las credenciales web desde **Project settings → General → Your apps → SDK setup and configuration**.

### 2. Variables de entorno
- Actualiza `env-template.txt` (app core) con:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (opcional)
  - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- Para el panel admin utiliza el mismo set y recuerda definir `NEXT_PUBLIC_CORE_API_URL`.
- En producción (Vercel) carga los valores en **Project → Settings → Environment Variables**.

### 3. Service Worker
El archivo `public/firebase-messaging-sw.js` ya está preparado. Al registrar el service worker se envía la configuración automáticamente, por lo que no necesitas editar el archivo manualmente.

### 4. Registro del token
- La app principal registra el token cuando el usuario inicia sesión, usando el hook `useRegisterFcmToken`.
- El hook solicita permisos, inicializa Firebase, obtiene el token y lo manda al endpoint `/api/notifications/register-token`.
- El endpoint guarda o actualiza el token en la tabla `fcm_tokens`.

### 5. Pruebas locales
- Ejecuta el core y el panel admin (`localhost:3000` y `localhost:3001`).
- Acepta la solicitud de notificaciones en el navegador.
- Verifica en Supabase que se inserta/actualiza el token en `fcm_tokens`.

### 6. Producción
- Despliega el core con las variables reales.
- Despliega el panel admin (con `NEXT_PUBLIC_CORE_API_URL` apuntando al dominio del core).
- Usa el panel (`/notifications`) para enviar una notificación de prueba.

### 7. Manejo de tokens
- El service worker recibe notificaciones en segundo plano.
- `notificationService` desactiva tokens inválidos cuando FCM devuelve errores como `messaging/registration-token-not-registered`.


