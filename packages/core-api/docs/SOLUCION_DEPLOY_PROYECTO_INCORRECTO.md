# 🔧 Solución: Deploy se Hace a `ahorro365-core` en Lugar de `ahorro365-core-api`

**Problema**: Ambos proyectos existen en Vercel y el deploy automático va al proyecto incorrecto.

---

## 🚨 Problema Identificado

- ✅ `ahorro365-core-api` existe (CORRECTO)
- ⚠️ `ahorro365-core` existe (ANTIGUO)
- ❌ Los deploys automáticos van a `ahorro365-core` (INCORRECTO)

---

## ✅ Solución: Configurar Root Directory Correctamente

### Paso 1: Verificar y Corregir `ahorro365-core-api`

1. **Ve a Vercel Dashboard**
2. **Click en `ahorro365-core-api`**
3. **Settings > General**
4. **Verifica/Configura:**
   - **Root Directory**: `packages/core-api` ✅ (DEBE ser esto)
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. **Guarda cambios**

### Paso 2: Cambiar Root Directory de `ahorro365-core` (Para Evitar Conflictos)

1. **Ve a `ahorro365-core`** (el proyecto antiguo)
2. **Settings > General**
3. **Cambia Root Directory:**
   - **Opción A (Recomendada)**: Cambiar a `src` o `.` (raíz del repo)
     - Esto hará que NO coincida con `packages/core-api`
     - El proyecto seguirá existiendo pero no interferirá
   
   - **Opción B**: Desactivar auto-deploy
     - Settings > Git
     - Desconectar el repositorio temporalmente
     - O desactivar "Automatic deployments"

### Paso 3: Verificar Configuración de Git

**En `ahorro365-core-api`:**
1. **Settings > Git**
2. Verifica:
   - **Repository**: `ahorro365app-prog/ai-app`
   - **Production Branch**: `main`
   - **Automatic deployments**: ✅ Activado
   - **Root Directory**: `packages/core-api` ✅

**En `ahorro365-core`:**
1. **Settings > Git**
2. Verifica:
   - **Repository**: `ahorro365app-prog/ai-app` (mismo repo)
   - **Root Directory**: Debe ser DIFERENTE a `packages/core-api`
     - Si es `packages/core-api`, cámbialo a `.` o `src`

---

## 🔍 Cómo Vercel Decide Qué Proyecto Usar

Vercel despliega automáticamente cuando:
1. Hay un push a GitHub
2. El proyecto tiene "Automatic deployments" activado
3. El Root Directory del proyecto coincide con los archivos cambiados

**Problema**: Si ambos proyectos tienen el mismo Root Directory (`packages/core-api`), Vercel puede desplegar en cualquiera de los dos (o ambos).

**Solución**: Asegurarse de que solo `ahorro365-core-api` tenga Root Directory = `packages/core-api`.

---

## ✅ Pasos Inmediatos

### Opción 1: Cambiar Root Directory de `ahorro365-core` (Recomendada)

1. **Ve a `ahorro365-core`**
2. **Settings > General**
3. **Root Directory**: Cambiar a `.` (raíz del repo)
4. **Guardar**
5. **Hacer un nuevo deploy** en `ahorro365-core-api`:
   - Click en "Deploy"
   - Seleccionar branch `main`
   - Deploy

### Opción 2: Desactivar Auto-Deploy de `ahorro365-core`

1. **Ve a `ahorro365-core`**
2. **Settings > Git**
3. **Desactivar "Automatic deployments"**
4. Esto hará que solo `ahorro365-core-api` reciba deploys automáticos

### Opción 3: Eliminar `ahorro365-core` (Solo si estás seguro)

⚠️ **Solo hacer esto si:**
- ✅ `ahorro365-core-api` está funcionando correctamente
- ✅ Ya probaste todas las APIs
- ✅ No necesitas el proyecto antiguo como backup

1. **Ve a `ahorro365-core`**
2. **Settings > General**
3. **Scroll hasta "Danger Zone"**
4. **Delete Project**
5. Confirma

---

## 🧪 Verificación

Después de hacer los cambios:

1. **Hacer un push de prueba:**
   ```bash
   git commit --allow-empty -m "test: Verificar deploy a proyecto correcto"
   git push
   ```

2. **Verificar en Vercel:**
   - Debe aparecer un nuevo deployment en `ahorro365-core-api`
   - NO debe aparecer en `ahorro365-core` (o debe fallar si cambiaste el Root Directory)

3. **Verificar URL:**
   ```bash
   curl https://ahorro365-core-api.vercel.app/api/ping
   ```

---

## 📝 Notas

1. **Root Directory es clave**: Vercel usa el Root Directory para decidir qué proyecto desplegar.

2. **Ambos proyectos pueden existir**: No es necesario eliminar `ahorro365-core` inmediatamente, solo asegurarse de que no interfiera.

3. **Verificar después de cambios**: Siempre verifica que el deploy va al proyecto correcto después de cambiar la configuración.

---

**Última actualización**: 2025-01-20

