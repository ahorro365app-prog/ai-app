# ⚠️ Límites de Vercel Cron en Plan Gratuito

> **Fecha:** 2025-01-22  
> **Problema:** Plan Hobby (gratuito) tiene limitaciones para crons frecuentes

---

## 🔍 Límites del Plan Hobby (Gratuito)

### Restricciones
- ✅ **Máximo 2 cron jobs**
- ❌ **Solo 1 ejecución por día** (no más frecuente)
- ❌ **Programación no garantizada** (puede ejecutarse en ventana de 1 hora)
- ❌ **NO permite:** `* * * * *` (cada minuto)
- ❌ **NO permite:** `*/5 * * * *` (cada 5 minutos)
- ✅ **Solo permite:** `0 2 * * *` (una vez al día)

### Ejemplo
```json
// ✅ PERMITIDO en plan gratuito
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"  // Una vez al día a las 2 AM
    }
  ]
}

// ❌ NO PERMITIDO en plan gratuito
{
  "crons": [
    {
      "path": "/api/cron/confirm-expired",
      "schedule": "* * * * *"  // Cada minuto - REQUIERE PRO
    }
  ]
}
```

---

## 💰 Plan Pro de Vercel

### Características
- ✅ **Hasta 40 cron jobs**
- ✅ **Invocaciones ilimitadas**
- ✅ **Programación precisa** (ejecuta exactamente cuando se programa)
- ✅ **Permite:** `* * * * *` (cada minuto)
- ✅ **Permite:** `*/5 * * * *` (cada 5 minutos)
- ✅ **Permite:** Cualquier frecuencia

### Precio
- **$20/mes** por proyecto
- **$240/año**

---

## 🔄 Alternativas sin Vercel Pro

### Opción 1: Mantener Cron cada 5 minutos (Plan Gratuito)
**Problema:** Plan gratuito NO permite crons más frecuentes que 1 vez/día

**Solución:** Usar servicio externo para invocar el endpoint

---

### Opción 2: GitHub Actions (Gratis)

#### Implementación
```yaml
# .github/workflows/confirm-expired.yml
name: Confirm Expired Cron

on:
  schedule:
    - cron: '* * * * *'  # Cada minuto
  workflow_dispatch:

jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Invoke cron endpoint
        run: |
          curl -X GET "${{ secrets.CRON_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Pros
- ✅ **Gratis** (2,000 minutos/mes en plan gratuito)
- ✅ **Precisión:** Cada minuto
- ✅ **Sin límite de ejecuciones** (dentro del límite de minutos)

#### Contras
- ⚠️ **Límite:** 2,000 minutos/mes (gratis)
- ⚠️ **Cálculo:** 1,440 ejecuciones/día × 30 días = 43,200 ejecuciones/mes
- ⚠️ **Cada ejecución:** ~1 segundo = 43,200 segundos = 720 minutos/mes
- ✅ **Dentro del límite** (720 < 2,000)

#### Costo
- **Gratis:** Hasta 2,000 minutos/mes
- **Nuestro uso:** ~720 minutos/mes ✅ **SUFICIENTE**

---

### Opción 3: External Cron Service (Gratis)

#### Servicios Disponibles
- **cron-job.org** (gratis, hasta 2 jobs)
- **EasyCron** (gratis, hasta 1 job)
- **UptimeRobot** (gratis, monitoreo + cron)

#### Implementación con cron-job.org
1. Crear cuenta gratuita
2. Configurar job:
   - URL: `https://tu-app.vercel.app/api/cron/confirm-expired`
   - Frecuencia: Cada minuto
   - Headers: `Authorization: Bearer CRON_SECRET`

#### Pros
- ✅ **Gratis**
- ✅ **Precisión:** Cada minuto
- ✅ **Sin límites** (en plan gratuito básico)

#### Contras
- ⚠️ **Servicio externo** (dependencia adicional)
- ⚠️ **Límites en plan gratuito** (varía por servicio)

---

### Opción 4: Vercel Pro ($20/mes)

#### Pros
- ✅ **Integrado** (sin servicios externos)
- ✅ **Precisión exacta**
- ✅ **Escalable** (sin límites)
- ✅ **Monitoreo incluido**

#### Contras
- ❌ **Costo:** $20/mes = $240/año

---

## 📊 Comparación de Alternativas

| Opción | Costo | Precisión | Complejidad | Escalabilidad |
|--------|-------|-----------|-------------|----------------|
| **GitHub Actions** | $0 | 1 min | ⭐⭐ | ✅ Buena |
| **cron-job.org** | $0 | 1 min | ⭐ | ✅ Buena |
| **Vercel Pro** | $20/mes | 1 min | ⭐ | ✅✅ Excelente |
| **Cron 5 min (actual)** | $0 | 5 min | ⭐ | ✅ Buena |

---

## 🎯 Recomendación

### Si NO tienes Vercel Pro:

**Opción 1: GitHub Actions** ⭐ RECOMENDADO
- Gratis
- Precisión de 1 minuto
- Integrado con tu repo
- 720 min/mes < 2,000 min/mes (límite gratis)

**Opción 2: cron-job.org**
- Gratis
- Precisión de 1 minuto
- Más simple (no requiere repo)

**Opción 3: Mantener cada 5 minutos**
- Funciona en plan gratuito
- Precisión: 30-35 minutos
- Sin cambios necesarios

---

## 💡 Implementación Recomendada: GitHub Actions

### Ventajas
1. ✅ **Gratis** (dentro del límite)
2. ✅ **Precisión:** 1 minuto
3. ✅ **Integrado** con tu código (en el repo)
4. ✅ **Sin servicios externos** adicionales
5. ✅ **Escalable** (2,000 min/mes es suficiente)

### Desventajas
- ⚠️ **Requiere GitHub** (pero ya lo usas)
- ⚠️ **Límite:** 2,000 min/mes (pero suficiente para nuestro caso)

---

**Documento creado:** 2025-01-22  
**Última actualización:** 2025-01-22

