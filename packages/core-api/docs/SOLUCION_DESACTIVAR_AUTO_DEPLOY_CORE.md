# 🔧 Solución: Desactivar Auto-Deploy de `ahorro365-core`

**Problema**: Aunque cambiamos el Root Directory, Vercel sigue intentando desplegar en `ahorro365-core`.

**Solución**: Desactivar completamente los auto-deploys de `ahorro365-core`.

---

## ✅ Pasos para Desactivar Auto-Deploy

### Opción 1: Desactivar Automatic Deployments (Recomendada)

1. **Ve a Vercel Dashboard**
2. **Click en `ahorro365-core`** (el proyecto antiguo)
3. **Settings > Git**
4. **Busca la sección "Automatic deployments"**
5. **Desactiva el toggle** para:
   - ✅ **Production deployments**
   - ✅ **Preview deployments** (opcional)
6. **Guarda cambios**

Esto hará que `ahorro365-core`:
- ✅ Siga existiendo en Vercel
- ✅ Pueda desplegarse manualmente si es necesario
- ❌ NO recibirá deploys automáticos desde GitHub

### Opción 2: Desconectar el Repositorio (Más drástica)

Si la Opción 1 no funciona:

1. **Ve a `ahorro365-core`**
2. **Settings > Git**
3. **Click en "Disconnect"** o "Unlink"
4. **Confirma**

Esto desconectará completamente el repositorio de `ahorro365-core`.

---

## ✅ Verificar Configuración de `ahorro365-core-api`

Mientras tanto, verifica que `ahorro365-core-api` esté correctamente configurado:

1. **Ve a `ahorro365-core-api`**
2. **Settings > General**
3. **Verifica:**
   - **Root Directory**: `packages/core-api` ✅
   - **Framework**: Next.js ✅

4. **Settings > Git**
5. **Verifica:**
   - **Repository**: `ahorro365app-prog/ai-app` ✅
   - **Production Branch**: `main` ✅
   - **Automatic deployments**: ✅ **Activado**

---

## 🧪 Prueba Después de Desactivar

Después de desactivar los auto-deploys de `ahorro365-core`:

1. **Hacer un nuevo push:**
   ```bash
   git commit --allow-empty -m "test: Verificar deploy solo en ahorro365-core-api"
   git push
   ```

2. **Verificar en Vercel:**
   - ✅ `ahorro365-core-api` debe recibir el deploy
   - ❌ `ahorro365-core` NO debe recibir el deploy

---

## 📝 Notas

- **No elimines `ahorro365-core` todavía**: Puede ser útil como backup o para referencia
- **Solo desactiva los auto-deploys**: Esto evita que interfiera sin eliminarlo
- **Puedes activarlo manualmente**: Si necesitas desplegar en `ahorro365-core` manualmente, puedes hacerlo desde el dashboard

---

**Última actualización**: 2025-01-20

