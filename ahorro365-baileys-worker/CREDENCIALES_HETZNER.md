# 🔑 Credenciales y URLs para Hetzner

## ✅ URLs ENCONTRADAS

### Admin Dashboard
```
ADMIN_DASHBOARD_URL=https://admin-dashboard-eta-liard-77.vercel.app
```

---

## ❓ CREDENCIALES A OBTENER

### 1. Supabase

**Dónde obtener:**
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings → API**

**Valores a copiar:**

#### SUPABASE_URL
- Copia el **Project URL**
- Ejemplo: `https://xxxxxxxxxxxxx.supabase.co`

#### SUPABASE_KEY
- Copia la **anon public** key
- Es la que empieza con `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- O usa la **service_role** key si necesitas permisos administrativos

---

### 2. Backend URL (OPCIONAL)

**Opciones:**

#### a) Si el backend está en el mismo Admin Dashboard:
```
BACKEND_URL=https://admin-dashboard-eta-liard-77.vercel.app
```

#### b) Si tienes un backend separado:
```
BACKEND_URL=https://tu-backend.vercel.app
```

#### c) Si NO tienes backend desplegado:
```
BACKEND_URL=
```
(Deja vacío o comenta la línea)

---

## 📝 ARCHIVO .env PARA HETZNER

Copia esto en tu archivo `.env` del worker:

```env
# ===========================================
# SUPABASE (OBTENER DE TU DASHBOARD)
# ===========================================
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# ADMIN DASHBOARD (YA ENCONTRADA)
# ===========================================
ADMIN_DASHBOARD_URL=https://admin-dashboard-eta-liard-77.vercel.app

# ===========================================
# BACKEND (OPCIONAL)
# ===========================================
BACKEND_URL=https://admin-dashboard-eta-liard-77.vercel.app
BACKEND_API_KEY=tu-secret-key-aqui

# ===========================================
# WHATSAPP
# ===========================================
WHATSAPP_NUMBER=59160360908

# ===========================================
# SERVER
# ===========================================
NODE_ENV=production
PORT=3003
LOG_LEVEL=info
BAILEYS_SESSION_PATH=/app/auth_info
QR_POLLING_URL=https://admin-dashboard-eta-liard-77.vercel.app
```

---

## ✅ VERIFICACIÓN

Después de configurar `.env`, verifica:

1. **Supabase**: ¿Conecta a tu base de datos?
2. **Admin Dashboard**: ¿La URL funciona?
3. **Backend**: ¿Tienes backend desplegado o no?

---

## 🚀 SIGUIENTE

Una vez que tengas las credenciales:

1. Edita `.env` en `ahorro365-baileys-worker/`
2. Completa `SUPABASE_URL` y `SUPABASE_KEY`
3. Verifica `BACKEND_URL` según tu caso
4. Continúa con el deploy en Hetzner

