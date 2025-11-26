# 🔐 GUÍA: Variables de Entorno Seguras

**Objetivo**: Prevenir la fuga de secrets y configurar correctamente las variables de entorno

---

## ✅ VERIFICACIONES REALIZADAS

### 1. .gitignore Configurado ✅
- ✅ `.env*` está en `.gitignore`
- ✅ Archivos `.env.local`, `.env.production`, etc. no se suben al repositorio

### 2. Archivos .env en Repositorio ✅
- ✅ No hay archivos `.env` con secrets en el repositorio
- ✅ Solo hay archivos de ejemplo (`.env.example`, `env-template.txt`)

### 3. Variables de Entorno Requeridas

#### App Principal
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Requerida
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Requerida
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Requerida (SECRETO)
- ⚠️ `NEXT_PUBLIC_GROQ_API_KEY` - Opcional
- ⚠️ `META_WHATSAPP_TOKEN` - Opcional
- ⚠️ `UPSTASH_REDIS_REST_URL` - Opcional
- ⚠️ `UPSTASH_REDIS_REST_TOKEN` - Opcional (SECRETO)

#### Admin Dashboard
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Requerida
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Requerida (SECRETO)
- ⚠️ `JWT_SECRET` - Opcional (SECRETO)
- ⚠️ `UPSTASH_REDIS_REST_URL` - Opcional
- ⚠️ `UPSTASH_REDIS_REST_TOKEN` - Opcional (SECRETO)

---

## 🛡️ MEJORES PRÁCTICAS

### 1. Nunca Commitees Secrets

❌ **NUNCA HAGAS ESTO:**
```bash
git add .env.local
git commit -m "Add env file"
```

✅ **SIEMPRE:**
```bash
# .env.local está en .gitignore, no se puede commitear
git add .env.local  # Esto fallará o será ignorado
```

### 2. Usa Archivos de Ejemplo

✅ **Archivos permitidos en el repositorio:**
- `.env.example` - Template sin secrets
- `env-template.txt` - Template sin secrets
- `env-local-template.txt` - Template sin secrets

❌ **Archivos NUNCA en el repositorio:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Cualquier archivo con secrets reales

### 3. Variables de Entorno por Entorno

**Desarrollo (local):**
```bash
# .env.local (no se commitea)
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Producción (Vercel):**
- Configurar en Vercel Dashboard → Settings → Environment Variables
- Nunca hardcodear en el código

### 4. Nomenclatura de Variables

**Públicas (NEXT_PUBLIC_*):**
- Se exponen al cliente
- No contienen secrets
- Ejemplo: `NEXT_PUBLIC_SUPABASE_URL`

**Privadas (sin NEXT_PUBLIC_):**
- Solo en servidor
- Pueden contener secrets
- Ejemplo: `SUPABASE_SERVICE_ROLE_KEY`

### 5. Validación de Variables

Ejecuta el script de validación:
```bash
npx tsx scripts/validate-env.ts
```

---

## 🔍 VERIFICACIÓN DE SECRETS HARDCODEADOS

### Patrones a Buscar

1. **API Keys:**
   - `sk-` (Stripe, OpenAI)
   - `pk_` (Stripe)
   - `AIza` (Google)
   - `ghp_` (GitHub)

2. **JWT Tokens:**
   - `eyJ` (comienza con esto)

3. **Passwords/Secrets:**
   - `password.*=.*['\"].*['\"]`
   - `secret.*=.*['\"].*['\"]`

### Herramientas Recomendadas

1. **gitleaks** (Recomendado)
   ```bash
   brew install gitleaks  # macOS
   gitleaks detect --source .
   ```

2. **truffleHog**
   ```bash
   pip install truffleHog
   truffleHog --regex --entropy=False .
   ```

3. **git-secrets** (AWS)
   ```bash
   git secrets --install
   git secrets --register-aws
   git secrets --scan
   ```

---

## 📋 CHECKLIST DE SEGURIDAD

### Antes de Hacer Commit
- [ ] Verificar que `.env*` esté en `.gitignore`
- [ ] No commitear archivos `.env.local`
- [ ] No hardcodear secrets en el código
- [ ] Usar variables de entorno para todos los secrets

### Antes de Deploy
- [ ] Configurar todas las variables en Vercel
- [ ] Verificar que no haya secrets en el código
- [ ] Ejecutar `scripts/validate-env.ts`
- [ ] Ejecutar `scripts/check-secrets.sh`

### Después de Fuga de Secret
1. **Rotar el secret inmediatamente**
2. **Revisar logs de acceso**
3. **Eliminar el secret del historial de git** (si fue commiteado)
4. **Notificar al equipo**

---

## 🔧 CONFIGURACIÓN EN VERCEL

### Variables de Entorno en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega cada variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJ...` (tu secret)
   - **Environment**: Production, Preview, Development

### Variables Sensibles

Marcar como "Sensitive" en Vercel:
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `META_WHATSAPP_TOKEN`
- `UPSTASH_REDIS_REST_TOKEN`
- Cualquier API key o token

---

## ⚠️ ADVERTENCIAS IMPORTANTES

1. **NEXT_PUBLIC_* se expone al cliente**
   - No uses `NEXT_PUBLIC_` para secrets
   - Solo para valores públicos (URLs, IDs públicos)

2. **Service Role Key es muy sensible**
   - Bypasea RLS
   - Solo usar en servidor
   - Nunca exponer al cliente

3. **JWT Secrets deben ser largos**
   - Mínimo 32 caracteres
   - Aleatorios y únicos
   - No usar valores de ejemplo en producción

---

## 📚 REFERENCIAS

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## ✅ ESTADO ACTUAL

- ✅ `.gitignore` configurado correctamente
- ✅ No hay archivos `.env` en el repositorio
- ✅ Archivos de ejemplo sin secrets
- ✅ Script de validación creado
- ✅ Documentación completa

**Estado**: ✅ **CONFIGURADO CORRECTAMENTE**

