# Script para iniciar Core API en local (puerto 3002)
# Uso: .\start-core-api.ps1

Write-Host "`n🚀 Iniciando Ahorro365 Core API...`n" -ForegroundColor Cyan

# Cambiar al directorio del core-api
$coreApiPath = Join-Path $PSScriptRoot "packages\core-api"
if (-not (Test-Path $coreApiPath)) {
    Write-Host "❌ Error: No se encontró el directorio packages/core-api" -ForegroundColor Red
    exit 1
}

Set-Location $coreApiPath

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias...`n" -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
        exit 1
    }
}

# Verificar variables de entorno críticas
Write-Host "🔍 Verificando variables de entorno...`n" -ForegroundColor Yellow

$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not (Get-Item "Env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Variables de entorno faltantes:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host "`n💡 Asegúrate de tener un archivo .env.local en la raíz del proyecto con estas variables.`n" -ForegroundColor Cyan
    Write-Host "¿Deseas continuar de todas formas? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -ne "S" -and $response -ne "s") {
        Write-Host "`n❌ Cancelado por el usuario`n" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Variables de entorno críticas encontradas`n" -ForegroundColor Green
}

# Iniciar el servidor
Write-Host "🚀 Iniciando servidor en http://localhost:3002...`n" -ForegroundColor Green
Write-Host "📝 Presiona Ctrl+C para detener el servidor`n" -ForegroundColor Gray

npm run dev

