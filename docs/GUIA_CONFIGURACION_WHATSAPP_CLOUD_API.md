# 🚀 Guía Completa: Configuración de WhatsApp Cloud API

**Fecha:** 19 Nov 2025  
**Estado:** URLs legales ✅ | Endpoint backend ✅ | Listo para configurar

---

## 📋 Checklist Pre-Configuración

### ✅ Completado

- [x] Páginas legales creadas y deployadas
  - ✅ `/privacy` - https://ahorro365-core-api.vercel.app/privacy
  - ✅ `/terms` - https://ahorro365-core-api.vercel.app/terms
  - ✅ `/delete-data` - https://ahorro365-core-api.vercel.app/delete-data
- [x] Endpoint de webhook existente: `/api/webhooks/whatsapp`
- [x] Documentación de costos revisada

### ⏳ Pendiente

- [ ] Crear cuenta de Meta Business
- [ ] Crear app en Meta Developer
- [ ] Configurar WhatsApp Business API
- [ ] Configurar webhook en Meta
- [ ] Obtener tokens de acceso
- [ ] Probar recepción de mensajes
- [ ] Configurar envío de mensajes

---

## 📝 Paso 1: Crear Meta Business Account

### 1.1. Ir a Meta Business

1. Ve a: https://business.facebook.com
2. Haz clic en **"Crear cuenta"** o **"Iniciar sesión"**
3. Si no tienes cuenta, crea una con tu email

### 1.2. Verificar Negocio

1. En el dashboard, ve a **"Configuración"** → **"Información del negocio"**
2. Completa la información:
   - Nombre del negocio: **Ahorro365**
   - Tipo de negocio: **Aplicación/Servicio**
   - País: **Bolivia**
   - Email: **ahorro365app@gmail.com**
   - Teléfono: (opcional)
3. Verifica tu email si es necesario

**⏱️ Tiempo estimado:** 5-10 minutos

---

## 📝 Paso 2: Crear App en Meta Developer

### 2.1. Acceder a Meta Developer

1. Ve a: https://developers.facebook.com
2. Inicia sesión con tu cuenta de Meta Business
3. Haz clic en **"Mis Apps"** → **"Crear App"**

### 2.2. Seleccionar Tipo de App

1. Selecciona: **"Business"** o **"Otro"**
2. Haz clic en **"Siguiente"**

### 2.3. Configurar App Básica

**Información requerida:**

- **Nombre de la app:** `Ahorro365`
- **Email de contacto:** `ahorro365app@gmail.com`
- **Propósito de la app:** "Aplicación de gestión de finanzas personales que permite a los usuarios registrar transacciones mediante WhatsApp"

3. Haz clic en **"Crear App"**

**⏱️ Tiempo estimado:** 5 minutos

---

## 📝 Paso 3: Agregar Producto WhatsApp

### 3.1. Agregar WhatsApp Business API

1. En el dashboard de tu app, busca **"WhatsApp"** en la lista de productos
2. Haz clic en **"Configurar"** o **"Agregar"**
3. Selecciona **"WhatsApp Business API"** (no WhatsApp Business Platform)

### 3.2. Configuración Inicial

1. **Número de teléfono:**
   - Si tienes número de WhatsApp Business: Selecciónalo
   - Si no: Meta te asignará un número de prueba temporal

2. **Configuración Básica:**
   - Ve a **"Configuración"** → **"Básica"**
   - Completa la información:
     - **Nombre para mostrar:** `Ahorro365`
     - **Categoría:** `Utilidad` o `Finanzas`
     - **Descripción:** "App de gestión de finanzas personales"

**⏱️ Tiempo estimado:** 10 minutos

---

## 📝 Paso 4: Configurar URLs Legales

### 4.1. Agregar URLs en Configuración Básica

1. En **"Configuración"** → **"Básica"**
2. Busca la sección **"URLs de políticas"** o **"Privacy Policy URL"**
3. Agrega las siguientes URLs:

**URLs requeridas:**

```
Política de Privacidad:
https://ahorro365-core-api.vercel.app/privacy

Términos del Servicio:
https://ahorro365-core-api.vercel.app/terms

Eliminación de Datos (opcional):
https://ahorro365-core-api.vercel.app/delete-data
```

4. Haz clic en **"Guardar cambios"**

**⏱️ Tiempo estimado:** 2 minutos

---

## 📝 Paso 5: Configurar Webhook

### 5.1. Obtener URL del Webhook

**Tu URL de webhook:**
```
https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp
```

### 5.2. Configurar Webhook en Meta

1. En el dashboard de WhatsApp, ve a **"Configuración"** → **"Webhooks"**
2. Haz clic en **"Configurar webhooks"** o **"Editar"**
3. Ingresa la URL:
   ```
   https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp
   ```
4. Haz clic en **"Verificar y guardar"**

### 5.3. Verificar Webhook (Meta enviará un GET)

**Meta enviará una petición GET con:**
- `hub.mode` = `subscribe`
- `hub.verify_token` = (token que configures)
- `hub.challenge` = (string aleatorio)

**Tu endpoint debe:**
1. Verificar que `hub.mode === 'subscribe'`
2. Verificar que `hub.verify_token` coincide con tu token
3. Retornar `hub.challenge` como respuesta

**⚠️ IMPORTANTE:** Necesitas agregar soporte para GET en tu endpoint.

### 5.4. Suscribirse a Eventos

1. En la misma página de webhooks, selecciona los eventos:
   - ✅ **messages** (mensajes entrantes)
   - ✅ **message_status** (estado de mensajes enviados) - opcional
2. Haz clic en **"Guardar"**

**⏱️ Tiempo estimado:** 5 minutos

---

## 📝 Paso 6: Obtener Tokens de Acceso

### 6.1. Token de Acceso Temporal (Para Pruebas)

1. En **"Configuración"** → **"Básica"**
2. Busca **"Token de acceso temporal"** o **"Temporary Access Token"**
3. Copia el token (empieza con `EAA...`)

**⚠️ IMPORTANTE:**
- Este token expira en 24 horas
- Solo funciona para pruebas
- No lo uses en producción

### 6.2. Token Permanente (Para Producción)

1. Ve a **"Configuración"** → **"Básica"**
2. Busca **"Token de acceso del sistema"** o **"System User Token"**
3. O crea un **"App Access Token"** con permisos permanentes

**Para producción, necesitas:**
- Token permanente
- Guardarlo como variable de entorno
- No exponerlo en el código

**⏱️ Tiempo estimado:** 5 minutos

---

## 📝 Paso 7: Obtener Phone Number ID y Business Account ID

### 7.1. Phone Number ID

1. En **"Configuración"** → **"Básica"**
2. Busca **"Phone number ID"** o **"ID del número de teléfono"**
3. Copia el ID (es un número largo)

### 7.2. WhatsApp Business Account ID

1. En **"Configuración"** → **"Básica"**
2. Busca **"WhatsApp Business Account ID"** o **"ID de cuenta comercial"**
3. Copia el ID

**Estos IDs los necesitarás para enviar mensajes.**

**⏱️ Tiempo estimado:** 2 minutos

---

## 📝 Paso 8: Configurar Variables de Entorno

### 8.1. Variables Necesarias

Agrega estas variables en Vercel (Settings → Environment Variables):

```bash
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=EAA...  # Token de acceso permanente
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # Phone Number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345  # Business Account ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_token_secreto_aqui  # Token para verificar webhook
WHATSAPP_API_VERSION=v21.0  # Versión de la API (usar la más reciente)
```

### 8.2. Generar Webhook Verify Token

1. Genera un token aleatorio seguro (mínimo 32 caracteres)
2. Ejemplo: `openssl rand -hex 32`
3. Guarda este token en `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

**⏱️ Tiempo estimado:** 5 minutos

---

## 📝 Paso 9: Actualizar Endpoint de Webhook

### 9.1. Agregar Soporte para GET (Verificación)

Tu endpoint `/api/webhooks/whatsapp` necesita manejar:

1. **GET** - Para verificación de Meta
2. **POST** - Para recibir mensajes

### 9.2. Código de Ejemplo

```typescript
// GET: Verificación de webhook
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Recibir mensajes (ya existe)
export async function POST(req: NextRequest) {
  // ... código existente ...
}
```

**⏱️ Tiempo estimado:** 10 minutos

---

## 📝 Paso 10: Probar Recepción de Mensajes

### 10.1. Enviar Mensaje de Prueba

1. Desde tu número de WhatsApp (el que configuraste en Meta)
2. Envía un mensaje de audio al número de prueba de Meta
3. Verifica que llegue al webhook

### 10.2. Verificar Logs

1. Revisa los logs de Vercel
2. Verifica que el webhook recibió el mensaje
3. Verifica que se procesó correctamente

**⏱️ Tiempo estimado:** 5 minutos

---

## 📝 Paso 11: Configurar Envío de Mensajes

### 11.1. Crear Función para Enviar Mensajes

Necesitas crear una función que use la API de Meta para enviar mensajes:

```typescript
// Ejemplo: src/lib/whatsappCloudApi.ts
export async function sendWhatsAppMessage(
  to: string, // Número de teléfono (formato: 59160360908)
  message: string
) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    }),
  });

  return await response.json();
}
```

### 11.2. Usar en Endpoints Existentes

Actualiza los endpoints que envían mensajes para usar esta función en lugar de Baileys.

**⏱️ Tiempo estimado:** 15 minutos

---

## 📝 Paso 12: Proceso de Aprobación (Opcional)

### 12.1. Cuándo Necesitas Aprobación

- ✅ **Número de prueba:** No requiere aprobación (limitado a números verificados)
- ⚠️ **Número de producción:** Requiere aprobación de Meta Business

### 12.2. Solicitar Aprobación

1. Ve a **"Configuración"** → **"Números de teléfono"**
2. Haz clic en **"Solicitar verificación"**
3. Completa el formulario:
   - Descripción del negocio
   - Casos de uso
   - Volumen estimado de mensajes
4. Espera aprobación (puede tardar días/semanas)

**⏱️ Tiempo estimado:** Variable (días/semanas)

---

## 📋 Resumen de URLs y Tokens

### URLs

```
Webhook:
https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp

Política de Privacidad:
https://ahorro365-core-api.vercel.app/privacy

Términos del Servicio:
https://ahorro365-core-api.vercel.app/terms

Eliminación de Datos:
https://ahorro365-core-api.vercel.app/delete-data
```

### Tokens e IDs (Obtener de Meta Developer)

```
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_token_secreto
WHATSAPP_API_VERSION=v21.0
```

---

## 🚨 Problemas Comunes y Soluciones

### 1. Webhook no se verifica

**Problema:** Meta no puede verificar el webhook

**Solución:**
- Verifica que el endpoint soporte GET
- Verifica que retorne `hub.challenge`
- Verifica que `hub.verify_token` coincida

### 2. No se reciben mensajes

**Problema:** Los mensajes no llegan al webhook

**Solución:**
- Verifica que estés suscrito al evento `messages`
- Verifica que el número esté configurado correctamente
- Revisa los logs de Vercel

### 3. Error al enviar mensajes

**Problema:** Error 401 o 403 al enviar

**Solución:**
- Verifica que el token de acceso sea válido
- Verifica que el token tenga permisos de `whatsapp_business_messaging`
- Verifica que el número de teléfono esté verificado

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://developers.facebook.com/docs/whatsapp
- **API Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Webhooks Guide:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

---

## ✅ Checklist Final

- [ ] Meta Business Account creado
- [ ] App creada en Meta Developer
- [ ] WhatsApp Business API agregado
- [ ] URLs legales configuradas
- [ ] Webhook configurado y verificado
- [ ] Tokens de acceso obtenidos
- [ ] Variables de entorno configuradas
- [ ] Endpoint actualizado (soporte GET)
- [ ] Recepción de mensajes probada
- [ ] Envío de mensajes implementado
- [ ] Proceso de aprobación iniciado (si es necesario)

---

**Última actualización:** 19 Nov 2025  
**Próximos pasos:** Seguir esta guía paso a paso

