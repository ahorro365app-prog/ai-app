# ⚙️ Configurar GitHub Actions para Cron de 30 Minutos

## ✅ Ya está Configurado

El workflow ya está creado en `.github/workflows/confirm-expired-cron.yml` y configurado para ejecutarse cada 30 minutos.

## 🔧 Pasos para Activar

### Paso 1: Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/ahorro365app-prog/ai-app`
2. Click en **Settings** (arriba a la derecha)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**

#### Secret 1: `CRON_URL`

- **Name:** `CRON_URL`
- **Value:** `https://ai-app-core-api.vercel.app/api/cron/confirm-expired`
- Click en **Add secret**

#### Secret 2: `CRON_SECRET`

- **Name:** `CRON_SECRET`
- **Value:** El mismo valor que tienes en Vercel (variable `CRON_SECRET`)
  - Si no lo tienes, puedes generar uno:
    ```bash
    # Generar un secret aleatorio
    openssl rand -hex 32
    ```
- Click en **Add secret**

### Paso 2: Verificar que el Secret Existe en Vercel

1. Ve a `ai-app-core-api` en Vercel
2. Settings → Environment Variables
3. Verifica que `CRON_SECRET` esté configurado
4. Si no está, agrégalo con el mismo valor que pusiste en GitHub

### Paso 3: Activar el Workflow

1. Ve a tu repo en GitHub
2. Click en la pestaña **Actions**
3. Deberías ver "Confirm Expired Transactions Cron"
4. El workflow se ejecutará automáticamente cada 30 minutos

### Paso 4: Probar Manualmente (Opcional)

1. Ve a **Actions** → "Confirm Expired Transactions Cron"
2. Click en **Run workflow** (botón a la derecha)
3. Selecciona la rama `main`
4. Click en **Run workflow**
5. Espera a que termine y verifica que fue exitoso

---

## ✅ Verificación

### Después de configurar:

1. **Espera 30 minutos** (o ejecuta manualmente)
2. Ve a **Actions** → "Confirm Expired Transactions Cron"
3. Deberías ver una ejecución exitosa
4. Verifica los logs para confirmar que el endpoint fue llamado correctamente

### Si hay errores:

- **Error 401:** El `CRON_SECRET` no coincide entre GitHub y Vercel
- **Error 404:** La URL del endpoint es incorrecta
- **Error de conexión:** Verifica que `ai-app-core-api` esté desplegado

---

## 📊 Uso Estimado

- **Frecuencia:** Cada 30 minutos
- **Ejecuciones/día:** 48
- **Ejecuciones/mes:** 1,440
- **Tiempo/ejecución:** ~1 segundo
- **Tiempo total/mes:** ~24 minutos
- **Límite gratis:** 2,000 minutos/mes
- ✅ **Dentro del límite** (24 < 2,000)

---

## 🎯 Resultado

Después de configurar:

- ✅ El cron se ejecutará **cada 30 minutos** automáticamente
- ✅ Las transacciones expiradas se guardarán con **timeout de 30-31 minutos** (máximo 1 minuto de retraso)
- ✅ **100% Gratis** (dentro del límite de GitHub Actions)
- ✅ **Sin necesidad de Vercel Pro**

---

## 🔄 Si Quieres Más Precisión (Cada Minuto)

Si quieres que el timeout sea más preciso (30-31 minutos en lugar de 30-60 minutos), puedes cambiar el cron a:

```yaml
- cron: '* * * * *'  # Cada minuto
```

**Uso:** 1,440 ejecuciones/día × 30 días = 43,200 ejecuciones/mes
**Tiempo:** 43,200 segundos = **720 minutos/mes**
✅ **Aún dentro del límite** (720 < 2,000)

---

**¿Ya configuraste los secrets en GitHub?**

