# Cómo Obtener la VAPID Key de Firebase

**Objetivo:** Obtener `NEXT_PUBLIC_FIREBASE_VAPID_KEY` para habilitar notificaciones push

---

## 📋 Pasos para Obtener la VAPID Key

### 1. Ir a Firebase Console

1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o créalo si no tienes uno)

### 2. Ir a Cloud Messaging

1. En el menú lateral, ve a **⚙️ Configuración del proyecto** (Project Settings)
2. Haz clic en la pestaña **Cloud Messaging**
3. Si no ves la pestaña, ve a **⚙️ Configuración del proyecto → General → Cloud Messaging**

### 3. Generar/Ver VAPID Key

1. En la sección **"Web Push certificates"** o **"Web configuration"**
2. Si ya tienes una VAPID key:
   - **Copia la clave** (es un string largo que empieza con algo como `BElG...`)
3. Si NO tienes una VAPID key:
   - Haz clic en **"Generate key pair"** o **"Generar par de claves"**
   - Se generará automáticamente
   - **Copia la clave** que aparece

### 4. Agregar a `.env.local`

Abre tu archivo `.env.local` y agrega:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu-vapid-key-aqui
```

**Ejemplo:**
```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BElG...tu-clave-completa-aqui
```

### 5. Reiniciar el Servidor

Después de agregar la variable:

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## 🔍 Ubicación Alternativa

Si no encuentras la VAPID key en Cloud Messaging, también puede estar en:

1. **Project Settings → General → Your apps → Web app**
2. Busca la sección **"Cloud Messaging"** o **"Web Push certificates"**
3. La VAPID key puede aparecer como:
   - `Web Push certificate key pair`
   - `VAPID key`
   - `Application Server Key`

---

## ⚠️ Notas Importantes

1. **La VAPID key es pública** (por eso empieza con `NEXT_PUBLIC_`)
   - Es segura de exponer en el cliente
   - No es un secreto

2. **Formato de la clave:**
   - Es un string largo (generalmente 87 caracteres)
   - No tiene espacios
   - Ejemplo: `BElG...xyz123`

3. **Si no puedes generar la clave:**
   - Asegúrate de que Cloud Messaging esté habilitado en tu proyecto
   - Verifica que tengas permisos de administrador en el proyecto

---

## ✅ Verificación

Después de agregar la variable y reiniciar:

1. Inicia sesión en la app
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   FCM token obtenido: [token-largo]
   ```
   En lugar de:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY no está configurada
   ```

---

## 🐛 Troubleshooting

### "No encuentro la VAPID key en Firebase Console"

**Solución:**
1. Ve a **Project Settings → Cloud Messaging**
2. Si no aparece, haz clic en **"Generate key pair"**
3. Si aún no aparece, verifica que Cloud Messaging esté habilitado

### "La clave parece incorrecta"

**Verificación:**
- Debe ser un string largo sin espacios
- No debe tener comillas alrededor
- Debe empezar con letras (ej: `BElG`, `BK...`)

### "Sigue apareciendo el error después de reiniciar"

**Solución:**
1. Verifica que el archivo se llama exactamente `.env.local` (no `.env`)
2. Verifica que no haya espacios antes o después del `=`
3. Reinicia el servidor completamente (detener y volver a iniciar)
4. Limpia la caché del navegador (Ctrl+Shift+R)

---

## 📝 Ejemplo Completo de `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key

# Firebase (líneas 43-46)
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id

# Firebase VAPID Key (NUEVA - línea 47 o después)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu-vapid-key-completa-aqui
```

---

## 🚀 Siguiente Paso

Una vez que agregues la VAPID key:

1. Reinicia el servidor
2. Inicia sesión en la app
3. Acepta los permisos de notificaciones
4. Verifica que el token se registre en `fcm_tokens`

