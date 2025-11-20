# Script para iniciar desarrollo local de WhatsApp Webhook con ngrok
# Uso: .\scripts\start-whatsapp-webhook-local.ps1

Write-Host "`n🚀 Iniciando desarrollo local de WhatsApp Webhook`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

# Verificar que ngrok esté instalado
Write-Host "🔍 Verificando ngrok..." -ForegroundColor Cyan
$ngrokPath = "$env:LOCALAPPDATA\ngrok\ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    $ngrokPath = "ngrok.exe"
}

try {
    $ngrokVersion = & $ngrokPath version 2>&1
    Write-Host "   ✅ ngrok encontrado: $ngrokVersion" -ForegroundColor Green
    $script:ngrokExe = $ngrokPath
} catch {
    Write-Host "   ❌ ngrok no encontrado" -ForegroundColor Red
    Write-Host "`n   📥 Instala ngrok desde: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   O con Chocolatey: choco install ngrok`n" -ForegroundColor Yellow
    exit 1
}

# Verificar autenticación de ngrok
Write-Host "`n🔐 Verificando autenticación de ngrok..." -ForegroundColor Cyan
$authCheck = & $ngrokPath config check 2>&1
if ($LASTEXITCODE -ne 0 -or $authCheck -like "*ERROR*") {
    Write-Host "   ⚠️  ngrok no está autenticado" -ForegroundColor Yellow
    Write-Host "`n   📋 Para autenticar ngrok:" -ForegroundColor Cyan
    Write-Host "   1. Ve a: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "   2. Inicia sesión o crea una cuenta (gratis)" -ForegroundColor White
    Write-Host "   3. Copia tu authtoken" -ForegroundColor White
    Write-Host "   4. Ejecuta este comando:" -ForegroundColor White
    Write-Host "      & `"$ngrokPath`" config add-authtoken TU_AUTH_TOKEN" -ForegroundColor Gray
    Write-Host "`n   ⏸️  Esperando autenticación..." -ForegroundColor Yellow
    Write-Host "   (Presiona Enter cuando hayas autenticado ngrok, o Ctrl+C para cancelar)" -ForegroundColor Gray
    Read-Host
}

# Verificar que estemos en el directorio correcto
if (-not (Test-Path "packages/core-api")) {
    Write-Host "❌ Error: No se encuentra packages/core-api" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto`n" -ForegroundColor Yellow
    exit 1
}

# Verificar .env.local
$envFile = "packages/core-api/.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  No se encuentra .env.local" -ForegroundColor Yellow
    Write-Host "   Creando archivo de ejemplo...`n" -ForegroundColor Yellow
    
    $envContent = @"
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=TU_TOKEN_AQUI
WHATSAPP_PHONE_NUMBER_ID=796240860248587
WHATSAPP_BUSINESS_ACCOUNT_ID=766200063108245
WHATSAPP_WEBHOOK_VERIFY_TOKEN=7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876
WHATSAPP_API_VERSION=v22.0
"@
    
    Set-Content -Path $envFile -Value $envContent
    Write-Host "   ✅ Archivo creado. Edita $envFile con tus valores`n" -ForegroundColor Green
}

# Iniciar Next.js en una nueva ventana
Write-Host "🌐 Iniciando Next.js en puerto 3002...`n" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd packages/core-api; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Iniciar ngrok en una nueva ventana
Write-Host "🔗 Iniciando ngrok...`n" -ForegroundColor Cyan
$ngrokCommand = "& `"$ngrokExe`" http 3002"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $ngrokCommand -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "`n✅ Servicios iniciados`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

Write-Host "📋 PRÓXIMOS PASOS:`n" -ForegroundColor Yellow
Write-Host "1. Espera a que ngrok muestre la URL (ej: https://abc123.ngrok-free.app)" -ForegroundColor White
Write-Host "2. Copia la URL HTTPS completa" -ForegroundColor White
Write-Host "3. Ve a Meta Developer Console → WhatsApp → Configuration → Webhooks" -ForegroundColor White
Write-Host "4. Configura la URL de callback:" -ForegroundColor White
Write-Host "   https://TU_URL_NGROK.ngrok-free.app/api/webhooks/whatsapp" -ForegroundColor Gray
Write-Host "5. Token de verificación:" -ForegroundColor White
Write-Host "   7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876" -ForegroundColor Gray
Write-Host "6. Haz clic en 'Verificar y guardar'`n" -ForegroundColor White

Write-Host "💡 TIPS:`n" -ForegroundColor Cyan
Write-Host "   • Los logs de Next.js aparecerán en la primera ventana" -ForegroundColor Gray
Write-Host "   • Los logs de ngrok aparecerán en la segunda ventana" -ForegroundColor Gray
Write-Host "   • Para detener, cierra las ventanas de PowerShell`n" -ForegroundColor Gray

Write-Host "Presiona cualquier tecla para salir (los servicios seguirán ejecutándose)..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

