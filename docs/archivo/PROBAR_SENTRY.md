# 🧪 CÓMO PROBAR SENTRY

**Estado**: Variables de entorno configuradas ✅  
**Próximo paso**: Probar que Sentry capture errores

---

## 🚀 OPCIÓN 1: Probar en Desarrollo (Recomendado para Testing)

### Paso 1: Habilitar Debug en Desarrollo

Agrega a tu `.env.local` (temporalmente, solo para probar):

```bash
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**⚠️ IMPORTANTE**: Después de probar, quita esta variable o Sentry enviará todos los errores de desarrollo al dashboard.

### Paso 2: Reiniciar el Servidor

```bash
# Detén el servidor actual (Ctrl+C)
# Reinicia el servidor
npm run dev
```

### Paso 3: Visitar la Página de Prueba

1. Abre tu navegador y ve a: `http://localhost:3000/test-sentry`
2. Haz clic en uno de los botones para generar un error
3. Ve a tu dashboard de Sentry: https://sentry.io/organizations/ahorro-365/issues/
4. Deberías ver el error aparecer en unos segundos

### Paso 4: Verificar el Error

1. Haz clic en el error en Sentry
2. Verifica que puedas ver:
   - Stack trace completo
   - Navegador y dispositivo
   - Contexto del error
   - URL donde ocurrió el error

---

## 🚀 OPCIÓN 2: Probar en Producción (Recomendado para Verificación Final)

### Paso 1: Desplegar a Vercel

1. Asegúrate de que `NEXT_PUBLIC_SENTRY_DSN` esté configurado en Vercel
2. Haz deploy a producción
3. **NO** agregues `NEXT_PUBLIC_SENTRY_DEBUG=true` en producción

### Paso 2: Generar un Error en Producción

1. Visita tu app en producción
2. Visita: `https://tu-app.vercel.app/test-sentry`
3. Haz clic en uno de los botones
4. El error se enviará automáticamente a Sentry

### Paso 3: Verificar en Sentry

1. Ve a tu dashboard de Sentry
2. Deberías ver el error aparecer
3. Verifica que todos los detalles estén correctos

---

## 🧪 OPCIÓN 3: Probar con un Error Real (Opcional)

Si quieres probar con un error más realista, puedes:

### En un API Route

```typescript
// src/app/api/test-error/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // Simular un error de base de datos
  throw new Error("Error simulado de base de datos");
}
```

Visita: `http://localhost:3000/api/test-error`

### En un Componente

```typescript
// Cualquier componente
const handleClick = () => {
  throw new Error("Error al procesar la transacción");
};
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] DSN configurado en `.env.local`
- [ ] `NEXT_PUBLIC_SENTRY_DEBUG=true` agregado (solo para desarrollo)
- [ ] Servidor reiniciado
- [ ] Página de prueba visitada (`/test-sentry`)
- [ ] Error generado (clic en botón)
- [ ] Error visible en Sentry dashboard
- [ ] Stack trace completo visible
- [ ] Contexto del error visible (navegador, URL, etc.)

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Sentry no captura errores en desarrollo

**Problema**: Los errores no aparecen en Sentry cuando estás en desarrollo.

**Solución**: 
1. Verifica que `NEXT_PUBLIC_SENTRY_DEBUG=true` esté en `.env.local`
2. Reinicia el servidor
3. Verifica que el DSN esté correcto

### Sentry no captura errores en producción

**Problema**: Los errores no aparecen en Sentry en producción.

**Solución**:
1. Verifica que `NEXT_PUBLIC_SENTRY_DSN` esté configurado en Vercel
2. Verifica que el DSN sea correcto
3. Espera unos segundos (puede haber un pequeño delay)
4. Verifica la consola del navegador (puede haber errores de conexión)

### Errores aparecen pero sin stack trace

**Problema**: Los errores aparecen en Sentry pero sin detalles del código.

**Solución**:
1. Esto es normal si no tienes source maps configurados
2. Source maps son opcionales (Sentry funciona sin ellos)
3. Para habilitar source maps, necesitas configurar `SENTRY_AUTH_TOKEN` (ver `GUIA_CONFIGURACION_SENTRY.md`)

### Muchos errores en desarrollo

**Problema**: Sentry está capturando demasiados errores de desarrollo.

**Solución**:
1. Quita `NEXT_PUBLIC_SENTRY_DEBUG=true` de `.env.local`
2. Reinicia el servidor
3. Sentry dejará de enviar errores en desarrollo

---

## 📊 QUÉ ESPERAR

### En Desarrollo (con `NEXT_PUBLIC_SENTRY_DEBUG=true`)

- ✅ Sentry captura todos los errores
- ✅ Los errores aparecen en el dashboard inmediatamente
- ✅ Puedes ver stack traces completos
- ⚠️ Puede llenar el dashboard rápidamente

### En Producción (sin `NEXT_PUBLIC_SENTRY_DEBUG`)

- ✅ Sentry captura solo errores reales
- ✅ Los errores aparecen en el dashboard
- ✅ Stack traces pueden estar limitados (sin source maps)
- ✅ No se llena el dashboard con errores de desarrollo

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Probar Sentry en desarrollo (esta guía)
2. ⚠️ Verificar que funcione en producción
3. ⚠️ Configurar alertas por email (opcional)
4. ⚠️ Revisar dashboard regularmente
5. ⚠️ Remover `NEXT_PUBLIC_SENTRY_DEBUG=true` después de probar

---

**¡Listo!** Una vez que verifiques que Sentry funciona, puedes quitar `NEXT_PUBLIC_SENTRY_DEBUG=true` y dejar que Sentry monitoree solo errores en producción.







