# 🔍 CÓMO OBTENER EL DSN DE SENTRY CORRECTAMENTE

**Guía paso a paso para obtener y configurar el DSN de Sentry**

---

## 📋 PASO 1: Acceder a Sentry

1. Ve a **https://sentry.io**
2. Inicia sesión con tu cuenta

---

## 📋 PASO 2: Crear o Seleccionar Proyecto

### Si NO tienes proyecto:

1. Haz clic en **"Create Project"** (botón grande en el dashboard)
2. Selecciona **"Next.js"** como plataforma
3. Nombre del proyecto: `ahorro365-app` (o el que prefieras)
4. Haz clic en **"Create Project"**

### Si YA tienes proyecto:

1. En el menú lateral izquierdo, haz clic en **"Projects"**
2. Selecciona tu proyecto (ej: `ahorro365-app`)

---

## 📋 PASO 3: Obtener el DSN

### Opción A: Desde la página de configuración inicial (Recomendado)

1. Si acabas de crear el proyecto, verás una pantalla de configuración
2. **⚠️ IMPORTANTE**: NO ejecutes el comando `npx @sentry/wizard...`
3. Busca la sección que dice **"Manual Configuration"** o **"Client Keys (DSN)"**
4. Verás un código que se ve así:
   ```
   https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
5. Haz clic en el botón **"Copy"** o **"Copy DSN"** para copiarlo
6. **Guarda este DSN** - lo necesitarás en el siguiente paso

### Opción B: Desde Settings del Proyecto

1. Una vez dentro de tu proyecto, ve a **Settings** (en el menú superior)
2. O haz clic en el ícono de engranaje ⚙️
3. En el menú lateral izquierdo, busca **"Client Keys (DSN)"**
4. Verás una lista de DSNs (puede haber uno o varios)
5. Haz clic en el botón **"Copy"** o **"Show"** junto al DSN
6. Copia el DSN completo

### Opción C: Desde Project Settings

1. Ve a **Settings** → **Projects** → **[tu-proyecto]**
2. En el menú lateral, busca **"Client Keys (DSN)"**
3. Copia el DSN que aparece

---

## 📋 PASO 4: Verificar el Formato del DSN

El DSN debe verse así:

```
https://[hash]@[hash].ingest.sentry.io/[project-id]
```

**Ejemplo válido:**
```
https://abc123def456@o123456.ingest.sentry.io/7890123456
```

**Características:**
- ✅ Empieza con `https://`
- ✅ Tiene un `@` en el medio
- ✅ Contiene `.ingest.sentry.io`
- ✅ Termina con un número (project ID)
- ✅ Tiene aproximadamente 60-100 caracteres

**❌ Ejemplos INVÁLIDOS:**
- `https://sentry.io/...` (falta el hash antes del @)
- `http://...` (debe ser https)
- Solo números o letras sin la estructura correcta

---

## 📋 PASO 5: Agregar DSN a `.env.local`

1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Si no existe, créalo
3. Agrega estas líneas:

```bash
# Sentry DSN (obligatorio)
NEXT_PUBLIC_SENTRY_DSN=https://[tu-dsn-aqui]@[hash].ingest.sentry.io/[id]

# Habilitar Sentry en desarrollo (para testing)
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**Ejemplo completo:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123456
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**⚠️ IMPORTANTE:**
- No agregues comillas alrededor del DSN
- No agregues espacios antes o después del `=`
- Asegúrate de que sea exactamente como lo copiaste de Sentry

---

## 📋 PASO 6: Reiniciar el Servidor

1. Detén el servidor actual (Ctrl+C en la terminal)
2. Inicia el servidor de nuevo:
   ```bash
   npm run dev
   ```

---

## 📋 PASO 7: Verificar que Funciona

1. Abre tu navegador en `http://localhost:3000/test-sentry`
2. Revisa la sección **"Estado de Configuración"**:
   - ✅ **DSN configurado**: Debe decir "✅ Sí"
   - ✅ **Longitud DSN**: Debe mostrar un número mayor a 50
   - ✅ **Modo Debug**: Debe decir "✅ Activado"
3. Haz clic en **"🔴 Generar Error Síncrono"**
4. Espera 10-30 segundos
5. Ve a tu dashboard de Sentry → **"Issues"**
6. Deberías ver el error aparecer

---

## ❌ PROBLEMAS COMUNES

### Problema 1: "DSN configurado: ❌ No"

**Causa**: El DSN no está en `.env.local` o está mal escrito

**Solución**:
1. Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
2. Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
3. Verifica que no tenga espacios antes del `=`
4. Reinicia el servidor después de agregar el DSN

### Problema 2: "Longitud DSN: 0 caracteres"

**Causa**: La variable de entorno no se está leyendo

**Solución**:
1. Asegúrate de que la variable se llame exactamente `NEXT_PUBLIC_SENTRY_DSN` (con `NEXT_PUBLIC_` al inicio)
2. Reinicia el servidor completamente
3. Verifica que no haya errores de sintaxis en `.env.local`

### Problema 3: El DSN parece correcto pero no funciona

**Causa**: El DSN puede estar mal copiado o el proyecto de Sentry está mal configurado

**Solución**:
1. Ve a Sentry y verifica que el proyecto esté activo
2. Copia el DSN de nuevo desde Sentry
3. Pega el DSN en un editor de texto para verificar que no tenga espacios extra
4. Asegúrate de que el DSN empiece con `https://` y tenga `@` y `.ingest.sentry.io`

### Problema 4: "Modo Debug: ⚠️ Desactivado"

**Causa**: Falta la variable `NEXT_PUBLIC_SENTRY_DEBUG=true`

**Solución**:
1. Agrega `NEXT_PUBLIC_SENTRY_DEBUG=true` a tu `.env.local`
2. Reinicia el servidor

---

## 🔍 VERIFICAR DSN EN LA CONSOLA

Si quieres verificar que el DSN se está leyendo correctamente:

1. Abre la consola del navegador (F12)
2. Busca el log: `🔍 Sentry Config:`
3. Deberías ver algo como:
   ```javascript
   {
     hasDSN: true,
     dsnLength: 87,
     environment: "development",
     debugMode: true
   }
   ```

Si `hasDSN` es `false` o `dsnLength` es `0`, el DSN no se está leyendo correctamente.

---

## 📞 ¿NECESITAS AYUDA?

Si después de seguir estos pasos aún no funciona:

1. Verifica que el DSN esté correctamente copiado
2. Verifica que `.env.local` esté en la raíz del proyecto
3. Verifica que hayas reiniciado el servidor
4. Revisa la consola del navegador para ver los logs de Sentry
5. Verifica en Sentry que el proyecto esté activo y recibiendo datos

---

**Última actualización**: 2025





