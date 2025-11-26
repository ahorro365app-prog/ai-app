# 📱 Configuración de WhatsApp con Fly.io

## 📋 Resumen

El worker de WhatsApp está desplegado en **Fly.io** usando Baileys para procesar mensajes de audio y texto de usuarios.

- **App Name:** `ahorro365-baileys-worker`
- **URL:** `https://ahorro365-baileys-worker.fly.dev`
- **Región:** `dfw` (Dallas, Texas)
- **Estado:** ⏸️ **DETENIDO** (verificado el 2025-01-XX)
- **Motivo:** Cooldown temporal de WhatsApp por muchos reintentos/escaneos seguidos

---

## 🔧 Configuración en `fly.toml`

```toml
app = "ahorro365-baileys-worker"
primary_region = "dfw"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3003"
  BAILEYS_SESSION_PATH = "/app/auth_info"

[http_service]
  internal_port = 3003
  force_https = true
  auto_stop_machines = "off"
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[mounts]]
  source = "auth_info"
  destination = "/app/auth_info"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Explicación de la Configuración

- **`auto_stop_machines: "off"`**: El worker siempre está corriendo (no se detiene automáticamente)
- **`min_machines_running: 1`**: Mínimo 1 máquina siempre activa
- **`[[mounts]]`**: Volumen persistente para guardar la sesión de WhatsApp (`auth_info`)
- **`memory_mb: 256`**: 256 MB de RAM (suficiente para el worker)

---

## 🔐 Variables de Entorno Requeridas

Estas variables deben configurarse como **secrets** en Fly.io:

```bash
# Configurar secrets en Fly.io
flyctl secrets set WHATSAPP_NUMBER=59160360908 -a ahorro365-baileys-worker
flyctl secrets set BACKEND_URL=https://tu-backend.vercel.app -a ahorro365-baileys-worker
flyctl secrets set BACKEND_API_KEY=tu-secret-key -a ahorro365-baileys-worker

# Opcional: Configurar delay de mensajes (anti-spam)
# Default: 2000ms (2 segundos). Aumentar si WhatsApp detecta spam.
flyctl secrets set MESSAGE_DELAY_MS=2000 -a ahorro365-baileys-worker
```

### Variables de Entorno

| Variable | Descripción | Ejemplo | Requerida | Default |
|----------|-------------|---------|-----------|---------|
| `WHATSAPP_NUMBER` | Número de WhatsApp Business (sin +) | `59160360908` | ✅ Sí | - |
| `BACKEND_URL` | URL del backend (Vercel) | `https://ahorro365.vercel.app` | ✅ Sí | - |
| `BACKEND_API_KEY` | API key para autenticación con backend | `secret-key-123` | ✅ Sí | - |
| `MESSAGE_DELAY_MS` | Delay en milisegundos antes de enviar mensajes (anti-spam) | `2000` | ⚙️ Opcional | `2000` |
| `BAILEYS_SESSION_PATH` | Ruta donde se guarda la sesión | `/app/auth_info` | ⚙️ Auto (fly.toml) | `/app/auth_info` |
| `PORT` | Puerto interno del servidor | `3003` | ⚙️ Auto (fly.toml) | `3003` |
| `NODE_ENV` | Entorno de ejecución | `production` | ⚙️ Opcional | - |
| `FORCE_NEW_SESSION` | Forzar nueva sesión (eliminar credenciales) | `true` | ⚠️ Solo para debugging | - |

---

## 📡 Endpoints Disponibles

### 1. **GET `/health`** - Health Check
```bash
curl https://ahorro365-baileys-worker.fly.dev/health
```
**Respuesta:**
```json
{
  "status": "ok",
  "service": "baileys-worker",
  "timestamp": "2025-01-XX..."
}
```

### 2. **GET `/status`** - Estado de Conexión
```bash
curl https://ahorro365-baileys-worker.fly.dev/status
```
**Respuesta:**
```json
{
  "connected": true,
  "lastSync": "2025-01-XX...",
  "uptime": 99.8
}
```

### 3. **GET `/qr`** - Obtener QR Code
```bash
curl https://ahorro365-baileys-worker.fly.dev/qr
```
**Respuesta:**
```json
{
  "success": true,
  "qr": "data:image/png;base64,iVBORw0KG...",
  "timestamp": 1234567890,
  "connected": false
}
```

### 4. **GET `/qr/view`** - Visor HTML del QR
Abre en el navegador:
```
https://ahorro365-baileys-worker.fly.dev/qr/view
```
- Auto-refresco cada 2.5 segundos
- Muestra estado de conexión

### 5. **GET `/clean-session`** - Limpiar Sesión (Debug)
```bash
curl https://ahorro365-baileys-worker.fly.dev/clean-session
```
⚠️ **Solo para debugging**: Elimina archivos JSON de autenticación

### 6. **POST `/disconnect`** - Desconectar WhatsApp
```bash
curl -X POST https://ahorro365-baileys-worker.fly.dev/disconnect
```
⚠️ **Cuidado**: Desconecta WhatsApp y elimina la sesión

---

## 💾 Volúmenes y Persistencia

### Volumen `auth_info`

El worker usa un **volumen persistente** para guardar la sesión de WhatsApp:

- **Nombre del volumen:** `auth_info`
- **Ruta en el contenedor:** `/app/auth_info`
- **Contenido:** Archivos JSON de autenticación de Baileys

### Verificar Volumen

```bash
# Listar volúmenes
flyctl volumes list -a ahorro365-baileys-worker

# Ver contenido del volumen (SSH)
flyctl ssh console -a ahorro365-baileys-worker -C "ls -la /app/auth_info"
```

---

## 🛠️ Script de Gestión

### Script PowerShell: `verificar-estado.ps1`

Script ubicado en `ahorro365-baileys-worker/verificar-estado.ps1` para gestionar el worker:

```powershell
# Ver estado actual
.\verificar-estado.ps1 status

# Detener worker
.\verificar-estado.ps1 stop

# Iniciar worker
.\verificar-estado.ps1 start

# Reiniciar worker
.\verificar-estado.ps1 restart

# Ver logs en tiempo real
.\verificar-estado.ps1 logs
```

El script verifica:
1. ✅ Endpoint `/health` del worker
2. ✅ Endpoint `/status` de WhatsApp
3. ✅ Estado de máquinas en Fly.io

---

## 🛠️ Comandos Útiles de Fly.io

### Ver Logs
```bash
# Logs en tiempo real
flyctl logs -a ahorro365-baileys-worker

# Últimas 100 líneas
flyctl logs -a ahorro365-baileys-worker --no-tail
```

### Reiniciar Worker
```bash
# Listar máquinas
flyctl machines list -a ahorro365-baileys-worker

# Reiniciar máquina específica
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

### SSH al Worker
```bash
# Abrir consola SSH
flyctl ssh console -a ahorro365-baileys-worker

# Ejecutar comando específico
flyctl ssh console -a ahorro365-baileys-worker -C "ls -la /app/auth_info"
```

### Gestionar Secrets
```bash
# Ver secrets (solo nombres, no valores)
flyctl secrets list -a ahorro365-baileys-worker

# Agregar secret
flyctl secrets set VARIABLE=valor -a ahorro365-baileys-worker

# Eliminar secret
flyctl secrets unset VARIABLE -a ahorro365-baileys-worker
```

### Estado de la App
```bash
# Ver estado general
flyctl status -a ahorro365-baileys-worker

# Ver máquinas
flyctl machines list -a ahorro365-baileys-worker
```

---

## 🔄 Flujo de Mensajes

```
1. Usuario envía audio/texto por WhatsApp
   ↓
2. Baileys Worker recibe el mensaje
   ↓
3. Worker envía al Backend (POST /api/webhooks/baileys)
   ↓
4. Backend procesa con Groq (Whisper + LLM)
   ↓
5. Backend retorna datos extraídos
   ↓
6. Worker envía preview al usuario
   ↓
7. Usuario confirma (Sí/OK)
   ↓
8. Worker envía confirmación al Backend (POST /api/webhooks/whatsapp/confirm)
   ↓
9. Backend guarda transacción en Supabase
   ↓
10. Worker confirma al usuario
```

---

## 🐛 Troubleshooting

### Problema: QR no se genera

**Síntomas:**
- `/qr` retorna `qr: null` por más de 60 segundos
- Logs muestran errores de conexión

**Soluciones:**

1. **Reiniciar el worker:**
```bash
flyctl machines list -a ahorro365-baileys-worker
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

2. **Limpiar sesión (si hay problemas de autenticación):**
```bash
# Activar FORCE_NEW_SESSION
flyctl secrets set FORCE_NEW_SESSION=true -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker

# Desactivar después (para evitar bucles)
flyctl secrets unset FORCE_NEW_SESSION -a ahorro365-baileys-worker
```

3. **Limpiar manualmente archivos JSON:**
```bash
flyctl ssh console -a ahorro365-baileys-worker -C \
  "sh -lc 'rm -f /app/auth_info/*.json; ls -l /app/auth_info'"

flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

### Problema: Error EBUSY (archivo bloqueado)

**Causa:** `FORCE_NEW_SESSION=true` activo mientras el worker está corriendo

**Solución:**
```bash
# Desactivar FORCE_NEW_SESSION
flyctl secrets unset FORCE_NEW_SESSION -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

### Problema: Worker no se conecta al Backend

**Verificar:**
1. `BACKEND_URL` está configurado correctamente
2. `BACKEND_API_KEY` es válido
3. Backend está accesible desde Fly.io

**Debug:**
```bash
# Ver logs
flyctl logs -a ahorro365-baileys-worker --no-tail

# Verificar variables
flyctl secrets list -a ahorro365-baileys-worker
```

### Problema: Mensajes no se procesan

**Verificar:**
1. Worker está conectado a WhatsApp (`/status` muestra `connected: true`)
2. Backend está respondiendo correctamente
3. No hay errores en logs

**Debug:**
```bash
# Ver logs en tiempo real
flyctl logs -a ahorro365-baileys-worker
```

---

## 📊 Monitoreo

### Health Check Automático

El Dockerfile incluye un healthcheck que verifica `/health` cada 30 segundos:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Verificar Estado

```bash
# Estado general
flyctl status -a ahorro365-baileys-worker

# Health check manual
curl https://ahorro365-baileys-worker.fly.dev/health

# Estado de conexión
curl https://ahorro365-baileys-worker.fly.dev/status
```

---

## 🔐 Seguridad

### Variables Sensibles

- ✅ `BACKEND_API_KEY`: Secreto, solo en Fly.io secrets
- ✅ `WHATSAPP_NUMBER`: Información sensible
- ✅ Sesión de WhatsApp: Guardada en volumen persistente (no en Git)

### Buenas Prácticas

1. **Nunca** commitear archivos `auth_info/` a Git
2. **Siempre** usar secrets de Fly.io para variables sensibles
3. **Rotar** `BACKEND_API_KEY` periódicamente
4. **Monitorear** logs para detectar accesos no autorizados

---

## 📚 Referencias

- [**Guía Completa de Setup**](./SETUP_WHATSAPP_FLYIO_COMPLETO.md) - ⭐ **Cómo configurar desde cero**
- [Fly.io Documentation](https://fly.io/docs)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Documentación de Recuperación de QR](./archivo/WHATSAPP_QR_RECOVERY.md)
- [Estado Actual de Funcionalidades](./FUNCIONALIDADES_ESPECIFICAS_ESTADO_ACTUAL.md)

---

## ⚠️ Estado Actual (2025-01-XX)

### Worker Detenido

**Verificación realizada:**
- ❌ Endpoint `/health` no responde
- ❌ Endpoint `/status` no responde
- ❌ No hay máquinas disponibles: `No machines are available on this app`

**Motivo:**
- Cooldown temporal de WhatsApp por muchos reintentos/escaneos seguidos
- Worker detenido manualmente para evitar más bloqueos

**Para reactivar:**
1. Verificar que el cooldown de WhatsApp haya pasado (24-48 horas)
2. Iniciar worker: `.\verificar-estado.ps1 start`
3. Verificar conexión: `.\verificar-estado.ps1 status`

---

## ✅ Checklist de Configuración

- [x] App creada en Fly.io: `ahorro365-baileys-worker`
- [x] Volumen `auth_info` creado y montado
- [x] Secrets configurados:
  - [x] `WHATSAPP_NUMBER`
  - [x] `BACKEND_URL`
  - [x] `BACKEND_API_KEY`
- [ ] Worker desplegado y corriendo ⏸️ **DETENIDO**
- [ ] Health check responde correctamente ⏸️ **NO RESPONDE**
- [ ] QR generado y escaneado ⏸️ **PENDIENTE**
- [ ] Conexión a WhatsApp establecida ⏸️ **PENDIENTE**
- [ ] Mensajes de prueba funcionando ⏸️ **PENDIENTE**

---

**Última actualización:** 2025-01-XX  
**Estado:** ⏸️ Worker detenido - Esperando cooldown de WhatsApp

