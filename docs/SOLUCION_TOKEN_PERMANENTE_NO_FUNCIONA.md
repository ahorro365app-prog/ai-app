# 🔧 Solución: Token Permanente de System User No Funciona

> **Última actualización:** 2025-11-22  
> **Versión:** 1.0  
> **Problema:** Los tokens permanentes de System Users generados en Meta Business Suite no funcionan, solo funcionan los tokens temporales.

---

## ⚠️ Problema Común

Has generado un token permanente usando System Users siguiendo todos los pasos, pero **nunca funciona**. Solo te funcionan los tokens temporales del Graph API Explorer.

**Síntomas:**
- ❌ Error 401 Unauthorized
- ❌ "Invalid OAuth access token"
- ❌ "Session has expired"
- ❌ Los tokens temporales funcionan, los permanentes no

---

## 🔍 Causa Principal (90% de los casos)

**El System User NO tiene acceso al WhatsApp Business Account.**

El problema NO es el token, sino **los permisos del System User**. El System User necesita acceso específicamente al **WhatsApp Business Account**, no solo a la aplicación.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar WhatsApp Business Account ID

**Necesitas saber el ID de tu WhatsApp Business Account.**

1. Ve a [Meta Business Suite](https://business.facebook.com/)
2. Selecciona tu cuenta de negocio
3. Ve a **Configuración** > **Cuentas** > **Cuentas de WhatsApp**
4. Haz clic en tu cuenta de WhatsApp
5. En la URL o en los detalles, encontrarás el **WhatsApp Business Account ID** (ejemplo: `1554733609063961`)

O verifica en los logs cuando recibes un webhook:
```
metadata: {
  display_phone_number: "59160360908",
  phone_number_id: "840593392476984"
}
```

El `phone_number_id` es parte del WhatsApp Business Account.

---

### Paso 2: Verificar Permisos del System User (CRÍTICO)

**Este es el paso MÁS IMPORTANTE.**

1. Ve a **Meta Business Suite** > **Configuración** > **Usuarios** > **Usuarios del sistema**
2. Selecciona tu System User (ejemplo: "Ahorro 365")
3. Ve a la pestaña **"Activos asignados"** o **"Assigned Assets"**
4. **VERIFICA que tiene acceso a:**

   ✅ **WhatsApp Business Account** (NO solo la aplicación)
   
   ⚠️ **Si solo aparece la App, necesitas agregar el WhatsApp Business Account:**
   
   1. Haz clic en **"Agregar activos"** o **"Assign Assets"**
   2. Busca y selecciona tu **"Cuenta de WhatsApp"** o **"WhatsApp Business Account"**
   3. Otorga permisos: **"Control total"** o **"Full Control"**
   4. Haz clic en **"Guardar cambios"**

**❌ INCORRECTO (solo app):**
```
✅ App: ahorro 365 (Acceso completo)
❌ WhatsApp Business Account: (NO asignado)
```

**✅ CORRECTO (app + WhatsApp Business Account):**
```
✅ App: ahorro 365 (Acceso completo)
✅ WhatsApp Business Account: [Tu cuenta] (Acceso completo)
```

---

### Paso 3: Regenerar el Token con Permisos Correctos

**Después de asignar el WhatsApp Business Account, debes regenerar el token.**

1. Con el System User seleccionado, ve a la sección **"Tokens"**
2. Si ya tienes tokens, puedes revocarlos o crear uno nuevo
3. Haz clic en **"Generar nuevo token"** o **"Generate New Token"**
4. Completa el formulario:
   - **Aplicación**: Selecciona tu aplicación de WhatsApp Business API
   - **Permisos**: Selecciona **TODOS** los permisos necesarios:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
     - ✅ Cualquier otro permiso relacionado con WhatsApp
   - **Caducidad del token**: Selecciona **"Nunca"** o **"Never"** (permanente)
5. Haz clic en **"Generar token"**

---

### Paso 4: Copiar el Token Completo

**⚠️ IMPORTANTE:** Copia TODO el token, puede tener 200-300 caracteres.

1. **Selecciona TODO el token** (Ctrl+A o Cmd+A)
2. **Copia** (Ctrl+C o Cmd+C)
3. **Pega** en un editor de texto para verificar que está completo
4. Verifica que no tiene espacios ni saltos de línea

**Ejemplo de token válido:**
```
EAAdQZBR1AjkABPZCwcDA1ShlhgLkXItpZBRSrM0ExRaiT82ZCeu9yzmC5hrNLdg38TajZASWfRA7tI...
```
(Continúa por ~200-300 caracteres más)

---

### Paso 5: Actualizar Variables de Entorno

**1. Actualizar `.env.local` (desarrollo local):**

```env
# WhatsApp Cloud API - Token Permanente
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkABPZCwcDA1ShlhgLkXItpZBRSrM0ExRaiT82ZCeu9yzmC5hrNLdg38TajZASWfRA7tI...
WHATSAPP_PHONE_NUMBER_ID=840593392476984
WHATSAPP_BUSINESS_ACCOUNT_ID=1554733609063961
```

**2. Actualizar Vercel (producción):**

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `core-api`
3. Ve a **Settings** > **Environment Variables**
4. Busca `WHATSAPP_ACCESS_TOKEN`
5. Haz clic en **Edit** o **✏️**
6. **Pega el nuevo token** (TODO el token, sin espacios)
7. Haz clic en **Save**
8. **Redeploy** el proyecto:
   - Ve a **Deployments**
   - Haz clic en **"..."** (tres puntos) del último deployment
   - Selecciona **"Redeploy"**

---

### Paso 6: Verificar que el Token Funciona

**Opción 1: Probar desde el código (recomendado)**

Ya tienes un endpoint de debug:

```bash
# En PowerShell (desde el directorio del proyecto)
Invoke-WebRequest -Uri "http://localhost:3002/api/webhooks/whatsapp/debug" -Method GET
```

Deberías ver:
```json
{
  "status": "ok",
  "checks": {
    "env": {
      "WHATSAPP_ACCESS_TOKEN": true,
      "WHATSAPP_ACCESS_TOKEN_LENGTH": 287
    }
  }
}
```

**Opción 2: Probar enviando un mensaje**

Envía un mensaje de prueba por WhatsApp y verifica los logs. No deberías ver errores 401.

---

## 🔍 Diagnóstico: Verificar Permisos del System User

### Cómo Verificar que el System User Tiene Acceso Correcto

1. Ve a **Meta Business Suite** > **Configuración** > **Usuarios** > **Usuarios del sistema**
2. Selecciona tu System User
3. En **"Activos asignados"**, deberías ver:

**✅ Configuración CORRECTA:**
```
Activos asignados:
- App: ahorro 365 (Acceso completo)
- WhatsApp Business Account: [Tu cuenta] (Acceso completo)
```

**❌ Configuración INCORRECTA (causa del problema):**
```
Activos asignados:
- App: ahorro 365 (Acceso completo)
- WhatsApp Business Account: (NO asignado) ← ESTE ES EL PROBLEMA
```

---

## 🚨 Errores Comunes y Soluciones

### Error 1: "Invalid OAuth access token"

**Causa:** El token no tiene acceso al WhatsApp Business Account.

**Solución:**
1. Verifica que el System User tiene acceso al WhatsApp Business Account (Paso 2)
2. Regenera el token después de asignar el acceso
3. Copia TODO el token (200-300 caracteres)

---

### Error 2: "Object with ID '...' does not exist"

**Causa:** El token no tiene acceso al `PHONE_NUMBER_ID` específico.

**Solución:**
1. Verifica que el System User tiene acceso al WhatsApp Business Account completo (no solo a la app)
2. Regenera el token con permisos `whatsapp_business_management` y `whatsapp_business_messaging`
3. Verifica que el `WHATSAPP_PHONE_NUMBER_ID` es correcto

---

### Error 3: "Insufficient permissions"

**Causa:** El token no tiene los permisos necesarios.

**Solución:**
1. Regenera el token asegurándote de seleccionar:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
2. Verifica que el System User tiene "Control total" sobre el WhatsApp Business Account

---

### Error 4: Token funciona temporalmente pero luego expira

**Causa:** Generaste un token temporal por error (no permanente).

**Solución:**
1. Verifica que al generar el token seleccionaste **"Nunca"** o **"Never"** en "Caducidad del token"
2. Regenera el token asegurándote de seleccionar "Nunca" (permanente)

---

## 📋 Checklist Completo

Antes de decir que el token permanente no funciona, verifica:

- [ ] El System User tiene acceso a la **App** de WhatsApp Business API
- [ ] **El System User tiene acceso al WhatsApp Business Account** (CRÍTICO)
- [ ] El System User tiene "Control total" o "Full Control" sobre ambos
- [ ] El token fue generado **DESPUÉS** de asignar el WhatsApp Business Account
- [ ] El token tiene permisos `whatsapp_business_management` y `whatsapp_business_messaging`
- [ ] La caducidad del token está configurada como **"Nunca"** o **"Never"**
- [ ] Copiaste TODO el token (200-300 caracteres)
- [ ] El token no tiene espacios ni saltos de línea en `.env.local`
- [ ] Actualizaste el token en `.env.local` y en Vercel
- [ ] Reiniciaste el servidor local (`npm run dev`)
- [ ] Hiciste redeploy en Vercel (si es producción)

---

## 🎯 Solución Rápida (Resumen)

1. **Meta Business Suite** > **Configuración** > **Usuarios** > **Usuarios del sistema**
2. Selecciona tu System User
3. **"Activos asignados"** > **"Agregar activos"**
4. Selecciona tu **"WhatsApp Business Account"** (NO solo la app)
5. Otorga **"Control total"** > **"Guardar cambios"**
6. **"Tokens"** > **"Generar nuevo token"**
7. Selecciona tu app, permisos `whatsapp_business_management` y `whatsapp_business_messaging`, caducidad **"Nunca"**
8. **Copia TODO el token**
9. Actualiza `WHATSAPP_ACCESS_TOKEN` en `.env.local` y Vercel
10. Reinicia servidor local / Redeploy en Vercel
11. Prueba enviando un mensaje

---

## 🔍 Verificación Final

**Para verificar que el token permanente funciona:**

1. **Prueba localmente:**
   ```bash
   npm run dev
   # Envía un mensaje de prueba por WhatsApp
   # Verifica que no hay errores 401 en los logs
   ```

2. **Verifica en producción:**
   - Envía un mensaje de prueba
   - Verifica logs en Vercel Dashboard
   - No deberías ver errores 401

---

## 📝 Notas Importantes

### ¿Por qué los tokens temporales funcionan y los permanentes no?

Los tokens temporales del Graph API Explorer funcionan porque están asociados directamente a tu usuario de Meta, que tiene acceso automático al WhatsApp Business Account.

Los tokens permanentes de System Users solo funcionan si el System User tiene acceso explícito al WhatsApp Business Account (no solo a la app).

### ¿Necesito asignar el WhatsApp Business Account a cada System User?

Sí. Cada System User que vaya a generar tokens para WhatsApp necesita acceso explícito al WhatsApp Business Account.

### ¿Cuánto tiempo tarda en funcionar después de asignar el acceso?

Debería funcionar inmediatamente después de:
1. Asignar el WhatsApp Business Account al System User
2. Regenerar el token
3. Actualizar las variables de entorno
4. Reiniciar el servidor / redeploy

---

## 🆘 Si Todavía No Funciona

Si después de seguir TODOS los pasos anteriores el token permanente todavía no funciona:

1. **Verifica en Meta Business Suite:**
   - ¿El System User tiene acceso al WhatsApp Business Account?
   - ¿El token fue generado DESPUÉS de asignar el acceso?
   - ¿El token tiene caducidad "Nunca"?

2. **Verifica en el código:**
   - ¿El token está completo en `.env.local`? (200-300 caracteres)
   - ¿No hay espacios ni saltos de línea?
   - ¿El servidor fue reiniciado después de actualizar `.env.local`?

3. **Verifica los logs:**
   - ¿Qué error específico aparece?
   - ¿Es error 401? ¿403? ¿400?
   - ¿El mensaje de error dice algo específico?

4. **Prueba con Graph API Explorer:**
   - Pega el token permanente en Graph API Explorer
   - Intenta hacer una llamada: `GET /{PHONE_NUMBER_ID}`
   - ¿Funciona ahí? Si no funciona, el problema es el token o los permisos.

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22  
**Versión:** 1.0

