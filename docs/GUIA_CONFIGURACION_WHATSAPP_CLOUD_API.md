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

### ✅ Configuración Meta Completada (20 Nov 2025)

- [x] Crear cuenta de Meta Business
- [x] Crear app en Meta Developer
- [x] Configurar WhatsApp Business API
- [x] Confirmar número personal (Actualizado 20 Nov 2025)
  - **Número:** +591 60360908
  - **App ID:** `2059355704823360`
  - **Phone Number ID:** `840593392476984` (actualizado)
  - **WhatsApp Business Account ID:** `1554733609063961` (actualizado)

### ✅ Webhook Configurado y Verificado (20 Nov 2025)

- [x] Configurar webhook en Meta
  - **URL local (ngrok):** `https://flectionless-initially-petra.ngrok-free.dev/api/webhooks/whatsapp`
  - **Token:** `7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876`
  - **Estado:** ✅ Verificado exitosamente (Status 200)
  - **User-Agent confirmado:** `facebookplatform/1.0`

- [x] Suscribirse a eventos del webhook
  - ✅ `messages` (v24.0) - Para recibir mensajes entrantes
  - ✅ `message_template_status_update` (v24.0) - Para estados de mensajes

### ⏳ Pendiente

- [ ] Probar recepción de mensajes de WhatsApp
- [ ] Configurar webhook en producción (Vercel)
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
2. En la sección **"Webhook"**, verifica/ingresa:

   **URL de devolución de llamada (Callback URL):**
   ```
   https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp
   ```

   **Token de verificación (Verify Token):**
   ```
   7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
   ```
   ⚠️ **IMPORTANTE:** Este token debe ser EXACTAMENTE el mismo que configuraste en Vercel como `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. No debe haber espacios antes o después.

3. **Desactiva el certificado de cliente:**
   - El toggle **"Adjunta un certificado de cliente"** debe estar desactivado
   - Si está activado (azul), haz clic para desactivarlo
   - No es necesario para este caso de uso

4. Haz clic en **"Verificar y guardar"** (botón azul)
   - ⚠️ **NO uses "Probar"** - ese botón no envía los parámetros correctos
   - Solo "Verificar y guardar" funciona correctamente

5. **Verifica en los logs de Vercel:**
   - Ve a Vercel → ahorro365-core-api → Logs
   - Deberías ver: `✅ Webhook verified successfully` con status 200
   - Si ves 400 o 403, revisa que el token sea exactamente el mismo

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

**Después de verificar el webhook exitosamente:**

1. En la misma página, baja hasta la sección **"Campos del webhook"**
2. Verás una tabla con columnas: Campo, Versión, Prueba, Suscribirse
3. Para cada campo que necesites:
   - ✅ **messages** (mensajes entrantes) - **OBLIGATORIO**
     - Haz clic en el botón **"Suscribirse"** en la fila de "messages"
   - ✅ **message_status** (estado de mensajes enviados) - **OPCIONAL**
     - Haz clic en el botón **"Suscribirse"** en la fila de "message_status"
     - Útil para saber si los mensajes fueron entregados/leídos

4. Verifica que aparezca un checkmark ✅ o "Suscrito" en la columna "Suscribirse"

**⏱️ Tiempo estimado:** 5 minutos

### 5.5. Agregar Números de Prueba (IMPORTANTE)

**⚠️ CRÍTICO:** Si tu número de WhatsApp Business está en modo de prueba (sandbox), **SOLO puedes recibir mensajes de números que hayas agregado explícitamente como números de prueba**.

**Pasos para agregar tu número de prueba:**

1. Ve a **Meta Developer Console** → Tu App → **WhatsApp** → **Configuration**
2. Haz clic en **"Phone numbers"** o **"Números de teléfono"**
3. Busca la sección **"To"** o **"Test numbers"** o **"Números de prueba"**
   - Si no la ves, ve a **"Getting Started"** → **"Send and receive messages"**
4. Haz clic en **"Add test number"** o **"Agregar número de prueba"**
5. Ingresa tu número personal con código de país:
   - Ejemplo: `+591 71234567` (reemplaza con tu número real)
   - ⚠️ **IMPORTANTE:** Debe incluir el código de país (+591 para Bolivia)
6. Meta te enviará un código de verificación por WhatsApp
7. Ingresa el código para verificar tu número

**Después de agregar tu número:**
- Espera unos segundos para que se active
- Envía un mensaje de audio desde tu número personal
- Deberías ver una petición POST en los logs del webhook
- El mensaje debería procesarse correctamente

**💡 Nota:** Puedes agregar hasta 5 números de prueba en modo sandbox. Para producción, necesitarás verificar tu negocio con Meta.

**⏱️ Tiempo estimado:** 2-3 minutos

### 5.6. Cambiar a Modo Activo (Producción) - Recomendado

**💡 Ventaja:** En modo activo, puedes recibir mensajes de **CUALQUIER número** sin necesidad de agregarlos como números de prueba.

**📊 Comparación:**

| Característica | Modo Desarrollo | Modo Activo |
|---------------|----------------|-------------|
| Números permitidos | Solo 5 números de prueba | Cualquier número |
| Verificación requerida | No | Sí (1-3 días) |
| Costo | Gratis | Gratis (mensajes entrantes) |
| Ideal para | Desarrollo inicial | Producción y pruebas reales |

**Pasos para cambiar a modo activo:**

1. **Verificar tu negocio en Meta Business:**
   - Ve a: https://business.facebook.com
   - Configuración → Información del negocio
   - Completa toda la información requerida
   - Haz clic en "Solicitar verificación"

2. **Completar verificación:**
   - Meta te pedirá verificar tu identidad (documento)
   - Verificar tu negocio (documentos del negocio)
   - Confirmar tu número de teléfono
   - ⏱️ Este proceso puede tomar 1-3 días

3. **Cambiar modo de la app:**
   - Una vez verificado, ve a: Meta Developer → Tu App → Configuración
   - Busca "Modo" o "Mode"
   - Cambia de "Desarrollo" a "Activo" o "Producción"

**⚠️ IMPORTANTE:** 
- **Para RECIBIR mensajes:** Cambiar a modo activo NO requiere verificación completa del negocio
- Puedes recibir mensajes de cualquier número inmediatamente después de cambiar a modo activo
- **Para ENVIAR mensajes fuera de 24h:** SÍ se requiere verificación del negocio
- **Para templates de marketing:** SÍ se requiere verificación del negocio
- Los mensajes entrantes siguen siendo gratuitos en modo activo

**💡 Nota:** Si cambias a modo activo y no te pide verificación, es CORRECTO. Puedes recibir mensajes de cualquier número sin agregarlos como números de prueba.

**⏱️ Tiempo estimado:** Inmediato (cambio de modo) | 1-3 días (verificación solo si necesitas enviar fuera de 24h)

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

**Permisos necesarios al generar el token:**
- ✅ `whatsapp_business_management` - Gestionar cuenta de WhatsApp Business
- ✅ `whatsapp_business_messaging` - Enviar y recibir mensajes

**Pasos para generar token:**
1. Haz clic en **"Generar token"** o **"Generate Token"**
2. Selecciona la app (si aplica)
3. Configura la expiración (recomendado: "Sin expiración" para producción)
4. En **"Asignar permisos"**, selecciona:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Haz clic en **"Generar token"**
6. **⚠️ IMPORTANTE:** Copia el token inmediatamente (solo se muestra una vez)

**Para producción, necesitas:**
- Token permanente (sin expiración)
- Guardarlo como variable de entorno en Vercel
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
WHATSAPP_ACCESS_TOKEN=EAA...  # Token de acceso permanente (obtener en Meta Developer)
WHATSAPP_PHONE_NUMBER_ID=840593392476984  # Phone Number ID (actualizado 20 Nov 2025)
WHATSAPP_BUSINESS_ACCOUNT_ID=1554733609063961  # Business Account ID (actualizado 20 Nov 2025)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876  # Token generado 20 Nov 2025
WHATSAPP_API_VERSION=v22.0  # Versión de la API (usar la más reciente, actualmente v22.0)
```

### 8.2. Generar Webhook Verify Token

**✅ TOKEN GENERADO (20 Nov 2025):**

```
7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
```

**📋 Pasos para configurar:**

1. **En Vercel:**
   - Ve a tu proyecto `ahorro365-core-api`
   - Settings → Environment Variables
   - Busca `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Actualiza el valor con el token de arriba
   - Guarda los cambios

2. **En Meta Developer Console:**
   - Ve a Webhooks → Configuración
   - En el campo "Verify Token", pega el mismo token
   - Haz clic en "Verificar y guardar"

**⚠️ IMPORTANTE:** El token debe ser EXACTAMENTE el mismo en Vercel y Meta.

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
WHATSAPP_ACCESS_TOKEN=EAA...  # Obtener en Meta Developer → WhatsApp → API Setup
WHATSAPP_PHONE_NUMBER_ID=840593392476984  # ✅ Actualizado 20 Nov 2025
WHATSAPP_BUSINESS_ACCOUNT_ID=1554733609063961  # ✅ Actualizado 20 Nov 2025
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876  # ✅ Generado 20 Nov 2025
WHATSAPP_API_VERSION=v22.0  # Usar la versión más reciente
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

