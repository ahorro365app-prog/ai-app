# Script para autenticar ngrok
# Uso: .\scripts\setup-ngrok-auth.ps1

Write-Host "`n🔐 Configuración de Autenticación de ngrok`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

$ngrokPath = "$env:LOCALAPPDATA\ngrok\ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    $ngrokPath = "ngrok.exe"
}

Write-Host "📋 PASOS PARA OBTENER TU TOKEN:`n" -ForegroundColor Yellow
Write-Host "1. Abre tu navegador y ve a:" -ForegroundColor White
Write-Host "   https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Si no tienes cuenta:" -ForegroundColor White
Write-Host "   • Haz clic en 'Sign up' (es gratis)" -ForegroundColor Gray
Write-Host "   • Crea una cuenta con tu email" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Si ya tienes cuenta:" -ForegroundColor White
Write-Host "   • Inicia sesión" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Copia tu 'authtoken' (es una cadena larga que empieza con algo como '2...')`n" -ForegroundColor White

Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

$token = Read-Host "Pega tu authtoken aquí"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "`n❌ Token vacío. Saliendo...`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔐 Autenticando ngrok..." -ForegroundColor Cyan

try {
    $result = & $ngrokPath config add-authtoken $token 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ ngrok autenticado correctamente!`n" -ForegroundColor Green
        Write-Host "🚀 Ahora puedes ejecutar:" -ForegroundColor Yellow
        Write-Host "   .\scripts\start-whatsapp-webhook-local.ps1`n" -ForegroundColor White
    } else {
        Write-Host "❌ Error al autenticar:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error al autenticar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

