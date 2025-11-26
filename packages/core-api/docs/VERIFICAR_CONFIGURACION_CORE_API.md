# 🔍 Verificar Configuración de `ahorro365-core-api`

**Problema**: No hay nuevos deploys en `ahorro365-core-api` después de desconectar `ahorro365-core`.

---

## ✅ Verificaciones Necesarias

### 1. Verificar Root Directory

1. **Ve a `ahorro365-core-api` en Vercel**
2. **Settings > General**
3. **Verifica Root Directory:**
   - Debe ser exactamente: `packages/core-api`
   - Sin espacios, sin barras al final
   - Si está vacío o es diferente, cámbialo a `packages/core-api`

### 2. Verificar Configuración de Git

1. **Settings > Git**
2. **Verifica:**
   - **Repository**: `ahorro365app-prog/ai-app` ✅
   - **Production Branch**: `main` ✅
   - **Automatic deployments**: Debe estar **Activado** ✅

### 3. Verificar que el Repositorio Esté Conectado

1. **Settings > Git**
2. **Debe mostrar:**
   - "Connected Git Repository"
   - Repository: `ahorro365app-prog/ai-app`
   - Si dice "Not connected", necesitas conectar el repositorio

---

## 🚀 Solución: Deploy Manual

Si la configuración está correcta pero no hay auto-deploy, haz un deploy manual:

1. **Ve a `ahorro365-core-api`**
2. **Click en "Deploy"** (botón grande arriba)
3. **O ve a "Deployments" tab**
4. **Click en los 3 puntos (`...`) del último deployment**
5. **Selecciona "Redeploy"**
6. **O crea un nuevo deploy:**
   - Click en "Deploy"
   - Selecciona branch `main`
   - Click en "Deploy"

---

## 🔧 Si el Repositorio No Está Conectado

1. **Settings > Git**
2. **Click en "Connect Git Repository"**
3. **Selecciona:**
   - Provider: GitHub
   - Repository: `ahorro365app-prog/ai-app`
   - Branch: `main`
4. **Configura:**
   - **Root Directory**: `packages/core-api`
   - **Framework**: Next.js
5. **Deploy**

---

## 🧪 Verificar Después

Después de verificar/configurar:

1. **Hacer un nuevo push:**
   ```bash
   git commit --allow-empty -m "test: Verificar auto-deploy en ahorro365-core-api"
   git push
   ```

2. **Verificar en Vercel:**
   - Debe aparecer un nuevo deployment en `ahorro365-core-api`
   - Estado: "Building" → "Ready"

---

**Última actualización**: 2025-01-20

