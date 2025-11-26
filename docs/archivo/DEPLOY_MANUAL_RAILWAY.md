# 🚀 Deployment Manual en Railway

## Estado Actual

✅ Todos los cambios están en GitHub:
- railway.toml en `ahorro365-baileys-worker/`
- Dockerfile corregido con git y npm install
- 5 commits recientes pusheados

## Cómo Hacer Deployment Manual

### Opción 1: Desde Railway Dashboard

1. **Ve a Railway Dashboard** → Tu proyecto
2. **Ve a Settings** → Source
3. **Busca el botón "Manual Deploy"** o "Redeploy"
4. **Click en "Deploy Latest Commit"**
5. Railway hará el build automáticamente

### Opción 2: Desde Railway CLI (si lo tienes instalado)

```bash
railway up
```

### Opción 3: Trigger manual desde GitHub

Puedes hacer un pequeño cambio y pushearlo:

```bash
git commit --allow-empty -m "Trigger Railway deploy"
git push origin main
```

## Configurar Auto-Deploy en Railway

Si Railway no está detectando automáticamente los cambios:

1. **Ve a Settings** → Source
2. **Verifica:**
   - Branch: `main` ✅
   - Root Directory: `ahorro365-baileys-worker` ✅
3. **Habilita:**
   - "Auto Deploy" si está deshabilitado
4. **Guarda cambios**

## Estructura de Archivos para Railway

Railway debería encontrar estos archivos:
```
ahorro365-baileys-worker/
├── railway.toml        ✅ (Dockerfile build config)
├── Dockerfile          ✅ (Multi-stage build)
├── package.json        ✅ (Dependencies)
├── tsconfig.json       ✅ (TypeScript config)
├── .dockerignore       ✅ (Exclude files)
├── .gitignore          ✅ (Git ignore)
└── src/                ✅ (Source code)
```

## Verificar que Funciona

Una vez que el deployment complete:

1. **Ve a Logs** en Railway Dashboard
2. **Busca:** "Baileys Worker running on"
3. **Verifica que no haya errores**
4. **Configura variables de entorno** (Settings → Variables)
5. **Escanear QR** desde la URL pública de Railway

## Variables de Entorno Necesarias

```env
WHATSAPP_NUMBER=59160360908
BACKEND_URL=https://tu-backend.vercel.app
BACKEND_API_KEY=tu-secret-key
ADMIN_DASHBOARD_URL=https://tu-admin.vercel.app
PORT=3004
NODE_ENV=production
LOG_LEVEL=info
```

---

**Última actualización:** 28 de octubre, 2025



