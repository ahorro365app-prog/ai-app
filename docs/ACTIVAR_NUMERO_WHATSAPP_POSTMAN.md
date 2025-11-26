# 🚀 Activar Número de WhatsApp usando Postman

**Fecha:** 20 Nov 2025  
**Problema:** Error "Object with ID does not exist" al usar el botón de Meta

---

## ❌ Problema

Meta Developer Console muestra un Phone Number ID incorrecto en la interfaz, causando el error:
```
Object with ID '840593392476984' does not exist
```

**ID Incorrecto (mostrado en interfaz):** `840593392476984`  
**ID Correcto (tu número real):** `796240860248587`

---

## ✅ Solución: Usar Postman

⚠️ **IMPORTANTE:** Antes de enviar mensajes, debes suscribir tu app a la cuenta de WhatsApp Business (WABA).

### Paso 0: Suscribir App a WABA (OBLIGATORIO)

1. En Postman, crea una nueva petición **POST**
2. Configura así:

#### 📍 URL
```
https://graph.facebook.com/v22.0/1554733609063961/subscribed_apps
```

⚠️ **IMPORTANTE:** Usa tu WABA ID: `1554733609063961` (actualizado 20 Nov 2025)

#### 🔑 Headers
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer [TU_ACCESS_TOKEN]` |
| `Content-Type` | `application/json` |

#### 📦 Body (raw JSON)
```json
{
  "data": [
    {
      "access_token": "TU_ACCESS_TOKEN_AQUI"
    }
  ]
}
```

3. Haz clic en **"Send"**
4. Deberías recibir una respuesta `200 OK` con:
```json
{
  "success": true
}
```

✅ **Una vez suscrito, continúa con el Paso 1 para enviar el mensaje de prueba.**

---

### Paso 1: Instalar Postman (si no lo tienes)

1. Descarga Postman desde: https://www.postman.com/downloads/
2. Instala y abre Postman

### Paso 2: Crear Nueva Petición

1. Haz clic en **"New"** → **"HTTP Request"**
2. O usa el atajo: `Ctrl+N`

### Paso 3: Configurar la Petición

#### 📍 URL (Método: POST)
```
https://graph.facebook.com/v22.0/840593392476984/messages
```

⚠️ **IMPORTANTE:** Usa el Phone Number ID correcto: `840593392476984` (actualizado 20 Nov 2025)

#### 🔑 Headers

Agrega estos headers:

| Key | Value |
|-----|-------|
| `Authorization` | `Bearer EAAdQZBR1AjkABPZBlltF0Cc4jAWhkxAeAZAy6c237otZBd1YpRZB3ptqDIU1iKY4nd8aYHBqiVXv0lwikpPzjGYPSWCO6OHSaJcgfu7ZAMYxLcUAWq3pgp4CRM18D373EMVtS5KM72ZA7moqol6ZBzdRVLzc7a1FLUPEH4beGTBRhkSQvSTSfIKX25ZCO4GXyQNElGQZDZD` |
| `Content-Type` | `application/json` |

#### 📦 Body

1. Selecciona **"raw"**
2. Selecciona **"JSON"** en el dropdown
3. Pega este JSON:

```json
{
  "messaging_product": "whatsapp",
  "to": "59176990076",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "en_US"
    }
  }
}
```

⚠️ **IMPORTANTE:** 
- Cambia `"to": "59176990076"` por tu número personal si es diferente
- El número debe incluir código de país sin el `+` (ej: `59176990076` para `+591 76990076`)

### Paso 4: Enviar la Petición

1. Haz clic en **"Send"**
2. Deberías ver una respuesta `200 OK` con un JSON similar a:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "59176990076",
      "wa_id": "59176990076"
    }
  ],
  "messages": [
    {
      "id": "wamid.XXX..."
    }
  ]
}
```

### Paso 5: Verificar Activación

1. Ve a: **Meta Developer Console** → **WhatsApp** → **Configuration** → **Phone numbers**
2. El estado debería cambiar de **"Pendiente"** a **"Conectado"** o **"Activo"**
3. Puede tardar 1-2 minutos

---

## 🧪 Probar que Funciona

Una vez activado:

1. Envía un mensaje de audio desde tu número personal a `+591 60360908`
2. Revisa los logs de Next.js
3. Deberías ver:
   - `📥 POST webhook recibido`
   - `📨 Mensaje recibido de WhatsApp Cloud API`
   - El mensaje procesándose

---

## ⚠️ Troubleshooting

### Error: "Invalid OAuth access token"
**Solución:** El token puede haber expirado. Genera uno nuevo en Meta Developer Console.

### Error: "Invalid phone number"
**Solución:** Verifica que el número en `"to"` esté en formato correcto (código de país + número, sin `+`).

### Error: "Template not found"
**Solución:** El template `hello_world` debería estar disponible por defecto. Si no, crea uno nuevo en Meta.

### El número sigue en "Pendiente"
**Solución:** 
- Espera 2-3 minutos
- Verifica que la respuesta fue `200 OK`
- Intenta enviar otro mensaje de prueba

---

## 📝 Notas

- El Phone Number ID correcto es: `796240860248587`
- El Business Account ID es: `766200063108245`
- El token de acceso puede expirar (tokens temporales duran 24 horas)

---

## 🔗 Referencias

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)





