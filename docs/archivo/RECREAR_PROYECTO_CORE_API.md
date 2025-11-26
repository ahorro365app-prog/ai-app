# 🔄 Guía: Recrear Proyecto ahorro365-core-api

## 🗑️ Paso 1: Eliminar Proyecto Actual

1. **En Vercel Dashboard:**
   - Ve a proyecto `ahorro365-core-api`
   - Ve a **Settings** (icono de engranaje)
   - Pestaña **General**
   - Scroll hasta el final
   - Busca sección **"Danger Zone"** o **"Delete Project"**
   - Haz clic en **"Delete Project"**
   - Escribe el nombre del proyecto para confirmar
   - Confirma eliminación

## ➕ Paso 2: Crear Proyecto Nuevo

1. **En Vercel Dashboard:**
   - Clic en **"Add New Project"** (botón grande)
   - O desde el menú: **"New Project"**

2. **Conectar Repositorio:**
   - Selecciona: `ahorro365app-prog/ai-app`
   - Branch: `main`

3. **Configurar Proyecto:**
   - **Project Name:** `ahorro365-core-api`
   - **Framework Preset:** `Next.js` (debería detectarse automáticamente)
   - **Root Directory:** `packages/core-api` (IMPORTANTE)
     - Haz clic en "Edit"
     - Escribe: `packages/core-api`
     - O selecciona de la lista si aparece

4. **Variables de Entorno:**
   - Abre sección "Environment Variables"
   - Agrega:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     NEXT_PUBLIC_GROQ_API_KEY
     ```
   - (Las demás las puedes agregar después)

5. **Deploy:**
   - Haz clic en **"Deploy"**
   - Espera a que termine el build

## ✅ Verificación

Después del deploy:

1. **Verifica estado:**
   - Debe ser "Ready" (verde)
   - No debe estar en "Queued"

2. **Prueba API:**
   ```bash
   curl https://ahorro365-core-api.vercel.app/api/ping
   ```

3. **Debería retornar:**
   ```json
   {
     "ok": true,
     "service": "core",
     "runtime": "node",
     "timestamp": 1234567890
   }
   ```

## 📝 Notas

- **No perderás nada:** El código está en GitHub
- **Variables de entorno:** Las tendrás que agregar de nuevo
- **Dominio:** Puede cambiar ligeramente, pero funcionará igual

