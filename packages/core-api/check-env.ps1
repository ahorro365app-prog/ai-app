# Script para verificar y configurar variables de entorno para Core API
# Uso: .\check-env.ps1

Write-Host "`n🔍 Verificando variables de entorno para Core API...`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot "..\..\.env.local"
$missingVars = @()
$requiredVars = @{
    # Supabase (Críticas)
    "NEXT_PUBLIC_SUPABASE_URL" = "URL de tu proyecto Supabase"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "Anon key de Supabase"
    "SUPABASE_SERVICE_ROLE_KEY" = "Service role key de Supabase"
    
    # WhatsApp Cloud API (del chat anterior)
    "WHATSAPP_ACCESS_TOKEN" = "Token de acceso de Meta (EAA...)"
    "WHATSAPP_PHONE_NUMBER_ID" = "796240860248587 (del chat)"
    "WHATSAPP_BUSINESS_ACCOUNT_ID" = "766200063108245 (del chat)"
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN" = "7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876 (del chat)"
    "WHATSAPP_API_VERSION" = "v22.0 o v24.0"
    
    # Groq (para procesamiento de audio y LLM)
    "GROQ_API_KEY" = "API key de Groq (o NEXT_PUBLIC_GROQ_API_KEY)"
    
    # Upstash Redis (para rate limiting - opcional pero recomendado)
    "UPSTASH_REDIS_REST_URL" = "URL de Upstash Redis (opcional)"
    "UPSTASH_REDIS_REST_TOKEN" = "Token de Upstash Redis (opcional)"
}

Write-Host "📂 Buscando .env.local en: $envFile`n" -ForegroundColor Yellow

if (Test-Path $envFile) {
    Write-Host "✅ .env.local encontrado`n" -ForegroundColor Green
    
    # Leer variables existentes
    $envContent = Get-Content $envFile -Raw
    $existingVars = @{}
    
    foreach ($line in (Get-Content $envFile)) {
        if ($line -match '^\s*([^#=]+)=(.*)$') {
            $varName = $matches[1].Trim()
            $varValue = $matches[2].Trim()
            $existingVars[$varName] = $varValue
        }
    }
    
    # Verificar variables requeridas
    Write-Host "🔍 Verificando variables requeridas...`n" -ForegroundColor Cyan
    
    foreach ($var in $requiredVars.Keys) {
        if ($existingVars.ContainsKey($var) -and $existingVars[$var] -ne "" -and $existingVars[$var] -notmatch "^(your_|placeholder|change_)") {
            Write-Host "  ✅ $var" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var - $($requiredVars[$var])" -ForegroundColor Red
            $missingVars += $var
        }
    }
    
    Write-Host ""
    
    if ($missingVars.Count -eq 0) {
        Write-Host "✅ Todas las variables requeridas están configuradas!`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Faltan $($missingVars.Count) variables.`n" -ForegroundColor Yellow
        Write-Host "💡 Variables de WhatsApp del chat anterior:" -ForegroundColor Cyan
        Write-Host "   WHATSAPP_PHONE_NUMBER_ID=796240860248587" -ForegroundColor Gray
        Write-Host "   WHATSAPP_BUSINESS_ACCOUNT_ID=766200063108245" -ForegroundColor Gray
        Write-Host "   WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876`n" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ .env.local NO encontrado`n" -ForegroundColor Red
    Write-Host "💡 Necesitas crear .env.local en la raíz del proyecto con estas variables:`n" -ForegroundColor Yellow
    
    Write-Host "# Supabase" -ForegroundColor Cyan
    Write-Host "NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase" -ForegroundColor Gray
    Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key" -ForegroundColor Gray
    Write-Host "SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key`n" -ForegroundColor Gray
    
    Write-Host "# WhatsApp Cloud API (del chat anterior)" -ForegroundColor Cyan
    Write-Host "WHATSAPP_ACCESS_TOKEN=EAA..." -ForegroundColor Gray
    Write-Host "WHATSAPP_PHONE_NUMBER_ID=796240860248587" -ForegroundColor Gray
    Write-Host "WHATSAPP_BUSINESS_ACCOUNT_ID=766200063108245" -ForegroundColor Gray
    Write-Host "WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876" -ForegroundColor Gray
    Write-Host "WHATSAPP_API_VERSION=v22.0`n" -ForegroundColor Gray
    
    Write-Host "# Groq" -ForegroundColor Cyan
    Write-Host "GROQ_API_KEY=tu_groq_api_key`n" -ForegroundColor Gray
    
    Write-Host "# Upstash Redis (opcional)" -ForegroundColor Cyan
    Write-Host "UPSTASH_REDIS_REST_URL=tu_redis_url" -ForegroundColor Gray
    Write-Host "UPSTASH_REDIS_REST_TOKEN=tu_redis_token`n" -ForegroundColor Gray
}

Write-Host "─" * 60 -ForegroundColor Gray
Write-Host ""

