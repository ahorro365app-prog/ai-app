@echo off
echo 🔧 Configurando variables de entorno para Ahorro365...

REM Verificar si .env.local existe
if not exist ".env.local" (
    echo 📝 Creando archivo .env.local...
    (
        echo # Variables de entorno para la aplicación Ahorro365
        echo.
        echo # ===========================================
        echo # SUPABASE CONFIGURACIÓN ^(REQUERIDO^)
        echo # ===========================================
        echo # Obtén estos valores en: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
        echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
        echo.
        echo # ===========================================
        echo # OPENAI CONFIGURACIÓN ^(PARA WHISPER^)
        echo # ===========================================
        echo # Obtén tu API key en: https://platform.openai.com/api-keys
        echo NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Configuración de Whisper
        echo NEXT_PUBLIC_WHISPER_MODEL=whisper-1
        echo NEXT_PUBLIC_WHISPER_LANGUAGE=es
        echo NEXT_PUBLIC_WHISPER_TEMPERATURE=0.0
        echo.
        echo # ===========================================
        echo # N8N CONFIGURACIÓN ^(PARA FUTURAS FASES^)
        echo # ===========================================
        echo NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voz-gasto
        echo.
        echo # ===========================================
        echo # CONFIGURACIÓN DE LA APLICACIÓN
        echo # ===========================================
        echo NEXT_PUBLIC_APP_NAME=Ahorro365
        echo NEXT_PUBLIC_APP_VERSION=0.0.1
    ) > .env.local
    echo ✅ Archivo .env.local creado
) else (
    echo ⚠️ El archivo .env.local ya existe
)

echo.
echo 🔑 CONFIGURACIÓN REQUERIDA:
echo.
echo 1️⃣ SUPABASE ^(REQUERIDO^):
echo    - Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
echo    - Copia Project URL → NEXT_PUBLIC_SUPABASE_URL
echo    - Copia anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
echo.
echo 2️⃣ OPENAI ^(PARA TRANSCRIPCIÓN^):
echo    - Ve a: https://platform.openai.com/api-keys
echo    - Crea una nueva API key
echo    - Copia la key → NEXT_PUBLIC_OPENAI_API_KEY
echo.
echo 3️⃣ REINICIA EL SERVIDOR:
echo    - Ejecuta: npm run dev
echo.
echo 💰 Costos estimados OpenAI: ~$0.006 por minuto de audio
echo 📋 Ver archivo CONFIGURACION_ENV.md para más detalles
echo.
pause
