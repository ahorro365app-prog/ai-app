# 🚀 Deploy del Baileys Worker en Railway

## ✅ Preparación Completada

Todos los archivos necesarios para el deployment en Railway están listos:

- ✅ Dockerfile (multi-stage build optimizado)
- ✅ .dockerignore (exclusión de archivos innecesarios)
- ✅ package.json (estructura para Railway)
- ✅ railway.json (configuración de Railway)
- ✅ .gitignore (archivos a no commitear)
- ✅ .env.example (template de variables)
- ✅ README.md (documentación completa)

---

## 📝 Próximos Pasos

### 1. Commitear Cambios

```bash
cd ahorro365-baileys-worker

# Ver cambios
git status

# Agregar archivos
git add Dockerfile .dockerignore package.json railway.json .gitignore .env.example README.md

# Commit
git commit -m "Prepare Baileys Worker for Railway deployment"

# Push a GitHub
git push origin main
```

### 2. Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Click en **"+ New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Elige el repositorio: `ai-app`
6. Railway detectará automáticamente el `Dockerfile`

### 3. Configurar Variables de Entorno

En Railway Dashboard → Variables:

```env
WHATSAPP_NUMBER=59160360908
BACKEND_URL=https://tu-backend.vercel.app
BACKEND_API_KEY=tu-secret-key-prod
ADMIN_DASHBOARD_URL=https://tu-admin.vercel.app
PORT=3004
NODE_ENV=production
LOG_LEVEL=info
```

### 4. Configurar Servicio

1. Ve a **Settings** → **Service**
2. Configura:
   - **Working Directory**: `ahorro365-baileys-worker`
   - **Root Directory**: `ahorro365-baileys-worker`
3. Guarda cambios

### 5. Configurar Dominio (Opcional)

En Railway Dashboard → **Settings** → **Networking**:
- Genera un dominio público
- Ejemplo: `baileys-worker-xxxxx.railway.app`

### 6. Verificar Deployment

Verifica que el worker esté corriendo:

```bash
curl https://baileys-worker-xxxxx.railway.app/health
```

Debería retornar:
```json
{
  "status": "ok",
  "service": "baileys-worker",
  "timestamp": "2025-10-28T..."
}
```

### 7. Escanear QR

1. Ve a: `https://baileys-worker-xxxxx.railway.app/qr`
2. Abre WhatsApp Business en tu teléfono
3. Ve a Configuración → Dispositivos vinculados
4. Click en "Vincular dispositivo"
5. Escanea el QR

---

## 🔧 Troubleshooting

### El QR no se muestra
- Verifica los logs en Railway (Dashboard → Service → Logs)
- Verifica que todas las variables de entorno estén configuradas
- Elimina `auth_info` folder si existe

### Error: "Connection refused"
- Verifica que el puerto esté configurado (PORT=3004)
- Verifica que el servicio esté corriendo en Railway

### Error: "Module not found"
- Verifica que el `Dockerfile` esté en el directorio correcto
- Verifica que `workingDirectory` esté configurado en Railway

### El worker se desconecta frecuentemente
- Verifica que Railway tenga suficiente recursos asignados
- Considera aumentar el plan de Railway si es necesario
- Revisa los logs para ver errores de memoria

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

Railway Dashboard → Service → **Logs**

### Verificar Estado

```bash
# Health check
curl https://tu-worker.railway.app/health

# Status
curl https://tu-worker.railway.app/status

# QR
curl https://tu-worker.railway.app/qr
```

---

## 🔒 Seguridad

### Variables Sensibles

⚠️ **NUNCA** commitees:
- `.env`
- `auth_info/`
- Credenciales de WhatsApp
- API keys

Estos archivos están en `.gitignore`.

### Rotar Credenciales

Si sospechas que tus credenciales están comprometidas:
1. Genera nuevas API keys en tu backend
2. Actualiza las variables en Railway
3. Reinicia el servicio

---

## 🎉 ¡Listo!

Tu Baileys Worker está ahora corriendo 24/7 en Railway.

### Beneficios
- ✅ Siempre disponible
- ✅ Reconexión automática
- ✅ Escalable
- ✅ Monitoreo integrado
- ✅ Logs en tiempo real

---

**Última actualización:** 28 de octubre, 2025



