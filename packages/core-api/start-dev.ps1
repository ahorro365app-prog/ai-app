# Script para iniciar Core API en desarrollo
# Uso: .\start-dev.ps1

Write-Host "`n🚀 Iniciando Ahorro365 Core API...`n" -ForegroundColor Green
Write-Host "📂 Directorio: $(Get-Location)`n" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    Write-Host "💡 Asegúrate de ejecutar este script desde packages/core-api`n" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias...`n" -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host ""
}

Write-Host "🌐 Servidor iniciará en: http://localhost:3002" -ForegroundColor Cyan
Write-Host "📡 Endpoint de prueba: http://localhost:3002/api/ping`n" -ForegroundColor Cyan
Write-Host "📝 Presiona Ctrl+C para detener el servidor`n" -ForegroundColor Gray
Write-Host "─" * 60 -ForegroundColor Gray
Write-Host ""

# Iniciar el servidor
npm run dev

