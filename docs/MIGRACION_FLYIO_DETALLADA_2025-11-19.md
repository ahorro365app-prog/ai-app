# 🔄 Migración Detallada: WhatsApp Worker a Nueva Cuenta Fly.io

**Fecha de Migración:** 19 de Noviembre, 2025  
**Motivo:** Aprovechar período de prueba gratuito adicional (7 días)  
**Cuenta Anterior:** ahorro365app@gmail.com  
**Cuenta Nueva:** just4funpuno@gmail.com

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Preparación (FASE 1)](#fase-1-preparación)
3. [Crear Nueva Cuenta (FASE 2)](#fase-2-crear-nueva-cuenta)
4. [Setup en Nueva Cuenta (FASE 3)](#fase-3-setup-en-nueva-cuenta)
5. [Problemas Encontrados](#problemas-encontrados)
6. [Estado Actual](#estado-actual)
7. [Próximos Pasos](#próximos-pasos)
8. [Checklist Completo](#checklist-completo)

---

## 📊 Resumen Ejecutivo

| Item | Detalle |
|------|---------|
| **Fecha Inicio** | 19 Nov 2025, ~18:30 UTC |
| **Cuenta Anterior** | ahorro365app@gmail.com |
| **Cuenta Nueva** | just4funpuno@gmail.com |
| **App Creada** | ahorro365-baileys-worker-v2 |
| **Volumen Creado** | auth_info (1GB, región dfw) |
| **Secrets Configurados** | 3 de 3 principales |
| **Estado Deploy** | ⏸️ Pendiente (incidente Fly.io) |
| **Tiempo Transcurrido** | ~30 minutos |

---

## 🔧 FASE 1: Preparación

### Hora: ~18:30 UTC

### Objetivo
Anotar todos los secrets de la cuenta antigua para migrarlos a la nueva cuenta.

### Pasos Ejecutados

#### 1.1 Verificar flyctl Instalado
```powershell
# Verificar instalación
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"
Test-Path $flyctlPath
# Resultado: ✅ Encontrado en C:\Users\Usuario\.fly\bin\flyctl.exe
# Versión: flyctl.exe v0.3.206
```

#### 1.2 Listar Secrets de Cuenta Antigua
```powershell
flyctl secrets list -a ahorro365-baileys-worker
```

**Secrets Encontrados:**
- `SUPABASE_URL` (digest: feefd2711b600345)
- `SUPABASE_KEY` (digest: aaa56f3051e0a99e)
- `BACKEND_URL` (digest: cea67d666b60860c)
- `ADMIN_DASHBOARD_URL` (digest: cea67d666b60860c)
- `WHATSAPP_NUMBER` (digest: 4ad9097e570b5179)

**⚠️ Nota:** Fly.io no muestra los valores por seguridad, solo los nombres y digests.

#### 1.3 Obtener Valores de Secrets

**Método 1: Desde Código**
- ✅ `WHATSAPP_NUMBER=59160360908` (encontrado en `VARIABLES_RAILWAY.txt`)
- ✅ `ADMIN_DASHBOARD_URL=https://admin-dashboard-eta-liard-77.vercel.app` (encontrado en `VARIABLES_RAILWAY.txt`)

**Método 2: Desde Vercel**
- ✅ `BACKEND_URL=https://ahorro365-core-api.vercel.app` (identificado desde proyectos Vercel)
  - Proyecto actual: `ahorro365-core-api`
  - Proyecto antiguo (no usado): `ahorro365-core`

**Método 3: Secrets Pendientes**
- ⚠️ `BACKEND_API_KEY` - No encontrado en lista de Fly.io, verificar si existe
- ⚠️ `SUPABASE_URL` - Pendiente (si el worker lo necesita)
- ⚠️ `SUPABASE_KEY` - Pendiente (si el worker lo necesita)

#### 1.4 Archivo de Referencia Creado
**Archivo:** `ahorro365-baileys-worker/secrets-migracion.txt`

**Contenido:**
```
WHATSAPP_NUMBER=59160360908
BACKEND_URL=https://ahorro365-core-api.vercel.app
ADMIN_DASHBOARD_URL=https://admin-dashboard-eta-liard-77.vercel.app
BACKEND_API_KEY= (pendiente)
SUPABASE_URL= (pendiente)
SUPABASE_KEY= (pendiente)
```

### ✅ FASE 1 Completada
- **Tiempo:** ~15 minutos
- **Resultado:** 3 de 6 secrets identificados (suficientes para continuar)

---

## 🆕 FASE 2: Crear Nueva Cuenta

### Hora: ~18:45 UTC

### Objetivo
Crear nueva cuenta en Fly.io y autenticar flyctl.

### Pasos Ejecutados

#### 2.1 Crear Nueva Cuenta en Fly.io
- **Acción:** Usuario creó cuenta manualmente en fly.io
- **Email:** just4funpuno@gmail.com
- **Período Gratuito:** 7 días (según usuario)

#### 2.2 Verificar Sesión Actual
```powershell
flyctl auth whoami
# Resultado: ahorro365app@gmail.com (cuenta antigua)
```

#### 2.3 Cerrar Sesión Anterior
```powershell
flyctl auth logout
# Resultado: ✅ Sesión cerrada
```

#### 2.4 Autenticar Nueva Cuenta
```powershell
flyctl auth login
# Se abrió navegador para autenticación
# Resultado: ✅ successfully logged in as just4funpuno@gmail.com
```

#### 2.5 Verificar Apps Existentes
```powershell
flyctl apps list
# Resultado: No hay apps (cuenta nueva)
```

### ✅ FASE 2 Completada
- **Tiempo:** ~5 minutos
- **Resultado:** Nueva cuenta autenticada correctamente

---

## 🚀 FASE 3: Setup en Nueva Cuenta

### Hora: ~18:50 UTC

### Objetivo
Crear app, volumen persistente, configurar secrets y hacer deploy.

### Pasos Ejecutados

#### 3.1 Actualizar fly.toml
**Archivo:** `ahorro365-baileys-worker/fly.toml`

**Cambio:**
```toml
# Antes:
app = "ahorro365-worker-20251119"

# Después:
app = "ahorro365-baileys-worker-v2"
```

**Razón:** Usar nombre consistente con la cuenta anterior.

#### 3.2 Crear App en Fly.io
```powershell
cd ahorro365-baileys-worker
flyctl apps create ahorro365-baileys-worker-v2 --org personal
```

**Resultado:**
```
New app created: ahorro365-baileys-worker-v2
```

**Verificación:**
```powershell
flyctl apps list
# Resultado:
# NAME                        OWNER    STATUS  LATEST DEPLOY
# ahorro365-baileys-worker-v2 personal pending
```

#### 3.3 Crear Volumen Persistente
```powershell
flyctl volumes create auth_info \
  --app ahorro365-baileys-worker-v2 \
  --region dfw \
  --size 1 \
  --yes
```

**Resultado:**
```
ID: vol_493o18jjg8k25x54
Name: auth_info
App: ahorro365-baileys-worker-v2
Region: dfw
Zone: 5eac
Size GB: 1
Encrypted: true
Created at: 19 Nov 25 19:04 UTC
Snapshot retention: 5
Scheduled snapshots: true
```

**⚠️ Advertencia Recibida:**
```
Warning! Every volume is pinned to a specific physical host. 
You should create two or more volumes per application to avoid downtime.
```

**Nota:** Para producción, considerar crear 2+ volúmenes para alta disponibilidad.

#### 3.4 Configurar Secrets

**Secret 1: WHATSAPP_NUMBER**
```powershell
flyctl secrets set WHATSAPP_NUMBER=59160360908 \
  -a ahorro365-baileys-worker-v2
```
**Resultado:** ✅ `Secrets are staged for the first deployment`

**Secret 2: BACKEND_URL**
```powershell
flyctl secrets set BACKEND_URL=https://ahorro365-core-api.vercel.app \
  -a ahorro365-baileys-worker-v2
```
**Resultado:** ✅ `Secrets are staged for the first deployment`

**Secret 3: ADMIN_DASHBOARD_URL**
```powershell
flyctl secrets set ADMIN_DASHBOARD_URL=https://admin-dashboard-eta-liard-77.vercel.app \
  -a ahorro365-baileys-worker-v2
```
**Resultado:** ✅ `Secrets are staged for the first deployment`

**Verificación:**
```powershell
flyctl secrets list -a ahorro365-baileys-worker-v2
```

**Resultado:**
```
NAME                DIGEST
WHATSAPP_NUMBER     4ad9097e570b5179
BACKEND_URL         dfaf25d74174f71e
ADMIN_DASHBOARD_URL cea67d666b60860c
```

#### 3.5 Deploy Inicial

**Comando:**
```powershell
cd ahorro365-baileys-worker
flyctl deploy --app ahorro365-baileys-worker-v2
```

**Proceso:**
1. ✅ Validación de `fly.toml` exitosa
2. ✅ Verificación de app config exitosa
3. ✅ Inicio de build de imagen
4. ⏸️ **INTERRUMPIDO** - Incidente en Fly.io

**Estado al Interrumpirse:**
```
==> Building image
Waiting for depot builder...
==> Building image with Depot
--> build:  (​)
#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 30B 0.1s
#1 transferring dockerfile: 1.09kB 0.4s done
#1 DONE 0.4s
#2 [internal] load metadata for docker.io/library/node:18-alpine
#2 DONE 0.4s
#3 [internal] load .dockerignore
#3 transferring context: 33B 0.1s
#3 transferring context: 253B 0.4s done
#3 DONE 0.4s
```

### ⏸️ FASE 3 Parcialmente Completada
- **Tiempo:** ~20 minutos
- **Completado:**
  - ✅ App creada
  - ✅ Volumen creado
  - ✅ Secrets configurados (3 de 3 principales)
- **Pendiente:**
  - ⏸️ Deploy (interrumpido por incidente)

---

## ⚠️ Problemas Encontrados

### Problema 1: Nombre de App Ya Tomado
**Hora:** ~18:50 UTC  
**Error:**
```
Error: failed to run mutation($input: CreateAppInput!) { 
  createApp(input: $input) { ... } 
}: Validation failed: Name has already been taken
```

**Causa:** El nombre `ahorro365-baileys-worker` ya estaba en uso (probablemente en cuenta antigua o globalmente).

**Solución:** Usar nombre alternativo `ahorro365-baileys-worker-v2`

**Comando:**
```powershell
flyctl apps create ahorro365-baileys-worker-v2 --org personal
```

### Problema 2: App No Encontrada Inicialmente
**Hora:** ~18:52 UTC  
**Error:**
```
Error: failed to list volumes: app not found
Error: Could not find App "ahorro365-baileys-worker-v2"
```

**Causa:** La app aparecía en la lista pero no estaba completamente inicializada.

**Solución:** La app se creó correctamente, solo necesitaba un deploy para inicializarse completamente.

### Problema 3: Volumen Requiere Confirmación
**Hora:** ~19:00 UTC  
**Error:**
```
Error: yes flag must be specified when not running interactively
```

**Causa:** Fly.io requiere confirmación explícita para crear volúmenes.

**Solución:** Agregar flag `--yes` al comando:
```powershell
flyctl volumes create auth_info --app ahorro365-baileys-worker-v2 --region dfw --size 1 --yes
```

### Problema 4: Incidente en Fly.io
**Hora:** ~19:05 UTC  
**Tipo:** UDP service issues  
**Estado:** Investigating  
**Impacto:** Deploy interrumpido durante build de imagen

**Detalles:**
- Problema reportado en status.fly.io
- Mensaje: "We're aware of routing issues with UDP services and are currently investigating."
- Timestamp: 2025-11-19 18:54:13 UTC

**Acción Tomada:** Deploy pausado hasta resolución del incidente.

---

## 📊 Estado Actual

### ✅ Completado

| Item | Estado | Detalles |
|------|--------|----------|
| **Cuenta Nueva** | ✅ Creada | just4funpuno@gmail.com |
| **Autenticación** | ✅ Completada | flyctl autenticado |
| **App** | ✅ Creada | ahorro365-baileys-worker-v2 |
| **Volumen** | ✅ Creado | auth_info (1GB, dfw, vol_493o18jjg8k25x54) |
| **Secrets** | ✅ Configurados | 3 de 3 principales |
| **fly.toml** | ✅ Actualizado | app = "ahorro365-baileys-worker-v2" |

### ⏸️ Pendiente

| Item | Estado | Detalles |
|------|--------|----------|
| **Deploy** | ⏸️ Interrumpido | Esperando resolución de incidente Fly.io |
| **Máquina** | ⏸️ No creada | Se creará con el deploy |
| **Sesión WhatsApp** | ⏸️ Pendiente | Requiere deploy + escanear QR |
| **Secrets Opcionales** | ⏸️ Pendiente | BACKEND_API_KEY, SUPABASE_URL, SUPABASE_KEY |

### 📋 Verificación Actual

**App Status:**
```powershell
flyctl status -a ahorro365-baileys-worker-v2
```
**Resultado:**
```
App
  Name     = ahorro365-baileys-worker-v2
  Owner    = personal
  Hostname = ahorro365-baileys-worker-v2.fly.dev
  Image    = - (no hay imagen desplegada)
```

**Secrets:**
```powershell
flyctl secrets list -a ahorro365-baileys-worker-v2
```
**Resultado:**
```
NAME                DIGEST
WHATSAPP_NUMBER     4ad9097e570b5179
BACKEND_URL         dfaf25d74174f71e
ADMIN_DASHBOARD_URL cea67d666b60860c
```

**Volúmenes:**
```powershell
flyctl volumes list -a ahorro365-baileys-worker-v2
```
**Resultado:**
```
ID                  Name      Size Region Created At
vol_493o18jjg8k25x54 auth_info 1GB  dfw    19 Nov 25 19:04 UTC
```

---

## 🎯 Próximos Pasos

### Paso 1: Completar Deploy
**Cuando:** Después de que se resuelva el incidente de Fly.io

**Comando:**
```powershell
cd ahorro365-baileys-worker
flyctl deploy --app ahorro365-baileys-worker-v2
```

**Verificación:**
```powershell
# Verificar que la máquina se creó
flyctl machines list -a ahorro365-baileys-worker-v2

# Verificar health check
curl https://ahorro365-baileys-worker-v2.fly.dev/health
```

### Paso 2: Configurar Sesión WhatsApp
**Cuando:** Después de deploy exitoso

**Pasos:**
1. Acceder a visor QR: `https://ahorro365-baileys-worker-v2.fly.dev/qr/view`
2. Escanear QR con WhatsApp Business
3. Verificar conexión: `curl https://ahorro365-baileys-worker-v2.fly.dev/status`

### Paso 3: Configurar Secrets Opcionales (Si Necesarios)
**Cuando:** Si el worker los requiere

**Secrets a verificar:**
- `BACKEND_API_KEY` - Verificar si existe en Vercel
- `SUPABASE_URL` - Si el worker lo necesita
- `SUPABASE_KEY` - Si el worker lo necesita

**Comando:**
```powershell
flyctl secrets set VARIABLE=valor -a ahorro365-baileys-worker-v2
```

### Paso 4: Actualizar Referencias en Vercel
**Cuando:** Después de verificar que el worker funciona

**Variables a actualizar en Vercel (Backend):**
- `NEXT_PUBLIC_BAILEYS_WORKER_URL` → `https://ahorro365-baileys-worker-v2.fly.dev`

**Variables a actualizar en Vercel (Admin Dashboard):**
- `NEXT_PUBLIC_BAILEYS_WORKER_URL` → `https://ahorro365-baileys-worker-v2.fly.dev`
- `FLY_APP_NAME` → `ahorro365-baileys-worker-v2`
- `FLY_MACHINE_ID` → (obtener después del deploy)

### Paso 5: Verificar Funcionamiento Completo
**Cuando:** Después de todos los pasos anteriores

**Verificaciones:**
1. ✅ Health check responde
2. ✅ Status muestra `connected: true`
3. ✅ Mensaje de prueba funciona
4. ✅ Backend recibe mensajes del worker

---

## ✅ Checklist Completo

### Pre-Migración
- [x] Verificar flyctl instalado
- [x] Listar secrets de cuenta antigua
- [x] Identificar valores de secrets (3 de 6)
- [x] Crear archivo de referencia (`secrets-migracion.txt`)

### Nueva Cuenta
- [x] Crear nueva cuenta en Fly.io
- [x] Autenticar flyctl con nueva cuenta
- [x] Verificar que no hay apps (cuenta nueva)

### Setup App
- [x] Actualizar `fly.toml` con nombre correcto
- [x] Crear app: `ahorro365-baileys-worker-v2`
- [x] Crear volumen persistente: `auth_info` (1GB, dfw)
- [x] Configurar secret: `WHATSAPP_NUMBER`
- [x] Configurar secret: `BACKEND_URL`
- [x] Configurar secret: `ADMIN_DASHBOARD_URL`

### Deploy
- [ ] Completar deploy inicial (pendiente por incidente)
- [ ] Verificar que máquina se creó
- [ ] Verificar health check responde
- [ ] Verificar logs no muestran errores

### Sesión WhatsApp
- [ ] Acceder a visor QR
- [ ] Escanear QR con WhatsApp Business
- [ ] Verificar conexión (`connected: true`)
- [ ] Probar mensaje de prueba

### Configuración Final
- [ ] Configurar secrets opcionales (si necesarios)
- [ ] Actualizar `NEXT_PUBLIC_BAILEYS_WORKER_URL` en Vercel (Backend)
- [ ] Actualizar `NEXT_PUBLIC_BAILEYS_WORKER_URL` en Vercel (Admin Dashboard)
- [ ] Actualizar `FLY_APP_NAME` en Vercel (Admin Dashboard)
- [ ] Actualizar `FLY_MACHINE_ID` en Vercel (Admin Dashboard)

### Verificación Final
- [ ] Health check funciona
- [ ] Status muestra conexión activa
- [ ] Mensaje de prueba funciona
- [ ] Backend recibe mensajes correctamente
- [ ] Logs no muestran errores

---

## 📝 Notas Importantes

### Lecciones Aprendidas

1. **Fly.io no muestra valores de secrets por seguridad**
   - Necesario obtener valores de otras fuentes (Vercel, código)
   - Documentar valores en archivo local (no subir a Git)

2. **Nombres de apps deben ser únicos globalmente**
   - Si un nombre está tomado, usar variante (ej: `-v2`)
   - Verificar disponibilidad antes de crear

3. **Volúmenes requieren confirmación explícita**
   - Usar flag `--yes` en comandos no interactivos
   - Considerar crear 2+ volúmenes para alta disponibilidad

4. **Incidentes de Fly.io pueden interrumpir deploys**
   - Monitorear status.fly.io antes de deploys críticos
   - Tener plan B si hay incidentes activos

5. **Secrets se "staged" hasta el primer deploy**
   - Los secrets se aplican cuando se hace el primer deploy
   - Verificar que se aplicaron correctamente después del deploy

### Comandos Útiles para Futuras Migraciones

```powershell
# Verificar autenticación
flyctl auth whoami

# Cambiar cuenta
flyctl auth logout
flyctl auth login

# Listar apps
flyctl apps list

# Crear app
flyctl apps create NOMBRE --org personal

# Crear volumen
flyctl volumes create NOMBRE --app APP_NAME --region dfw --size 1 --yes

# Configurar secrets
flyctl secrets set VARIABLE=valor -a APP_NAME

# Listar secrets
flyctl secrets list -a APP_NAME

# Deploy
cd ahorro365-baileys-worker
flyctl deploy --app APP_NAME

# Verificar estado
flyctl status -a APP_NAME
flyctl machines list -a APP_NAME
```

---

## 🔗 Referencias

- [Guía de Migración Simplificada](./MIGRACION_NUEVA_CUENTA_FLYIO.md)
- [Guía de Setup Completo](./SETUP_WHATSAPP_FLYIO_COMPLETO.md)
- [Configuración Actual](./CONFIGURACION_WHATSAPP_FLYIO.md)
- [Status de Fly.io](https://status.fly.io)

---

## 📅 Timeline Completo

| Hora (UTC) | Fase | Acción | Resultado |
|------------|------|--------|-----------|
| 18:30 | FASE 1 | Verificar flyctl | ✅ Instalado |
| 18:32 | FASE 1 | Listar secrets | ✅ 5 secrets encontrados |
| 18:35 | FASE 1 | Identificar valores | ✅ 3 valores encontrados |
| 18:45 | FASE 2 | Crear cuenta nueva | ✅ just4funpuno@gmail.com |
| 18:47 | FASE 2 | Autenticar flyctl | ✅ Autenticado |
| 18:50 | FASE 3 | Actualizar fly.toml | ✅ Actualizado |
| 18:51 | FASE 3 | Crear app | ✅ ahorro365-baileys-worker-v2 |
| 19:04 | FASE 3 | Crear volumen | ✅ auth_info creado |
| 19:05 | FASE 3 | Configurar secrets | ✅ 3 secrets configurados |
| 19:06 | FASE 3 | Iniciar deploy | ⏸️ Interrumpido (incidente) |

**Tiempo Total:** ~36 minutos  
**Tiempo Efectivo:** ~30 minutos (6 minutos de espera/resolución de problemas)

---

**Última actualización:** 19 Nov 2025, 21:50 UTC  
**Estado:** ⏸️ Deploy pendiente (incidente Fly.io activo - UDP service issues)

### ⚠️ Incidente Fly.io en Curso

**Problema:** UDP service issues  
**Estado:** Investigating  
**Inicio:** 19 Nov 2025, 18:54:13 UTC  
**Última actualización:** 19 Nov 2025, 21:49:18 UTC  

**Descripción:**
- Apps no pueden recibir tráfico UDP
- Investigación en curso
- Impacta deploys y conectividad de máquinas

**Acción:** Esperar resolución antes de continuar con el deploy.  
**Monitoreo:** https://status.fly.io

