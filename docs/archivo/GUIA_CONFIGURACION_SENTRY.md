# 🚀 GUÍA DE CONFIGURACIÓN DE SENTRY FREE

**Fecha**: 2025  
**Tiempo estimado**: 30-45 minutos  
**Costo**: $0 (gratis hasta 5,000 eventos/mes)

---

## 📋 PASOS PARA CONFIGURAR SENTRY

### Paso 1: Crear Cuenta en Sentry (5 minutos)

1. Ve a https://sentry.io/signup/
2. Crea una cuenta gratuita (puedes usar GitHub/Google)
3. Verifica tu email

---

### Paso 2: Crear Proyecto en Sentry (2 minutos)

1. Una vez dentro de Sentry, haz clic en **"Create Project"**
2. Selecciona **"Next.js"** como plataforma
3. Nombre del proyecto: `ahorro365-app` (o el que prefieras)
4. Haz clic en **"Create Project"**

---

### Paso 3: Obtener DSN (Data Source Name) (1 minuto)

1. Después de crear el proyecto, Sentry te mostrará una pantalla de configuración
2. **⚠️ IMPORTANTE**: NO ejecutes el wizard automático (`npx @sentry/wizard...`)
   - Ya tenemos todo el código configurado manualmente
   - El wizard podría sobrescribir nuestros archivos
3. En la sección **"Manual Configuration"**, haz clic en el botón **"Copy DSN"**
4. El DSN se ve así: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
5. **Copia este DSN** (lo necesitarás en el siguiente paso)
6. Puedes hacer clic en **"Skip Onboarding"** o simplemente cerrar la ventana

---

### Paso 4: Instalar Dependencias (2 minutos)

Ya está instalado en `package.json`, solo ejecuta:

```bash
# En la raíz del proyecto (app principal)
npm install

# En admin-dashboard
cd admin-dashboard
npm install
cd ..
```

---

### Paso 5: Configurar Variables de Entorno (5 minutos)

#### Para la App Principal

Agrega a `.env.local` (o variables de entorno en Vercel):

```bash
# Sentry DSN (obligatorio)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Sentry Org y Project (opcional, para source maps)
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=ahorro365-app

# Sentry Auth Token (opcional, para source maps en producción)
SENTRY_AUTH_TOKEN=tu-auth-token

# Debug Sentry en desarrollo (opcional)
NEXT_PUBLIC_SENTRY_DEBUG=false
```

#### Para Admin Dashboard

Agrega a `admin-dashboard/.env.local` (o variables de entorno en Vercel):

```bash
# Sentry DSN (obligatorio)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Sentry Org y Project (opcional)
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=ahorro365-admin

# Sentry Auth Token (opcional)
SENTRY_AUTH_TOKEN=tu-auth-token

# Debug Sentry en desarrollo (opcional)
NEXT_PUBLIC_SENTRY_DEBUG=false
```

**Nota**: Puedes usar el mismo DSN para ambos proyectos o crear proyectos separados.

---

### Paso 6: Obtener Auth Token (Opcional, solo para source maps) (5 minutos)

Si quieres subir source maps automáticamente en producción:

1. Ve a https://sentry.io/settings/account/api/auth-tokens/
2. Haz clic en **"Create New Token"**
3. Nombre: `ahorro365-sourcemaps`
4. Permisos: Selecciona `project:releases` y `org:read`
5. Haz clic en **"Create Token"**
6. **Copia el token** (solo se muestra una vez)
7. Agrégala a las variables de entorno como `SENTRY_AUTH_TOKEN`

**Nota**: Los source maps son opcionales. Sentry funciona sin ellos, pero con menos detalles del código.

---

### Paso 7: Probar Sentry (2 minutos)

#### Opción A: Probar con un Error Intencional

Crea un archivo temporal `src/app/test-sentry/page.tsx`:

```typescript
"use client";

export default function TestSentry() {
  const triggerError = () => {
    throw new Error("Test error para Sentry");
  };

  return (
    <div className="p-8">
      <h1>Test Sentry</h1>
      <button onClick={triggerError} className="bg-red-500 text-white px-4 py-2">
        Trigger Error
      </button>
    </div>
  );
}
```

1. Visita `/test-sentry` en tu app
2. Haz clic en el botón
3. Ve a tu dashboard de Sentry
4. Deberías ver el error aparecer en unos segundos

#### Opción B: Probar desde un API Route

Agrega esto temporalmente a cualquier API route:

```typescript
import * as Sentry from "@sentry/nextjs";

// En el handler
throw new Error("Test error para Sentry");
```

---

### Paso 8: Verificar que Funciona (1 minuto)

1. Ve a tu dashboard de Sentry: https://sentry.io/organizations/[tu-org]/issues/
2. Deberías ver el error de prueba
3. Haz clic en el error para ver:
   - Stack trace completo
   - Contexto del error
   - Usuario afectado (si está disponible)
   - Navegador y dispositivo

---

## ✅ VERIFICACIÓN FINAL

### Checklist

- [ ] Cuenta de Sentry creada
- [ ] Proyecto creado en Sentry
- [ ] DSN copiado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (`npm install`)
- [ ] Error de prueba enviado a Sentry
- [ ] Error visible en dashboard de Sentry

---

## 🔧 CONFIGURACIÓN AVANZADA (Opcional)

### Alertas por Email

1. Ve a tu proyecto en Sentry
2. Settings → Alerts
3. Crea una nueva alerta:
   - **Trigger**: "An issue is created"
   - **Action**: Enviar email
   - **Recipients**: Tu email

### Integración con Slack/Discord

1. Settings → Integrations
2. Selecciona Slack o Discord
3. Conecta tu workspace
4. Configura notificaciones

### Filtrado de Errores

Los archivos de configuración ya incluyen:
- ✅ Filtrado de datos sensibles (contraseñas, tokens, etc.)
- ✅ Ignorar errores comunes (rate limiting, CSRF, etc.)
- ✅ No enviar errores en desarrollo (a menos que `NEXT_PUBLIC_SENTRY_DEBUG=true`)

---

## 📊 LÍMITES DEL PLAN FREE

- ✅ **5,000 eventos/mes** (errores capturados)
- ✅ **1 proyecto** (puedes crear más proyectos si necesitas)
- ✅ **7 días de historial**
- ✅ **Alertas por email**
- ✅ **Integración con Slack/Discord**

### ¿Cuándo Necesitas Pagar?

- Si superas 5,000 eventos/mes → $29/mes (Sentry Pro)
- Si necesitas más de 7 días de historial
- Si necesitas más funcionalidades avanzadas

### Para Tu App (0-100 usuarios)

- **5,000 eventos/mes es más que suficiente**
- Probablemente uses 500-1,500 eventos/mes
- Puedes quedarte en Free por varios meses

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Sentry no captura errores

1. **Verifica el DSN**: Asegúrate de que `NEXT_PUBLIC_SENTRY_DSN` esté configurado
2. **Verifica el ambiente**: En desarrollo, Sentry no envía errores a menos que `NEXT_PUBLIC_SENTRY_DEBUG=true`
3. **Revisa la consola**: Deberías ver logs de Sentry si está configurado correctamente
4. **Revisa el dashboard**: Los errores pueden tardar unos segundos en aparecer

### Errores en el build

1. **Verifica que `@sentry/nextjs` esté instalado**: `npm list @sentry/nextjs`
2. **Limpia el build**: `rm -rf .next .next-dev node_modules/.cache`
3. **Reinstala dependencias**: `npm install`

### Source maps no funcionan

1. **Verifica `SENTRY_AUTH_TOKEN`**: Debe tener permisos `project:releases`
2. **Verifica `SENTRY_ORG` y `SENTRY_PROJECT`**: Deben coincidir con tu proyecto
3. **Source maps son opcionales**: Sentry funciona sin ellos

---

## 📝 NOTAS IMPORTANTES

### Seguridad

- ✅ **Datos sensibles filtrados**: Contraseñas, tokens, etc. se filtran automáticamente
- ✅ **Headers sensibles removidos**: Authorization, cookies, etc.
- ✅ **User context limitado**: Solo se envía el ID del usuario (sin email, teléfono, etc.)

### Desarrollo vs Producción

- **Desarrollo**: Sentry NO envía errores (para no llenar el dashboard)
- **Producción**: Sentry envía todos los errores
- **Debug**: Si `NEXT_PUBLIC_SENTRY_DEBUG=true`, Sentry envía errores incluso en desarrollo

### Performance

- **Sample rate**: Solo 10% de requests se monitorean en producción (configurable)
- **Impacto mínimo**: Sentry tiene un impacto mínimo en el rendimiento
- **Source maps**: Solo se suben en producción (no en desarrollo)

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Configurar Sentry (esta guía)
2. ⚠️ Probar con un error intencional
3. ⚠️ Configurar alertas por email
4. ⚠️ Monitorear errores en producción
5. ⚠️ Revisar dashboard regularmente

---

**¡Listo!** Sentry está configurado y listo para detectar errores en producción.

**Última actualización**: 2025

