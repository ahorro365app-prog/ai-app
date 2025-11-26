# 💰 Fly.io: Modelo de Precios y Costos Estimados

**Última actualización:** 19 Nov 2025

---

## 📊 Modelo de Precios de Fly.io

### ✅ Fly.io cobra por **HORAS/SEGUNDOS de uso** (NO por mes fijo)

**Facturación:**
- **Máquinas (VMs):** Se cobra por **segundo** de ejecución
- **Volúmenes:** Se cobra por **GB al mes** (prorrateado por hora)
- **Red:** Se cobra por **GB transferido** (solo saliente)

**Ventaja:** Solo pagas por el tiempo que las máquinas están **activas**.

---

## 💵 Costos por Componente

### 1. Máquinas (VMs)

**Precio base:**
- **Shared CPU:** ~$0.000000231 por segundo por vCPU
- **Dedicated CPU:** ~$0.000000462 por segundo por vCPU

**Cálculo mensual (24/7):**
- **Shared CPU (1 vCPU):** ~$0.20 por hora → **~$144/mes** (si corre 24/7)
- **Dedicated CPU (1 vCPU):** ~$0.40 por hora → **~$288/mes** (si corre 24/7)

**Nota:** Si la máquina se detiene, **NO se cobra** por ese tiempo.

### 2. Memoria (RAM)

**Precio:** Incluido en el precio de la máquina (no se cobra adicionalmente)

### 3. Volúmenes Persistentes

**Precio:** **$0.15 por GB al mes** (prorrateado por hora)

**Ejemplo:**
- Volumen de 1GB: **$0.15/mes**
- Volumen de 10GB: **$1.50/mes**

### 4. Red (Transferencia de Datos)

**Precio:** **$0.02 - $0.12 por GB** (solo saliente, varía por región)

**Nota:** 
- Tráfico **entrante** es **GRATIS**
- Solo se cobra tráfico **saliente**

### 5. IPs Dedicadas

**Precio:** **$2/mes** por cada dirección IPv4 dedicada

**Nota:** Si usas IPs compartidas (default), es **GRATIS**.

### 6. Certificados SSL

**Precio:**
- Certificado single-domain: **$0.10/mes**
- Certificado wildcard: **$1/mes**

**Nota:** Fly.io incluye certificados SSL básicos **GRATIS** (Let's Encrypt).

---

## 📋 Configuración Actual del Worker

### `fly.toml` Actual

```toml
app = "ahorro365-baileys-worker-v2"
primary_region = "dfw"

[http_service]
  auto_stop_machines = "off"      # ⚠️ Máquina SIEMPRE corriendo
  auto_start_machines = true
  min_machines_running = 1        # ⚠️ Mínimo 1 máquina siempre activa

[[vm]]
  cpu_kind = "shared"              # ✅ Shared CPU (más barato)
  cpus = 1                         # 1 vCPU
  memory_mb = 256                  # 256 MB RAM

[[mounts]]
  source = "auth_info"            # Volumen persistente
  destination = "/app/auth_info"
```

### Análisis de la Configuración

| Configuración | Valor | Impacto en Costo |
|--------------|-------|------------------|
| `auto_stop_machines` | `"off"` | ⚠️ Máquina corre 24/7 → **Máximo costo** |
| `min_machines_running` | `1` | ⚠️ Siempre hay 1 máquina activa |
| `cpu_kind` | `shared` | ✅ Más barato que dedicated |
| `cpus` | `1` | ✅ Mínimo necesario |
| `memory_mb` | `256` | ✅ Suficiente para el worker |
| Volumen | `1GB` | ✅ Mínimo necesario |

---

## 💰 Costo Estimado Mensual (Configuración Actual)

### Escenario: Máquina corriendo 24/7

| Componente | Cantidad | Precio Unitario | Costo Mensual |
|------------|----------|-----------------|---------------|
| **Máquina (Shared CPU, 1 vCPU, 256MB)** | 1 (24/7) | ~$0.20/hora | **~$144/mes** |
| **Volumen (1GB)** | 1 | $0.15/GB/mes | **$0.15/mes** |
| **Red (estimado 10GB saliente)** | 10GB | ~$0.05/GB | **~$0.50/mes** |
| **IP Dedicada** | 0 (usando compartida) | - | **$0/mes** |
| **SSL** | 0 (usando gratis) | - | **$0/mes** |
| **TOTAL ESTIMADO** | | | **~$144.65/mes** |

### Escenario: Máquina corriendo 12 horas/día (50% del tiempo)

| Componente | Cantidad | Precio Unitario | Costo Mensual |
|------------|----------|-----------------|---------------|
| **Máquina (Shared CPU, 1 vCPU, 256MB)** | 1 (12h/día) | ~$0.20/hora | **~$72/mes** |
| **Volumen (1GB)** | 1 | $0.15/GB/mes | **$0.15/mes** |
| **Red (estimado 5GB saliente)** | 5GB | ~$0.05/GB | **~$0.25/mes** |
| **TOTAL ESTIMADO** | | | **~$72.40/mes** |

### Escenario: Máquina corriendo solo cuando hay tráfico (auto-stop habilitado)

**Configuración optimizada:**
```toml
auto_stop_machines = "suspend"    # Se suspende cuando no hay tráfico
auto_start_machines = true        # Se inicia automáticamente con tráfico
```

**Costo estimado:**
- Si hay tráfico 2 horas/día: **~$12/mes** (máquina) + $0.15 (volumen) = **~$12.15/mes**
- Si hay tráfico 1 hora/día: **~$6/mes** (máquina) + $0.15 (volumen) = **~$6.15/mes**

---

## 🎯 Recomendaciones para Optimizar Costos

### Opción 1: Habilitar Auto-Stop (Recomendado para desarrollo/testing)

**Cambios en `fly.toml`:**
```toml
[http_service]
  auto_stop_machines = "suspend"    # ✅ Se suspende cuando no hay tráfico
  auto_start_machines = true       # ✅ Se inicia automáticamente
  min_machines_running = 0         # ✅ Permite que se detenga completamente
```

**Ventajas:**
- ✅ Ahorro de **~90%** en costos si hay poco tráfico
- ✅ Máquina se inicia automáticamente cuando hay tráfico
- ✅ WhatsApp sigue funcionando (solo tarda ~10-30 segundos en iniciar)

**Desventajas:**
- ⚠️ Primera respuesta puede tardar 10-30 segundos (cold start)
- ⚠️ Si hay mucho tráfico, puede ser menos eficiente

**Costo estimado:** **~$6-12/mes** (dependiendo del uso)

### Opción 2: Mantener Configuración Actual (24/7)

**Ventajas:**
- ✅ Respuestas instantáneas (sin cold start)
- ✅ Mejor para producción con mucho tráfico
- ✅ WhatsApp siempre conectado

**Desventajas:**
- ⚠️ Costo fijo de **~$144/mes** (aunque no haya tráfico)

**Costo estimado:** **~$144.65/mes**

### Opción 3: Usar Plan Free Trial

**Fly.io ofrece:**
- **$5 de crédito gratis** al registrarse
- **Período de prueba** (varía, típicamente 7-14 días)

**Con $5 de crédito:**
- Puedes correr una máquina shared (1 vCPU) por **~25 horas**
- O una máquina por **~3 horas/día durante 1 mes**

**Estrategia:**
- Usar crédito gratis para desarrollo/testing
- Migrar a nueva cuenta cuando se agote (como estás haciendo)

---

## 📊 Comparación de Costos

| Configuración | Uso | Costo Mensual | Mejor Para |
|---------------|-----|---------------|------------|
| **24/7 (actual)** | Siempre activo | **~$144.65** | Producción con mucho tráfico |
| **12h/día** | Medio día | **~$72.40** | Producción con tráfico moderado |
| **Auto-stop** | Solo cuando hay tráfico | **~$6-12** | Desarrollo, testing, bajo tráfico |
| **Free trial** | Limitado | **$0** (con crédito) | Pruebas iniciales |

---

## 🔍 Cómo Verificar Costos en Fly.io

### 1. Ver Uso Actual

```bash
# Ver uso de la app
flyctl billing show -a ahorro365-baileys-worker-v2

# Ver máquinas activas
flyctl machines list -a ahorro365-baileys-worker-v2
```

### 2. Dashboard de Fly.io

1. Ve a [fly.io/apps](https://fly.io/apps)
2. Selecciona tu app: `ahorro365-baileys-worker-v2`
3. Ve a la pestaña **"Usage"** o **"Billing"**
4. Verás:
   - Horas de máquina usadas
   - GB de volumen usados
   - GB de red transferidos
   - Costo estimado

### 3. Calculadora de Precios

Fly.io tiene una calculadora oficial:
- [fly.io/calculator](https://fly.io/calculator)

---

## 💡 Recomendación para tu Caso

### Para Desarrollo/Testing (Actual)

**Recomendación:** Usar **auto-stop** para ahorrar costos

```toml
[http_service]
  auto_stop_machines = "suspend"
  auto_start_machines = true
  min_machines_running = 0
```

**Costo estimado:** **~$6-12/mes** (dependiendo del uso)

### Para Producción (Futuro)

**Recomendación:** Mantener **24/7** si hay mucho tráfico

```toml
[http_service]
  auto_stop_machines = "off"
  min_machines_running = 1
```

**Costo estimado:** **~$144.65/mes**

---

## ⚠️ Consideraciones Importantes

### 1. Cold Start con Auto-Stop

Si habilitas `auto_stop_machines = "suspend"`:
- La primera respuesta puede tardar **10-30 segundos**
- WhatsApp puede tardar en reconectarse
- Los usuarios pueden notar el delay

### 2. Límites del Free Trial

- **$5 de crédito gratis** al registrarse
- Se agota rápidamente si la máquina corre 24/7
- Después del trial, se cobra por uso real

### 3. Facturación

- Fly.io factura **mensualmente**
- Puedes ver el uso en tiempo real en el dashboard
- No hay cargos ocultos

---

## 📝 Resumen

### ✅ Fly.io cobra por **HORAS/SEGUNDOS** (no por mes fijo)

**Tu configuración actual:**
- Máquina corriendo **24/7** → **~$144.65/mes**
- Volumen 1GB → **$0.15/mes**
- Red (estimado) → **~$0.50/mes**

**Si optimizas con auto-stop:**
- Máquina solo cuando hay tráfico → **~$6-12/mes**
- Ahorro de **~90%** en costos

**Recomendación:**
- Para desarrollo/testing: Usar **auto-stop** (ahorro significativo)
- Para producción: Evaluar según tráfico (puede ser necesario 24/7)

---

**Última actualización:** 19 Nov 2025  
**Fuente:** [fly.io/docs/about/pricing](https://fly.io/docs/about/pricing)

