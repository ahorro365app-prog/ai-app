# 🔍 Verificar Proyecto Correcto en Vercel

**Fecha**: 2025-01-20  
**Problema**: Confusión entre `ahorro365-core` (antiguo) y `ahorro365-core-api` (correcto)

---

## ✅ Proyecto CORRECTO

**Nombre del Proyecto**: `ahorro365-core-api`  
**URL**: `https://ahorro365-core-api.vercel.app`  
**Root Directory**: `packages/core-api`

---

## ❌ Proyecto INCORRECTO (Antiguo)

**Nombre del Proyecto**: `ahorro365-core`  
**URL**: `https://ahorro365-core.vercel.app`  
**Estado**: Debería eliminarse eventualmente (pero NO ahora)

---

## 🔍 Cómo Verificar en Vercel

### Paso 1: Ver Lista de Proyectos

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Revisa la lista de proyectos
3. Busca:
   - ✅ `ahorro365-core-api` (CORRECTO - debe existir)
   - ⚠️ `ahorro365-core` (ANTIGUO - puede existir)

### Paso 2: Verificar Configuración del Proyecto Correcto

1. **Click en `ahorro365-core-api`**
2. Ve a **Settings > General**
3. Verifica:
   - **Project Name**: `ahorro365-core-api` ✅
   - **Root Directory**: `packages/core-api` ✅
   - **Framework**: Next.js ✅

### Paso 3: Verificar el Último Deploy

1. En `ahorro365-core-api`, ve a **Deployments**
2. Verifica el último deployment:
   - ¿Cuándo fue el último deploy?
   - ¿Está en estado "Ready" (verde)?
   - ¿Tiene los cambios más recientes?

---

## 🚨 Si el Último Deploy Fue a `ahorro365-core` (Incorrecto)

### Opción 1: Verificar si `ahorro365-core-api` Existe

1. **Si `ahorro365-core-api` NO existe:**
   - Crear nuevo proyecto con nombre `ahorro365-core-api`
   - Root Directory: `packages/core-api`
   - Configurar variables de entorno
   - Deploy

2. **Si `ahorro365-core-api` SÍ existe pero está desactualizado:**
   - Ir a `ahorro365-core-api` en Vercel
   - Click en "Deploy" o "Redeploy"
   - Seleccionar branch `main`
   - Deploy

### Opción 2: Verificar Configuración de Git

1. En Vercel Dashboard, ve a cada proyecto
2. **Settings > Git**
3. Verifica:
   - **Repository**: `ahorro365app-prog/ai-app`
   - **Production Branch**: `main`
   - **Root Directory**: 
     - ✅ `ahorro365-core-api` debe tener: `packages/core-api`
     - ⚠️ `ahorro365-core` probablemente tiene: `.` (raíz) o `src`

---

## ✅ Qué Hacer Ahora

### Si `ahorro365-core-api` Existe:

1. **Verificar que está actualizado:**
   - Ve a `ahorro365-core-api` > Deployments
   - Verifica que el último commit es el más reciente
   - Si no, hacer "Redeploy"

2. **Verificar variables de entorno:**
   - Settings > Environment Variables
   - Asegúrate de que todas las variables estén configuradas

3. **Probar el endpoint:**
   ```bash
   curl https://ahorro365-core-api.vercel.app/api/ping
   ```

### Si `ahorro365-core-api` NO Existe:

1. **Crear nuevo proyecto:**
   - Add New Project
   - Repository: `ahorro365app-prog/ai-app`
   - **Project Name**: `ahorro365-core-api` (IMPORTANTE)
   - **Root Directory**: `packages/core-api`
   - Deploy

2. **Configurar variables de entorno:**
   - Copiar desde `ahorro365-core` si existe
   - O configurar manualmente según `docs/DEPLOY_VERCEL.md`

---

## 📝 Notas Importantes

1. **NO eliminar `ahorro365-core` todavía:**
   - Puede ser útil como backup
   - Solo eliminar después de verificar que `ahorro365-core-api` funciona 100%

2. **El código apunta a `ahorro365-core-api`:**
   - `src/lib/apiConfig.ts` → `ahorro365-core-api.vercel.app`
   - `capacitor.config.ts` → `ahorro365-core-api.vercel.app`
   - Por lo tanto, el proyecto correcto es `ahorro365-core-api`

3. **Si ambos proyectos existen:**
   - `ahorro365-core-api` es el que se debe usar
   - `ahorro365-core` es el antiguo (puede quedar como backup)

---

## 🔗 Referencias

- Guía completa de deploy: `docs/DEPLOY_VERCEL.md`
- Checklist de deploy: `docs/CHECKLIST_VERCEL.md`

---

**Última actualización**: 2025-01-20

