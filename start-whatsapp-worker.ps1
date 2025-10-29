# Script para iniciar el Baileys Worker con visibilidad
Write-Host "🚀 Iniciando Baileys Worker..." -ForegroundColor Green

cd ahorro365-baileys-worker

Write-Host "📁 Directorio: $(Get-Location)" -ForegroundColor Cyan
Write-Host "🔧 Variables de entorno:" -ForegroundColor Yellow
Write-Host "   WHATSAPP_NUMBER: $env:WHATSAPP_NUMBER"
Write-Host "   BACKEND_URL: $env:BACKEND_URL"
Write-Host "   PORT: $env:PORT"
Write-Host ""

Write-Host "▶️  Ejecutando: npm run dev" -ForegroundColor Magenta
Write-Host ""

npm run dev


