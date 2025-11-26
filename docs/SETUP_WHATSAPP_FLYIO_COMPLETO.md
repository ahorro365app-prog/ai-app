# 🚀 Guía Completa: Setup de WhatsApp Web en Fly.io

Esta guía documenta **paso a paso** cómo se configuró WhatsApp Web (Baileys Worker) en Fly.io desde cero.

---

## 📋 Índice

1. [Prerrequisitos](#prerrequisitos)
2. [Instalación de flyctl](#instalación-de-flyctl)
3. [Crear la App en Fly.io](#crear-la-app-en-flyio)
4. [Configurar Volumen Persistente](#configurar-volumen-persistente)
5. [Configurar Secrets (Variables de Entorno)](#configurar-secrets)
6. [Deploy Inicial](#deploy-inicial)
7. [Configurar Sesión de WhatsApp](#configurar-sesión-de-whatsapp)
8. [Verificar Funcionamiento](#verificar-funcionamiento)
9. [Comandos Útiles](#comandos-útiles)

---

## 🔧 Prerrequisitos

### 1. Cuenta en Fly.io
- Crear cuenta en [fly.io](https://fly.io)
- Verificar email

### 2. Código del Worker
- El código debe estar en el directorio `ahorro365-baileys-worker/`
- Debe tener `Dockerfile` y `fly.toml` configurados

### 3. Archivos Necesarios
- ✅ `ahorro365-baileys-worker/Dockerfile`
- ✅ `ahorro365-baileys-worker/fly.toml`
- ✅ `ahorro365-baileys-worker/package.json`
- ✅ Código fuente en `ahorro365-baileys-worker/src/`

---

## 📥 Instalación de flyctl

### Windows (PowerShell)

```powershell
# Instalar flyctl
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Agregar al PATH (si no se agregó automáticamente)
$env:Path += ";$env:USERPROFILE\.fly\bin"
```

### Linux/Mac

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Agregar al PATH
export PATH="$HOME/.fly/bin:$PATH"
```

### Verificar Instalación

```bash
flyctl version
# Debe mostrar la versión instalada
```

### Autenticar en Fly.io

```bash
flyctl auth login
```

Se abrirá el navegador para iniciar sesión. Después de autenticar, vuelve a la terminal.

---

## 🆕 Crear la App en Fly.io

### Opción 1: Desde el Directorio del Worker

```bash
# Navegar al directorio del worker
cd ahorro365-baileys-worker

# Crear la app (si fly.toml ya existe, detectará la configuración)
flyctl launch

# O crear manualmente con nombre específico
flyctl apps create ahorro365-baileys-worker
```

### Opción 2: Crear App Manualmente

```bash
# Crear app con nombre específico
flyctl apps create ahorro365-baileys-worker

# Seleccionar región (recomendado: dfw - Dallas)
# Se creará la app vacía
```

### Verificar App Creada

```bash
flyctl apps list
# Debe mostrar: ahorro365-baileys-worker
```

---

## 💾 Configurar Volumen Persistente

El volumen persistente es **CRÍTICO** para guardar la sesión de WhatsApp. Sin él, la sesión se perdería cada vez que se reinicia el worker.

### Crear Volumen

```bash
# Crear volumen de 1GB en la región dfw
flyctl volumes create auth_info \
  --app ahorro365-baileys-worker \
  --region dfw \
  --size 1
```

**Nota:** El nombre `auth_info` debe coincidir con el nombre en `fly.toml`:

```toml
[[mounts]]
  source = "auth_info"        # ← Nombre del volumen
  destination = "/app/auth_info"  # ← Ruta en el contenedor
```

### Verificar Volumen Creado

```bash
flyctl volumes list -a ahorro365-baileys-worker
```

**Salida esperada:**
```
ID                  Name      Size     Region  Created At
vol_xxxxxxxxxxxxx   auth_info 1GB      dfw     2025-XX-XX...
```

---

## 🔐 Configurar Secrets (Variables de Entorno)

Los secrets en Fly.io son variables de entorno seguras que no se exponen en logs.

### Secrets Requeridos

```bash
# 1. Número de WhatsApp (sin +)
flyctl secrets set WHATSAPP_NUMBER=59160360908 \
  -a ahorro365-baileys-worker

# 2. URL del Backend (Vercel)
flyctl secrets set BACKEND_URL=https://tu-backend.vercel.app \
  -a ahorro365-baileys-worker

# 3. API Key del Backend
flyctl secrets set BACKEND_API_KEY=tu-secret-key-aqui \
  -a ahorro365-baileys-worker
```

### Secrets Opcionales

```bash
# Forzar nueva sesión (solo para debugging)
flyctl secrets set FORCE_NEW_SESSION=true \
  -a ahorro365-baileys-worker

# Nivel de logs
flyctl secrets set LOG_LEVEL=info \
  -a ahorro365-baileys-worker
```

### Verificar Secrets Configurados

```bash
# Listar secrets (solo nombres, no valores)
flyctl secrets list -a ahorro365-baileys-worker
```

**Salida esperada:**
```
Secrets for ahorro365-baileys-worker:
  BACKEND_API_KEY
  BACKEND_URL
  WHATSAPP_NUMBER
```

---

## 🚀 Deploy Inicial

### Verificar fly.toml

Asegúrate de que `fly.toml` tenga esta configuración:

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
  auto_stop_machines = "off"      # ← Siempre activo
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

### Hacer Deploy

```bash
# Desde el directorio del worker
cd ahorro365-baileys-worker

# Deploy
flyctl deploy
```

**Proceso:**
1. Fly.io construye la imagen Docker
2. Crea una máquina virtual
3. Monta el volumen `auth_info`
4. Inicia el worker

### Verificar Deploy

```bash
# Ver estado de la app
flyctl status -a ahorro365-baileys-worker

# Ver máquinas
flyctl machines list -a ahorro365-baileys-worker
```

**Salida esperada:**
```
App
  Name     = ahorro365-baileys-worker
  Owner    = personal
  Hostname = ahorro365-baileys-worker.fly.dev
  Region   = dfw

Machines
PROCESS ID              STATE   ROLE    REGION  CREATED
app     3287e393be3e85  started          dfw     2025-XX-XX...
```

---

## 📱 Configurar Sesión de WhatsApp

### Opción 1: Generar QR en Fly.io (Primera Vez)

1. **Acceder al visor de QR:**
   ```
   https://ahorro365-baileys-worker.fly.dev/qr/view
   ```

2. **Obtener QR vía API:**
   ```bash
   curl https://ahorro365-baileys-worker.fly.dev/qr
   ```

3. **Escanear QR:**
   - Abre WhatsApp Business
   - Configuración → Dispositivos vinculados
   - Vincular dispositivo
   - Escanea el QR

4. **Verificar conexión:**
   ```bash
   curl https://ahorro365-baileys-worker.fly.dev/status
   ```

### Opción 2: Copiar Sesión Local a Fly.io

Si ya tienes una sesión funcionando localmente:

#### Paso 1: Comprimir Sesión Local

```bash
# Desde el directorio del worker local
cd ahorro365-baileys-worker

# Comprimir auth_info
tar -czf authinfo.tgz auth_info/
```

#### Paso 2: Subir a Fly.io vía SFTP

```bash
# Conectar por SFTP
flyctl sftp shell -a ahorro365-baileys-worker

# Dentro de SFTP:
cd /app
put authinfo.tgz /app/authinfo.tgz
exit
```

#### Paso 3: Descomprimir en Fly.io

```bash
# Conectar por SSH
flyctl ssh console -a ahorro365-baileys-worker

# Dentro de SSH:
cd /app
mkdir -p new_auth
tar -xzf authinfo.tgz -C new_auth
cp -f new_auth/auth_info/*.json /app/auth_info/
rm -rf new_auth authinfo.tgz
ls -l /app/auth_info
exit
```

#### Paso 4: Reiniciar Worker

```bash
# Obtener Machine ID
flyctl machines list -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

---

## ✅ Verificar Funcionamiento

### 1. Health Check

```bash
curl https://ahorro365-baileys-worker.fly.dev/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "service": "baileys-worker",
  "timestamp": "2025-XX-XX..."
}
```

### 2. Estado de WhatsApp

```bash
curl https://ahorro365-baileys-worker.fly.dev/status
```

**Respuesta esperada (conectado):**
```json
{
  "connected": true,
  "lastSync": "2025-XX-XX...",
  "uptime": 99.8
}
```

### 3. Ver Logs

```bash
# Logs en tiempo real
flyctl logs -a ahorro365-baileys-worker

# Últimas 100 líneas
flyctl logs -a ahorro365-baileys-worker --no-tail
```

**Buscar en logs:**
- ✅ `✅ Conectado a WhatsApp!`
- ✅ `QR guardado exitosamente`
- ❌ `❌ Error connecting to WhatsApp`

### 4. Probar Envío de Mensaje

Envía un mensaje de prueba desde WhatsApp al número configurado y verifica en los logs que se reciba.

---

## 🛠️ Comandos Útiles

### Gestión de Máquinas

```bash
# Listar máquinas
flyctl machines list -a ahorro365-baileys-worker

# Reiniciar máquina
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker

# Detener máquina
flyctl machines stop <MACHINE_ID> -a ahorro365-baileys-worker

# Iniciar máquina
flyctl machines start <MACHINE_ID> -a ahorro365-baileys-worker
```

### Gestión de Secrets

```bash
# Listar secrets
flyctl secrets list -a ahorro365-baileys-worker

# Agregar secret
flyctl secrets set VARIABLE=valor -a ahorro365-baileys-worker

# Eliminar secret
flyctl secrets unset VARIABLE -a ahorro365-baileys-worker
```

### SSH y SFTP

```bash
# Conectar por SSH
flyctl ssh console -a ahorro365-baileys-worker

# Conectar por SFTP
flyctl sftp shell -a ahorro365-baileys-worker
```

### Volúmenes

```bash
# Listar volúmenes
flyctl volumes list -a ahorro365-baileys-worker

# Ver detalles del volumen
flyctl volumes show <VOLUME_ID> -a ahorro365-baileys-worker
```

### Logs y Monitoreo

```bash
# Logs en tiempo real
flyctl logs -a ahorro365-baileys-worker

# Últimas N líneas
flyctl logs -a ahorro365-baileys-worker --no-tail -n 100

# Estado de la app
flyctl status -a ahorro365-baileys-worker
```

---

## 📝 Resumen del Proceso Completo

### Checklist de Setup

- [ ] 1. Instalar `flyctl`
- [ ] 2. Autenticar en Fly.io (`flyctl auth login`)
- [ ] 3. Crear app (`flyctl apps create ahorro365-baileys-worker`)
- [ ] 4. Crear volumen persistente (`flyctl volumes create auth_info`)
- [ ] 5. Configurar secrets:
  - [ ] `WHATSAPP_NUMBER`
  - [ ] `BACKEND_URL`
  - [ ] `BACKEND_API_KEY`
- [ ] 6. Verificar `fly.toml` está correcto
- [ ] 7. Hacer deploy (`flyctl deploy`)
- [ ] 8. Verificar máquina creada (`flyctl machines list`)
- [ ] 9. Configurar sesión de WhatsApp (QR o copiar sesión)
- [ ] 10. Verificar funcionamiento:
  - [ ] Health check responde
  - [ ] Status muestra `connected: true`
  - [ ] Logs no muestran errores
  - [ ] Mensaje de prueba funciona

---

## 🐛 Troubleshooting Común

### Problema: "No machines are available"

**Causa:** La máquina fue detenida o eliminada.

**Solución:**
```bash
# Verificar estado
flyctl status -a ahorro365-baileys-worker

# Si la app existe pero no hay máquinas, hacer deploy
flyctl deploy
```

### Problema: Volumen no se monta

**Causa:** El volumen no existe o el nombre no coincide.

**Solución:**
```bash
# Verificar volúmenes
flyctl volumes list -a ahorro365-baileys-worker

# Si no existe, crearlo
flyctl volumes create auth_info --app ahorro365-baileys-worker --region dfw --size 1

# Reiniciar máquina
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

### Problema: QR no se genera

**Causa:** Sesión corrupta o problemas de conexión.

**Solución:**
```bash
# Limpiar sesión
flyctl ssh console -a ahorro365-baileys-worker -C \
  "sh -lc 'rm -f /app/auth_info/*.json; ls -l /app/auth_info'"

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker

# Verificar QR
curl https://ahorro365-baileys-worker.fly.dev/qr
```

### Problema: Worker no se conecta al Backend

**Causa:** `BACKEND_URL` o `BACKEND_API_KEY` incorrectos.

**Solución:**
```bash
# Verificar secrets
flyctl secrets list -a ahorro365-baileys-worker

# Actualizar si es necesario
flyctl secrets set BACKEND_URL=https://tu-backend.vercel.app -a ahorro365-baileys-worker
flyctl secrets set BACKEND_API_KEY=tu-key -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

---

## 📚 Referencias

- [Documentación de Fly.io](https://fly.io/docs)
- [Configuración Actual](./CONFIGURACION_WHATSAPP_FLYIO.md)
- [Recuperación de QR](./archivo/WHATSAPP_QR_RECOVERY.md)
- [Script de Verificación](../ahorro365-baileys-worker/verificar-estado.ps1)

---

## 🎯 Información de la Configuración Actual

- **App Name:** `ahorro365-baileys-worker`
- **URL:** `https://ahorro365-baileys-worker.fly.dev`
- **Región:** `dfw` (Dallas, Texas)
- **Volumen:** `auth_info` (1GB)
- **Machine ID:** `3287e393be3e85` (puede cambiar)
- **Estado:** ⏸️ Detenido (verificar con `flyctl machines list`)

---

**Última actualización:** 2025-01-XX  
**Versión:** 1.0

