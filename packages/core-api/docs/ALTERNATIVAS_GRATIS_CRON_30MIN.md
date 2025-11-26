# 🆓 Alternativas Gratuitas para Cron de 30 Minutos

## 🎯 Objetivo

Ejecutar el cron job cada **30 minutos** (o más frecuente) sin pagar por Vercel Pro.

---

## ✅ Opción 1: GitHub Actions (RECOMENDADO)

### Ventajas
- ✅ **100% Gratis** (2,000 minutos/mes en plan gratuito)
- ✅ **Precisión:** Cada minuto (o cada 30 minutos)
- ✅ **Integrado** con tu código (en el repo)
- ✅ **Sin servicios externos** adicionales
- ✅ **Escalable** (2,000 min/mes es suficiente)

### Cálculo de Uso
- **Cada 30 minutos:** 48 ejecuciones/día × 30 días = 1,440 ejecuciones/mes
- **Tiempo por ejecución:** ~1 segundo = 1,440 segundos = **24 minutos/mes**
- ✅ **Dentro del límite** (24 < 2,000)

### Implementación

#### Paso 1: Crear el workflow

Crea el archivo: `.github/workflows/confirm-expired-cron.yml`

```yaml
name: Confirm Expired Transactions

on:
  schedule:
    # Ejecutar cada 30 minutos
    - cron: '*/30 * * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  confirm-expired:
    runs-on: ubuntu-latest
    steps:
      - name: Invoke cron endpoint
        run: |
          curl -X GET "${{ secrets.CRON_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

#### Paso 2: Configurar Secrets en GitHub

1. Ve a tu repo en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega:
   - `CRON_URL`: `https://ai-app-core-api.vercel.app/api/cron/confirm-expired`
   - `CRON_SECRET`: El mismo valor que tienes en Vercel (`CRON_SECRET`)

#### Paso 3: Verificar

1. El workflow se ejecutará automáticamente cada 30 minutos
2. Puedes ver las ejecuciones en: Actions → "Confirm Expired Transactions"

### Si Quieres Cada Minuto (Más Preciso)

Cambia el cron a:
```yaml
- cron: '* * * * *'  # Cada minuto
```

**Uso:** 1,440 ejecuciones/día × 30 días = 43,200 ejecuciones/mes
**Tiempo:** 43,200 segundos = **720 minutos/mes**
✅ **Dentro del límite** (720 < 2,000)

---

## ✅ Opción 2: cron-job.org (Más Simple)

### Ventajas
- ✅ **Gratis** (hasta 2 jobs en plan gratuito)
- ✅ **Precisión:** Cada minuto
- ✅ **Muy fácil de configurar** (no requiere código)
- ✅ **Sin límites de ejecuciones** (en plan gratuito básico)

### Implementación

#### Paso 1: Crear cuenta

1. Ve a https://cron-job.org
2. Crea una cuenta gratuita

#### Paso 2: Crear cron job

1. Click en "Create cronjob"
2. Configura:
   - **Title:** `Confirm Expired Transactions`
   - **Address:** `https://ai-app-core-api.vercel.app/api/cron/confirm-expired`
   - **Schedule:** `*/30 * * * *` (cada 30 minutos) o `* * * * *` (cada minuto)
   - **Request method:** `GET`
   - **Request headers:** 
     ```
     Authorization: Bearer TU_CRON_SECRET_AQUI
     ```
3. Guarda

#### Paso 3: Verificar

1. El cron se ejecutará automáticamente
2. Puedes ver el historial en cron-job.org

---

## ✅ Opción 3: Upstash Cron (Gratis)

### Ventajas
- ✅ **Gratis** (hasta 10,000 invocaciones/mes)
- ✅ **Precisión:** Cada minuto
- ✅ **Integrado** con Upstash (si ya usas Redis)
- ✅ **Monitoreo incluido**

### Implementación

#### Paso 1: Crear cuenta

1. Ve a https://upstash.com
2. Crea una cuenta gratuita

#### Paso 2: Crear cron job

1. Ve a "Cron" en el dashboard
2. Click en "Create Cron"
3. Configura:
   - **Name:** `confirm-expired`
   - **URL:** `https://ai-app-core-api.vercel.app/api/cron/confirm-expired`
   - **Schedule:** `*/30 * * * *` (cada 30 minutos)
   - **Headers:**
     ```json
     {
       "Authorization": "Bearer TU_CRON_SECRET_AQUI"
     }
     ```
4. Guarda

#### Paso 3: Verificar

1. El cron se ejecutará automáticamente
2. Puedes ver el historial en Upstash dashboard

---

## 📊 Comparación

| Opción | Costo | Precisión | Facilidad | Límite |
|--------|-------|-----------|-----------|--------|
| **GitHub Actions** | $0 | 1 min | ⭐⭐ | 2,000 min/mes |
| **cron-job.org** | $0 | 1 min | ⭐⭐⭐ | 2 jobs gratis |
| **Upstash Cron** | $0 | 1 min | ⭐⭐ | 10,000 invoc/mes |
| **Vercel Hobby** | $0 | 1 vez/día | ⭐ | 1 ejec/día |

---

## 🎯 Recomendación

### Para 30 minutos exactos:

**Opción 1: GitHub Actions** ⭐ RECOMENDADO
- Gratis
- Precisión: 30-31 minutos (retraso máximo 1 min)
- Integrado con tu código
- Fácil de mantener

### Para máxima precisión (cada minuto):

**Opción 2: cron-job.org** ⭐ MÁS SIMPLE
- Gratis
- Precisión: 30-31 minutos (retraso máximo 1 min)
- No requiere código
- Muy fácil de configurar

---

## 🔧 Implementación Rápida: GitHub Actions

¿Quieres que te ayude a configurar GitHub Actions? Es la opción más recomendada porque:
- ✅ Está en tu repo (fácil de mantener)
- ✅ Gratis
- ✅ Precisión de 1 minuto
- ✅ Sin servicios externos

**¿Quieres que cree el archivo del workflow ahora?**

