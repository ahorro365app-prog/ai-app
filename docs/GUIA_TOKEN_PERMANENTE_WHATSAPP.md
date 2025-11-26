# 🔐 Guía: Crear Token Permanente para WhatsApp Cloud API

> **Última actualización:** 2025-11-21  
> **Versión:** 1.0

---

## 📋 Índice

1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso a Paso](#paso-a-paso)
4. [Configuración en el Proyecto](#configuración-en-el-proyecto)
5. [Verificación](#verificación)
6. [Troubleshooting](#troubleshooting)
7. [Importante: Seguridad](#importante-seguridad)

---

## 1. Introducción

Los **tokens de acceso** de Meta para WhatsApp Cloud API suelen expirar después de cierto tiempo (60 días o más). Para evitar interrupciones en el servicio, puedes crear un **token permanente** usando **System Users** en Meta Business Suite.

### 1.1 ¿Qué es un System User?

Un **System User** es un usuario especial que representa tu aplicación o sistema automatizado. A diferencia de los tokens de usuario personal, los tokens de System User pueden ser **permanentes** (sin fecha de expiración).

### 1.2 Ventajas

- ✅ **Sin expiración**: No necesitas renovar el token manualmente
- ✅ **Más seguro**: Separado de usuarios personales
- ✅ **Controlado**: Permisos específicos por aplicación
- ✅ **Estable**: Ideal para producción

---

## 2. Requisitos Previos

Antes de comenzar, asegúrate de tener:

1. ✅ **Cuenta de Meta Business Suite**
   - Acceso a [Meta Business Suite](https://business.facebook.com/)
   - Permisos de administrador en la cuenta de negocio

2. ✅ **Aplicación de WhatsApp Business API creada**
   - Aplicación configurada en [Meta for Developers](https://developers.facebook.com/)
   - WhatsApp Business API activada

3. ✅ **Permisos de administrador**
   - Debes ser administrador de la cuenta de negocio
   - Debes tener acceso a "Usuarios del sistema"

---

## 3. Paso a Paso

### Paso 1: Acceder a Meta Business Suite

1. Inicia sesión en [Meta Business Suite](https://business.facebook.com/)
2. Selecciona tu **Cuenta de Negocio**
3. Ve a **Configuración** (⚙️) en el menú lateral izquierdo

### Paso 2: Navegar a Usuarios del Sistema

1. En el menú de configuración, busca **"Usuarios"** en el menú lateral
2. Haz clic en **"Usuarios del sistema"** (System Users)
3. Verás la lista de usuarios del sistema existentes (si los hay)

### Paso 3: Crear un Nuevo Usuario del Sistema

1. Haz clic en el botón **"Agregar"** o **"Add"** (arriba a la derecha)
2. Completa el formulario:
   - **Nombre del usuario del sistema**: `Ahorro365 WhatsApp API` (o el nombre que prefieras)
   - **Rol**: Selecciona **"Administrador"** o **"Administrator"**
   - **Descripción (opcional)**: `Usuario del sistema para WhatsApp Cloud API`
3. Haz clic en **"Crear usuario del sistema"** o **"Create System User"**

### Paso 4: Asignar Permisos a la Aplicación

1. Una vez creado el usuario del sistema, haz clic en el usuario que acabas de crear
2. En la sección **"Activos"** (Assets) o **"Assigned Assets"**, haz clic en **"Agregar activos"** o **"Assign Assets"**
3. Busca y selecciona tu **aplicación de WhatsApp Business API**
4. Otorga permisos:
   - Selecciona **"Control total"** o **"Full Control"**
   - Alternativamente, selecciona permisos específicos:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
5. Haz clic en **"Guardar cambios"** o **"Save Changes"**

### Paso 5: Generar el Token Permanente

1. Con el usuario del sistema seleccionado, busca la sección **"Tokens"** o **"Tokens"**
2. Haz clic en **"Generar nuevo token"** o **"Generate New Token"**
3. Completa el formulario:
   - **Aplicación**: Selecciona tu aplicación de WhatsApp Business API
   - **Permisos**: Selecciona los permisos necesarios:
     - ✅ `whatsapp_business_management`
     - ✅ `whatsapp_business_messaging`
   - **Caducidad del token**: Selecciona **"Nunca"** o **"Never"** (esto lo hace permanente)
4. Haz clic en **"Generar token"** o **"Generate Token"**

### Paso 6: Copiar y Guardar el Token

**⚠️ IMPORTANTE:** El token se muestra **solo una vez**. Si lo pierdes, tendrás que generar uno nuevo.

1. **Copia el token completo** inmediatamente
2. **Guárdalo en un lugar seguro**:
   - Un gestor de contraseñas (1Password, LastPass, etc.)
   - Un archivo encriptado
   - Variables de entorno locales (temporalmente)

**Formato del token:**
```
EAAdQZBR1AjkABPZCwcDA1ShlhgLkXItpZBRSrM0ExRaiT82ZCeu9yzmC5hrNLdg38TajZASWfRA7tI...
```
(Los tokens suelen tener ~200-300 caracteres)

---

## 4. Configuración en el Proyecto

### 4.1 Actualizar Variable de Entorno Local

1. Abre el archivo `.env.local` en `packages/core-api/`
2. Actualiza la variable `WHATSAPP_ACCESS_TOKEN`:

```env
# WhatsApp Cloud API - Token Permanente
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkABPZCwcDA1ShlhgLkXItpZBRSrM0ExRaiT82ZCeu9yzmC5hrNLdg38TajZASWfRA7tI
```

3. **No** incluyas espacios ni comillas
4. Guarda el archivo

### 4.2 Actualizar Variable en Vercel (Producción)

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `core-api`
3. Ve a **Settings** > **Environment Variables**
4. Busca la variable `WHATSAPP_ACCESS_TOKEN`
5. Haz clic en **Edit** o **✏️**
6. Pega el nuevo token permanente
7. Haz clic en **Save**
8. **Redeploy** el proyecto para aplicar los cambios:
   - Ve a **Deployments**
   - Haz clic en **"..."** (tres puntos) del último deployment
   - Selecciona **"Redeploy"**

### 4.3 Verificar que el Token Funciona

Después de actualizar el token, verifica que funciona correctamente:

```bash
# En el directorio packages/core-api
npm run dev
```

Envía un mensaje de prueba y verifica los logs para asegurarte de que no hay errores de autenticación.

---

## 5. Verificación

### 5.1 Verificar Token con Graph API Explorer

1. Ve a [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecciona tu aplicación de WhatsApp Business API
3. En **"Access Token"**, haz clic en **"Generate Access Token"**
4. Alternativamente, pega tu token permanente directamente
5. Prueba hacer una llamada:
   ```
   GET /{PHONE_NUMBER_ID}
   ```
   (Reemplaza `{PHONE_NUMBER_ID}` con tu Phone Number ID)

### 5.2 Verificar Token desde el Código

Puedes crear un endpoint de prueba temporal:

```typescript
// packages/core-api/src/app/api/whatsapp/test-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!token) {
    return NextResponse.json({ error: 'Token no configurado' }, { status: 500 });
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}?fields=verified_name`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      logger.info('✅ Token válido:', data);
      return NextResponse.json({ 
        success: true, 
        message: 'Token válido',
        data 
      });
    } else {
      logger.error('❌ Token inválido:', data);
      return NextResponse.json({ 
        success: false, 
        error: 'Token inválido',
        details: data 
      }, { status: 401 });
    }
  } catch (error: any) {
    logger.error('❌ Error verificando token:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Luego llama a:
```
GET http://localhost:3002/api/whatsapp/test-token
```

---

## 6. Troubleshooting

### 6.1 Error: "Invalid OAuth access token"

**Causa:** El token es inválido o expiró.

**Solución:**
1. Verifica que copiaste el token completo (sin espacios ni saltos de línea)
2. Genera un nuevo token permanente siguiendo los pasos anteriores
3. Actualiza la variable de entorno en `.env.local` y Vercel

---

### 6.2 Error: "Insufficient permissions"

**Causa:** El token no tiene los permisos necesarios.

**Solución:**
1. Verifica que asignaste los permisos correctos al System User:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
2. Regenera el token con los permisos correctos

---

### 6.3 Error: "Object with ID '...' does not exist"

**Causa:** El `WHATSAPP_PHONE_NUMBER_ID` es incorrecto o el token no tiene acceso a ese número.

**Solución:**
1. Verifica que el System User tiene permisos sobre la aplicación correcta
2. Verifica que el `PHONE_NUMBER_ID` sea correcto en Meta Dashboard > API Setup

---

### 6.4 Token Se Ve Cortado o Incompleto

**Causa:** No copiaste todo el token o se truncó.

**Solución:**
1. Los tokens suelen tener 200-300 caracteres
2. Asegúrate de copiar TODO el token (incluye el inicio y el final)
3. Verifica que no hay espacios ni saltos de línea en el `.env.local`

---

## 7. Importante: Seguridad

### 7.1 Proteger el Token

**⚠️ NUNCA:**
- ❌ Subas el token a Git/GitHub
- ❌ Compartas el token en mensajes no encriptados
- ❌ Lo expongas en el código del frontend
- ❌ Lo publiques en documentación pública

**✅ SIEMPRE:**
- ✅ Úsalo solo en variables de entorno del servidor
- ✅ Guarda el token en un gestor de contraseñas seguro
- ✅ Rota el token si sospechas que fue comprometido
- ✅ Usa diferentes tokens para desarrollo y producción

### 7.2 Revocar Token Comprometido

Si sospechas que tu token fue comprometido:

1. Ve a Meta Business Suite > Usuarios > Usuarios del sistema
2. Selecciona el usuario del sistema
3. Ve a la sección **"Tokens"**
4. Encuentra el token comprometido
5. Haz clic en **"Revocar"** o **"Revoke"**
6. Genera un nuevo token permanente
7. Actualiza la variable de entorno en `.env.local` y Vercel

### 7.3 Mejores Prácticas

1. **Rotación periódica**: Aunque el token es permanente, considera rotarlo cada 6-12 meses
2. **Monitoreo**: Revisa los logs periódicamente para detectar accesos no autorizados
3. **Permisos mínimos**: Solo asigna los permisos necesarios al System User
4. **Documentación**: Documenta quién tiene acceso y cuándo fue creado el token

---

## 8. Resumen de Pasos Rápidos

1. ✅ Meta Business Suite > Configuración > Usuarios > Usuarios del sistema
2. ✅ Crear nuevo usuario del sistema (rol: Administrador)
3. ✅ Asignar aplicación de WhatsApp Business API
4. ✅ Generar token permanente (caducidad: Nunca)
5. ✅ Copiar y guardar el token de forma segura
6. ✅ Actualizar `WHATSAPP_ACCESS_TOKEN` en `.env.local` y Vercel
7. ✅ Verificar que funciona
8. ✅ Redeploy en Vercel

---

## 9. Referencias

- [Meta Business Suite](https://business.facebook.com/)
- [Meta for Developers - WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [System Users Documentation](https://developers.facebook.com/docs/marketing-api/system-users)

---

## 10. Historial de Cambios

### 2025-11-21 - Guía de Token Permanente Creada

**Hora:** 21:30:00  
**Tipo:** `DOCUMENTATION`  
**Descripción:** Guía completa para crear tokens permanentes usando System Users

**Razón:** Facilitar la configuración de tokens permanentes sin necesidad de renovación manual.

---

**Documento creado:** 2025-11-21 21:30:00  
**Última actualización:** 2025-11-21 21:30:00  
**Versión:** 1.0

