# 🚀 Desarrollo Local: WhatsApp Webhook con ngrok

**Fecha:** 20 Nov 2025  
**Propósito:** Probar y depurar el webhook de WhatsApp localmente antes de deployar

---

## 📋 Requisitos Previos

1. **Node.js** instalado (v18+)
2. **ngrok** instalado ([descargar aquí](https://ngrok.com/download))
3. **Cuenta de ngrok** (gratuita, [registrarse aquí](https://ngrok.com/signup))

---

## 🔧 Paso 1: Instalar ngrok

### Windows (PowerShell)
```powershell
# Opción 1: Con Chocolatey
choco install ngrok

# Opción 2: Descargar manualmente
# Ve a https://ngrok.com/download
# Extrae ngrok.exe a una carpeta en tu PATH
```

### Verificar instalación
```bash
ngrok version
```

---

## 🔑 Paso 2: Autenticar ngrok

1. Crea una cuenta en [ngrok.com](https://ngrok.com/signup) (gratis)
2. Obtén tu authtoken desde el dashboard
3. Autentica:

```bash
ngrok config add-authtoken TU_AUTH_TOKEN_AQUI
```

---

## 🚀 Paso 3: Configurar Variables de Entorno Locales

Crea un archivo `.env.local` en `packages/core-api/`:

```bash
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkABPZBlltF0Cc4jAWhkxAeAZAy6c237otZBd1YpRZB3ptqDIU1iKY4nd8aYHBqiVXv0lwikpPzjGYPSWCO6OHSaJcgfu7ZAMYxLcUAWq3pgp4CRM18D373EMVtS5KM72ZA7moqol6ZBzdRVLzc7a1FLUPEH4beGTBRhkSQvSTSfIKX25ZCO4GXyQNElGQZDZD
WHATSAPP_PHONE_NUMBER_ID=796240860248587
WHATSAPP_BUSINESS_ACCOUNT_ID=766200063108245
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
WHATSAPP_API_VERSION=v22.0

# Supabase (si es necesario)
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
```

---

## 🏃 Paso 4: Iniciar Servidor Local

### Terminal 1: Iniciar Next.js
```bash
cd packages/core-api
npm run dev
```

Deberías ver:
```
▲ Next.js 15.5.4
- Local:        http://localhost:3002
```

### Terminal 2: Iniciar ngrok
```bash
ngrok http 3002
```

Deberías ver algo como:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3002
```

**⚠️ IMPORTANTE:** Copia la URL HTTPS (no HTTP) que ngrok te da. Ejemplo:
```
https://abc123.ngrok-free.app
```

---

## 🔗 Paso 5: Configurar Webhook en Meta con URL de ngrok

1. Ve a **Meta Developer Console** → **WhatsApp** → **Configuration** → **Webhooks**
2. En **"URL de devolución de llamada"**, pega tu URL de ngrok + el endpoint:
   ```
   https://abc123.ngrok-free.app/api/webhooks/whatsapp
   ```
   ⚠️ **Reemplaza `abc123.ngrok-free.app` con tu URL real de ngrok**
3. En **"Token de verificación"**, pega:
   ```
   7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
   ```
4. **Desactiva** el toggle "Adjunta un certificado de cliente"
5. Haz clic en **"Verificar y guardar"**

---

## 📊 Paso 6: Ver Logs en Tiempo Real

### En la terminal de Next.js verás:
```
🔍 RAW Webhook GET Request: { ... }
🔍 Webhook verification request (parsed): { ... }
✅ Webhook verified successfully
```

### En la terminal de ngrok verás:
```
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=... 200 OK
```

---

## 🧪 Paso 7: Probar Manualmente (Opcional)

Puedes probar el webhook manualmente con curl:

```bash
curl "http://localhost:3002/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876&hub.challenge=test123"
```

Deberías recibir `test123` como respuesta.

---

## 🐛 Troubleshooting

### Error: "ngrok: command not found"
**Solución:** Asegúrate de que ngrok esté en tu PATH o usa la ruta completa.

### Error: "Tunnel session expired"
**Solución:** 
- La versión gratuita de ngrok tiene límites
- Reinicia ngrok: `ngrok http 3002`
- Obtendrás una nueva URL (actualiza en Meta)

### Error: "Webhook verification failed"
**Solución:**
1. Verifica que el token en `.env.local` sea exactamente el mismo que en Meta
2. Verifica que la URL en Meta incluya `/api/webhooks/whatsapp`
3. Revisa los logs en la terminal de Next.js para ver qué parámetros recibió

### Error: "Cannot find module"
**Solución:**
```bash
cd packages/core-api
npm install
```

---

## 💡 Ventajas del Desarrollo Local

✅ **Feedback instantáneo:** Ver cambios inmediatamente sin esperar deploy  
✅ **Logs detallados:** Ver todos los logs en tiempo real en tu terminal  
✅ **Debugging fácil:** Puedes usar `console.log` y debuggers  
✅ **Sin límites de deploy:** Prueba tantas veces como quieras  

---

## 📝 Notas Importantes

⚠️ **URL de ngrok cambia:** Cada vez que reinicias ngrok, obtienes una nueva URL. Debes actualizarla en Meta.

⚠️ **Versión gratuita de ngrok:**
- URLs temporales (cambian al reiniciar)
- Límite de conexiones simultáneas
- Para producción, usa Vercel

⚠️ **Variables de entorno:** El archivo `.env.local` solo funciona localmente. Para producción, usa Vercel.

---

## 🚀 Siguiente Paso

Una vez que verifiques que funciona localmente:
1. Haz commit de tus cambios
2. Push a GitHub
3. Vercel hará deploy automáticamente
4. Actualiza el webhook en Meta con la URL de Vercel

