#!/bin/bash

# Script para configurar variables de entorno
echo "🔧 Configurando variables de entorno para Ahorro365..."

# Verificar si .env.local existe
if [ ! -f ".env.local" ]; then
    echo "📝 Creando archivo .env.local..."
    cat > .env.local << 'EOF'
# Variables de entorno para la aplicación Ahorro365

# ===========================================
# SUPABASE CONFIGURACIÓN (REQUERIDO)
# ===========================================
# Obtén estos valores en: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ===========================================
# OPENAI CONFIGURACIÓN (PARA WHISPER)
# ===========================================
# Obtén tu API key en: https://platform.openai.com/api-keys
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Configuración de Whisper
NEXT_PUBLIC_WHISPER_MODEL=whisper-1
NEXT_PUBLIC_WHISPER_LANGUAGE=es
NEXT_PUBLIC_WHISPER_TEMPERATURE=0.0

# ===========================================
# N8N CONFIGURACIÓN (PARA FUTURAS FASES)
# ===========================================
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voz-gasto

# ===========================================
# CONFIGURACIÓN DE LA APLICACIÓN
# ===========================================
NEXT_PUBLIC_APP_NAME=Ahorro365
NEXT_PUBLIC_APP_VERSION=0.0.1
EOF
    echo "✅ Archivo .env.local creado"
else
    echo "⚠️ El archivo .env.local ya existe"
fi

echo ""
echo "🔑 CONFIGURACIÓN REQUERIDA:"
echo ""
echo "1️⃣ SUPABASE (REQUERIDO):"
echo "   - Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api"
echo "   - Copia Project URL → NEXT_PUBLIC_SUPABASE_URL"
echo "   - Copia anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "2️⃣ OPENAI (PARA TRANSCRIPCIÓN):"
echo "   - Ve a: https://platform.openai.com/api-keys"
echo "   - Crea una nueva API key"
echo "   - Copia la key → NEXT_PUBLIC_OPENAI_API_KEY"
echo ""
echo "3️⃣ REINICIA EL SERVIDOR:"
echo "   - Ejecuta: npm run dev"
echo ""
echo "💰 Costos estimados OpenAI: ~$0.006 por minuto de audio"
echo "📋 Ver archivo CONFIGURACION_ENV.md para más detalles"
