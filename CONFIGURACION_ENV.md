# 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO - AHORRO365

## ❌ PROBLEMA IDENTIFICADO:
```
Error: supabaseUrl is required.
```

## ✅ SOLUCIÓN IMPLEMENTADA:

### 📁 Archivo `.env.local` creado con todas las variables necesarias:

```bash
# Variables de entorno para la aplicación Ahorro365

# ===========================================
# SUPABASE CONFIGURACIÓN (REQUERIDO)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ===========================================
# OPENAI CONFIGURACIÓN (PARA WHISPER)
# ===========================================
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# ===========================================
# CONFIGURACIÓN DE WHISPER
# ===========================================
NEXT_PUBLIC_WHISPER_MODEL=whisper-1
NEXT_PUBLIC_WHISPER_LANGUAGE=es
NEXT_PUBLIC_WHISPER_TEMPERATURE=0.0
```

## 🔑 PASOS PARA CONFIGURAR:

### 1️⃣ **SUPABASE (REQUERIDO PARA FUNCIONAR):**

1. **Ve a tu proyecto Supabase:**
   - https://supabase.com/dashboard/project/[tu-proyecto]/settings/api

2. **Copia los valores:**
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Reemplaza en `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2️⃣ **OPENAI (PARA TRANSCRIPCIÓN DE VOZ):**

1. **Ve a OpenAI Platform:**
   - https://platform.openai.com/api-keys

2. **Crea una nueva API key**

3. **Reemplaza en `.env.local`:**
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-abc123...
   ```

## 🚀 DESPUÉS DE CONFIGURAR:

1. **Reinicia el servidor:**
   ```bash
   npm run dev
   ```

2. **Verifica en la consola:**
   - ✅ `OpenAI API Key configurada correctamente`
   - ✅ Sin errores de `supabaseUrl is required`

## 🧪 VERIFICACIÓN:

### ✅ **Si está configurado correctamente:**
- La aplicación cargará sin errores
- El dashboard funcionará normalmente
- La transcripción de voz estará disponible

### ❌ **Si aún hay problemas:**
- Revisa que los valores estén correctos en `.env.local`
- Asegúrate de reiniciar el servidor
- Verifica que no haya espacios extra en las variables

## 📋 CHECKLIST DE CONFIGURACIÓN:

- [ ] Archivo `.env.local` creado
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `NEXT_PUBLIC_OPENAI_API_KEY` configurado (opcional)
- [ ] Servidor reiniciado
- [ ] Aplicación funcionando sin errores

## 💡 NOTAS IMPORTANTES:

- **Supabase es REQUERIDO** para que la app funcione
- **OpenAI es OPCIONAL** pero necesario para transcripción de voz
- Las variables deben empezar con `NEXT_PUBLIC_` para estar disponibles en el cliente
- No compartas tus API keys públicamente

## 🆘 SI NECESITAS AYUDA:

1. Verifica que el archivo `.env.local` esté en la raíz del proyecto
2. Revisa la consola del navegador para errores específicos
3. Asegúrate de que las URLs y keys sean correctas
4. Reinicia el servidor después de cada cambio
