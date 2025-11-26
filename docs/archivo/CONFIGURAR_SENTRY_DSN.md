# 🔧 CONFIGURAR SENTRY DSN - PASOS RÁPIDOS

**Estado**: Ya tienes el código implementado, solo falta configurar el DSN

---

## 📋 PASOS

### 1. Copiar el DSN de Sentry

En la pantalla de Sentry que estás viendo:
1. Haz clic en el botón **"Copy DSN"** (en la sección "Manual Configuration")
2. El DSN se copiará al portapapeles
3. El DSN se ve así: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

---

### 2. Agregar DSN a Variables de Entorno

#### Opción A: Archivo `.env.local` (Desarrollo Local)

**App Principal** (`/.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Admin Dashboard** (`/admin-dashboard/.env.local`):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Nota**: Puedes usar el mismo DSN para ambos o crear proyectos separados.

#### Opción B: Vercel (Producción)

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   - **Name**: `NEXT_PUBLIC_SENTRY_DSN`
   - **Value**: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` (tu DSN)
   - **Environment**: Production, Preview, Development
4. Guarda

---

### 3. Reiniciar el Servidor

```bash
# En la raíz del proyecto
npm run dev

# En otra terminal, para admin dashboard
cd admin-dashboard
npm run dev
```

---

### 4. Probar que Funciona

#### Opción A: Crear Página de Prueba (Recomendado)

Crea `src/app/test-sentry/page.tsx`:

```typescript
"use client";

export default function TestSentry() {
  const triggerError = () => {
    throw new Error("Test error para Sentry - Todo funciona correctamente!");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Sentry</h1>
      <p className="mb-4">Haz clic en el botón para generar un error de prueba:</p>
      <button 
        onClick={triggerError} 
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
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

#### Opción B: Probar desde Consola del Navegador

1. Abre la consola del navegador (F12)
2. Ejecuta: `myUndefinedFunction();`
3. Ve a Sentry dashboard
4. Deberías ver el error

---

### 5. Verificar en Sentry Dashboard

1. Ve a: https://sentry.io/organizations/ahorro-365/issues/
2. Deberías ver el error de prueba
3. Haz clic en el error para ver:
   - Stack trace completo
   - Navegador y dispositivo
   - Contexto del error

---

## ✅ CHECKLIST

- [ ] DSN copiado de Sentry
- [ ] DSN agregado a `.env.local` (app principal)
- [ ] DSN agregado a `admin-dashboard/.env.local` (opcional, puede ser el mismo)
- [ ] Servidor reiniciado
- [ ] Error de prueba generado
- [ ] Error visible en Sentry dashboard

---

## 🎯 IMPORTANTE

### NO Ejecutar el Wizard

Sentry sugiere ejecutar:
```bash
npx @sentry/wizard@latest -i nextjs
```

**NO lo ejecutes** porque:
- ✅ Ya tenemos todos los archivos de configuración creados
- ✅ El wizard podría sobrescribir nuestros archivos
- ✅ Ya está todo configurado manualmente

### Solo Necesitas

1. ✅ Copiar el DSN
2. ✅ Agregarlo a variables de entorno
3. ✅ Reiniciar servidor
4. ✅ ¡Listo!

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Sentry no captura errores

1. **Verifica el DSN**: Asegúrate de que `NEXT_PUBLIC_SENTRY_DSN` esté configurado
2. **Verifica el ambiente**: En desarrollo, Sentry NO envía errores por defecto
3. **Para probar en desarrollo**: Agrega `NEXT_PUBLIC_SENTRY_DEBUG=true` a `.env.local`
4. **Revisa la consola**: Deberías ver logs de Sentry si está configurado

### Errores en el build

1. **Verifica instalación**: `npm list @sentry/nextjs`
2. **Limpia build**: `rm -rf .next .next-dev node_modules/.cache`
3. **Reinstala**: `npm install`

---

**¡Listo!** Una vez que agregues el DSN, Sentry comenzará a capturar errores automáticamente.







