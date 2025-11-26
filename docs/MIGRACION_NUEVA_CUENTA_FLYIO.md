# 🔄 Guía de Migración: Nueva Cuenta de Fly.io

Esta guía documenta cómo migrar el worker de WhatsApp de una cuenta de Fly.io a otra para aprovechar el período de prueba gratuito adicional.

---

## ⚠️ Análisis de Riesgos

### ✅ **Es MUY FÁCIL** - Sin necesidad de migrar sesión

### Riesgos Identificados

| Riesgo | Nivel | Impacto | Mitigación |
|--------|-------|---------|------------|
| ~~**Pérdida de sesión de WhatsApp**~~ | ✅ **NO APLICA** | **No hay problema en escanear QR de nuevo** | **Generar nuevo QR en nueva cuenta** |
| **Downtime durante migración** | 🟡 MEDIO | Servicio inactivo 15-30 minutos | Planificar migración en horario de bajo uso |
| **URL cambia** | 🟡 MEDIO | Referencias en código necesitan actualización | Actualizar variables de entorno |
| **Configuración incorrecta** | 🟡 MEDIO | Worker no funciona | Seguir guía paso a paso |

### Ventajas

- ✅ 2 semanas adicionales de prueba gratuita
- ✅ Mismo proceso, solo con nueva cuenta
- ✅ Código ya está en Git (no se pierde)
- ✅ Configuración documentada
- ✅ **NO necesitas migrar volumen persistente** (solo escanear QR nuevo)
- ✅ **Proceso más simple y rápido** (30-45 minutos)

### Desventajas

- ⚠️ Requiere trabajo manual (30-45 minutos)
- ⚠️ Posible downtime de 15-30 minutos
- ⚠️ Necesita actualizar referencias en código
- ⚠️ Necesitas escanear QR de nuevo (pero no es problema según indicaste)

---

## 📋 Checklist Pre-Migración

Antes de empezar, verifica:

- [ ] Tienes acceso a la cuenta actual de Fly.io (opcional, solo para anotar secrets)
- [ ] Tienes anotados todos los secrets actuales
- [ ] Tienes acceso al código fuente (Git)
- [ ] Tienes acceso a Vercel/Backend para actualizar variables
- [ ] Tienes WhatsApp Business listo para escanear nuevo QR

**Nota:** Como no necesitas migrar la sesión, no necesitas hacer backup del volumen.

---

## 🎯 Componentes a Migrar

### 1. **Secrets (Variables de Entorno)**
- `WHATSAPP_NUMBER`
- `BACKEND_URL`
- `BACKEND_API_KEY`
- `FORCE_NEW_SESSION` (si existe)

### 3. **Configuración (fly.toml)**
- Ya está en Git, no necesita migración
- Solo verificar que esté correcto

### 4. **Código**
- Ya está en Git, no necesita migración

### 5. **Referencias en Código**
- `NEXT_PUBLIC_BAILEYS_WORKER_URL` en Vercel
- `FLY_APP_NAME` en admin-dashboard (si existe)
- `FLY_MACHINE_ID` en admin-dashboard (si existe)
- URLs hardcodeadas en documentación (bajo prioridad)

---

## 🚀 Proceso de Migración Paso a Paso

### FASE 1: Preparación (Cuenta Actual)

#### Paso 1.1: Anotar Secrets Actuales

```bash
# Listar secrets (solo nombres)
flyctl secrets list -a ahorro365-baileys-worker

# Anotar los valores manualmente (no se pueden ver los valores)
# O revisar en Vercel/Backend donde estén configurados
```

**Secrets a anotar:**
- `WHATSAPP_NUMBER=59160360908` (ejemplo)
- `BACKEND_URL=https://tu-backend.vercel.app`
- `BACKEND_API_KEY=tu-secret-key`

**💡 Tip:** Si no recuerdas los valores, puedes revisarlos en:
- Vercel (Backend): Settings → Environment Variables
- O en el código donde estén configurados

---

### FASE 2: Crear Nueva Cuenta

#### Paso 2.1: Crear Nueva Cuenta en Fly.io

1. Ir a [fly.io](https://fly.io)
2. Clic en "Sign Up"
3. Usar email diferente o método diferente
4. Verificar email

#### Paso 2.2: Autenticar Nueva Cuenta en flyctl

```bash
# Cerrar sesión de cuenta actual (opcional, pero recomendado)
flyctl auth logout

# Autenticar nueva cuenta
flyctl auth login
```

---

### FASE 3: Setup en Nueva Cuenta

#### Paso 3.1: Crear App en Nueva Cuenta

```bash
# Desde el directorio del worker
cd ahorro365-baileys-worker

# Crear app (puede usar el mismo nombre o diferente)
flyctl apps create ahorro365-baileys-worker

# Si el nombre ya existe, usar uno diferente:
# flyctl apps create ahorro365-baileys-worker-v2
```

**Nota:** Si usas un nombre diferente, actualiza `fly.toml`:
```toml
app = "ahorro365-baileys-worker-v2"  # ← Cambiar aquí
```

#### Paso 3.2: Crear Volumen Persistente

```bash
# Crear volumen en la nueva cuenta (para guardar nueva sesión)
flyctl volumes create auth_info \
  --app ahorro365-baileys-worker \
  --region dfw \
  --size 1
```

**Nota:** Este volumen estará vacío inicialmente. Se llenará cuando escanees el nuevo QR.

#### Paso 3.3: Configurar Secrets

```bash
# Configurar secrets con los valores anotados
flyctl secrets set WHATSAPP_NUMBER=59160360908 \
  -a ahorro365-baileys-worker

flyctl secrets set BACKEND_URL=https://tu-backend.vercel.app \
  -a ahorro365-baileys-worker

flyctl secrets set BACKEND_API_KEY=tu-secret-key \
  -a ahorro365-baileys-worker
```

#### Paso 3.4: Deploy Inicial

```bash
# Hacer deploy
flyctl deploy

# Verificar que se creó la máquina
flyctl machines list -a ahorro365-baileys-worker
```

---

### FASE 4: Configurar Sesión de WhatsApp (Escanear QR Nuevo)

#### Paso 4.1: Verificar que Worker Está Corriendo

```bash
# Verificar estado
flyctl status -a ahorro365-baileys-worker

# Verificar máquinas
flyctl machines list -a ahorro365-baileys-worker
```

#### Paso 4.2: Acceder al Visor de QR

1. **Obtener URL de la nueva app:**
   ```bash
   flyctl status -a ahorro365-baileys-worker
   # Anotar la URL (ejemplo: https://ahorro365-baileys-worker-v2.fly.dev)
   ```

2. **Abrir visor de QR en el navegador:**
   ```
   https://NUEVA-URL.fly.dev/qr/view
   ```

3. **O obtener QR vía API:**
   ```bash
   curl https://NUEVA-URL.fly.dev/qr
   ```

#### Paso 4.3: Escanear QR con WhatsApp Business

1. Abre WhatsApp Business en tu teléfono
2. Ve a: **Configuración → Dispositivos vinculados → Vincular dispositivo**
3. Escanea el QR que aparece en el visor
4. Espera confirmación de conexión

#### Paso 4.4: Verificar Conexión

```bash
# Verificar estado de conexión
curl https://NUEVA-URL.fly.dev/status

# Debe mostrar:
# {
#   "connected": true,
#   "lastSync": "2025-XX-XX...",
#   "uptime": 99.8
# }
```

---

### FASE 5: Verificar y Actualizar Referencias

#### Paso 5.1: Verificar Funcionamiento

```bash
# Status de WhatsApp (debe mostrar connected: true)
curl https://NUEVA-URL.fly.dev/status
```

**Respuesta esperada:**
```json
{
  "connected": true,
  "lastSync": "2025-XX-XX...",
  "uptime": 99.8
}
```

**Verificar en logs:**
```bash
flyctl logs -a ahorro365-baileys-worker --no-tail
```

Buscar:
- ✅ `✅ Conectado a WhatsApp!`
- ✅ `connection.update: open`
- ❌ Si hay errores, revisar troubleshooting

#### Paso 5.2: Actualizar Variables en Vercel/Backend

**En Vercel (Backend):**

1. Ir a proyecto en Vercel
2. Settings → Environment Variables
3. Actualizar:
   - `NEXT_PUBLIC_BAILEYS_WORKER_URL` → Nueva URL
   - Ejemplo: `https://ahorro365-baileys-worker-v2.fly.dev`

**En Admin Dashboard (si aplica):**

1. Ir a proyecto admin-dashboard en Vercel
2. Settings → Environment Variables
3. Actualizar:
   - `NEXT_PUBLIC_BAILEYS_WORKER_URL` → Nueva URL
   - `FLY_APP_NAME` → Nuevo nombre de app (si cambió)
   - `FLY_MACHINE_ID` → Nuevo Machine ID
   - `FLY_API_TOKEN` → Nuevo token de API (si aplica)

#### Paso 5.3: Actualizar Scripts Locales (Opcional)

Si tienes scripts que referencian la URL antigua:

```powershell
# Actualizar verificar-estado.ps1
$WORKER_URL = "https://NUEVA-URL.fly.dev"
```

---

### FASE 6: Limpieza (Opcional)

#### Paso 6.1: Detener App Antigua (Opcional)

Si quieres ahorrar recursos en la cuenta antigua:

```bash
# Cambiar a cuenta antigua
flyctl auth logout
flyctl auth login  # Cuenta antigua

# Detener máquinas
flyctl machines stop <MACHINE_ID_ANTIGUO> -a ahorro365-baileys-worker
```

**Nota:** Como no migraste la sesión, no hay problema en eliminar la cuenta antigua cuando quieras.

---

## 🐛 Troubleshooting

### Problema: QR no aparece o no se puede escanear

**Síntomas:**
- Visor de QR muestra "Esperando QR..." indefinidamente
- QR no se genera

**Solución:**
```bash
# Reiniciar worker para forzar generación de QR
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker

# Esperar 30-60 segundos y volver a abrir visor
# https://NUEVA-URL.fly.dev/qr/view

# Si sigue sin aparecer, limpiar sesión y reiniciar:
flyctl ssh console -a ahorro365-baileys-worker -C \
  "sh -lc 'rm -f /app/auth_info/*.json'"
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
# Luego volver a abrir visor de QR
```

### Problema: Worker no se conecta al Backend

**Síntomas:**
- Logs muestran errores de conexión al backend
- Mensajes no se procesan

**Solución:**
```bash
# Verificar secrets
flyctl secrets list -a ahorro365-baileys-worker

# Verificar que BACKEND_URL es correcto
# Verificar que BACKEND_API_KEY es correcto

# Si están mal, actualizar:
flyctl secrets set BACKEND_URL=https://tu-backend.vercel.app -a ahorro365-baileys-worker
flyctl secrets set BACKEND_API_KEY=tu-key -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

### Problema: URL no funciona

**Síntomas:**
- `curl https://nueva-url.fly.dev/health` no responde

**Solución:**
```bash
# Verificar que la app existe
flyctl status -a ahorro365-baileys-worker

# Verificar que hay máquinas corriendo
flyctl machines list -a ahorro365-baileys-worker

# Si no hay máquinas, hacer deploy:
flyctl deploy
```

---

## ✅ Checklist de Migración

### Pre-Migración
- [ ] Secrets anotados
- [ ] Código en Git actualizado
- [ ] WhatsApp Business listo para escanear

### Nueva Cuenta
- [ ] Nueva cuenta creada en Fly.io
- [ ] Autenticado en flyctl con nueva cuenta
- [ ] App creada en nueva cuenta
- [ ] Volumen persistente creado
- [ ] Secrets configurados
- [ ] Deploy realizado

### Configurar Sesión WhatsApp
- [ ] Worker está corriendo
- [ ] Visor de QR accesible
- [ ] QR escaneado con WhatsApp Business
- [ ] Conexión verificada (`connected: true`)

### Verificación
- [ ] Health check responde
- [ ] Status muestra `connected: true`
- [ ] Logs no muestran errores
- [ ] Mensaje de prueba funciona

### Actualización de Referencias
- [ ] `NEXT_PUBLIC_BAILEYS_WORKER_URL` actualizado en Vercel
- [ ] `FLY_APP_NAME` actualizado (si aplica)
- [ ] `FLY_MACHINE_ID` actualizado (si aplica)
- [ ] Scripts locales actualizados (si aplica)

---

## 📊 Tiempo Estimado

- **Preparación:** 5-10 minutos (solo anotar secrets)
- **Crear nueva cuenta:** 5 minutos
- **Setup en nueva cuenta:** 15-20 minutos
- **Escanear QR y verificar:** 5-10 minutos
- **Actualizar referencias:** 10-15 minutos
- **Total:** ~30-45 minutos ⚡ **Mucho más rápido sin migrar sesión**

---

## 🎯 Recomendaciones

### ✅ Hacer

1. **Anotar secrets antes de empezar**
2. **Migrar en horario de bajo uso** (para minimizar downtime)
3. **Verificar cada paso antes de continuar**
4. **Mantener cuenta antigua activa** hasta confirmar que nueva funciona
5. **Probar con mensaje real** antes de dar por terminada la migración
6. **Tener WhatsApp Business listo** para escanear QR inmediatamente

### ❌ No Hacer

1. **NO eliminar cuenta antigua** hasta confirmar que nueva funciona
2. **NO actualizar referencias** hasta verificar que nueva cuenta funciona y está conectada
3. **NO hacer migración** si hay usuarios activos sin avisar
4. **NO cerrar sesión de WhatsApp** en la cuenta antigua hasta que la nueva esté funcionando

---

## 🔄 Plan B: Si Algo Sale Mal

### Si el QR no funciona o no se puede escanear:

1. **Reiniciar worker y generar nuevo QR:**
   ```bash
   flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
   # Esperar 30-60 segundos
   # Luego abrir: https://nueva-url.fly.dev/qr/view
   ```

2. **Si sigue sin funcionar, limpiar y regenerar:**
   ```bash
   flyctl ssh console -a ahorro365-baileys-worker -C \
     "sh -lc 'rm -f /app/auth_info/*.json'"
   flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
   # Luego escanear QR en: https://nueva-url.fly.dev/qr/view
   ```

3. **Volver a cuenta antigua (si es necesario):**
   ```bash
   flyctl auth logout
   flyctl auth login  # Cuenta antigua
   flyctl machines start <MACHINE_ID_ANTIGUO> -a ahorro365-baileys-worker
   ```

### Si el backend no funciona:

1. Verificar que `BACKEND_URL` y `BACKEND_API_KEY` están correctos
2. Verificar que el backend está accesible desde internet
3. Revisar logs del backend para ver si recibe requests

---

## 📚 Referencias

- [Guía de Setup Completo](./SETUP_WHATSAPP_FLYIO_COMPLETO.md)
- [Configuración Actual](./CONFIGURACION_WHATSAPP_FLYIO.md)
- [Documentación de Fly.io](https://fly.io/docs)

---

## 💡 Alternativas

### Opción 1: Migrar a Nueva Cuenta (Esta Guía)
- ✅ 2 semanas adicionales gratis
- ⚠️ Requiere trabajo manual
- ⚠️ Posible downtime

### Opción 2: Pagar Plan de Fly.io
- ✅ Sin migración
- ✅ Sin downtime
- ❌ Requiere pago mensual

### Opción 3: Migrar a Railway/Render
- ✅ Alternativa gratuita
- ⚠️ Requiere migración completa
- ⚠️ Diferente plataforma

---

**Última actualización:** 2025-01-XX  
**Versión:** 1.0

