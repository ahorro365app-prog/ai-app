# Script PowerShell para restaurar la carpeta api después del build
# Restaura src/app/_api/ a src/app/api/

Write-Host ""
Write-Host "🔄 Restaurando carpeta api después del build..." -ForegroundColor Yellow
Write-Host ""

$rootDir = Get-Location
$apiDir = Join-Path $rootDir "src\app\api"
$apiDirRenamed = Join-Path $rootDir "src\app\_api"

# Verificar si existe la carpeta renombrada
if (Test-Path $apiDirRenamed) {
    Write-Host "📁 Restaurando src/app/_api/ a src/app/api/..." -ForegroundColor Cyan
    
    # Si ya existe api/, eliminarla primero
    if (Test-Path $apiDir) {
        Write-Host "⚠️  Carpeta api/ ya existe, eliminando..." -ForegroundColor Yellow
        Remove-Item -Path $apiDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Renombrar de vuelta
    try {
        Rename-Item -Path $apiDirRenamed -NewName "api" -Force
        Write-Host "✅ Carpeta restaurada correctamente" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Error restaurando carpeta: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Intenta restaurar manualmente: Rename-Item src/app/_api api" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "⚠️  Carpeta src/app/_api/ no encontrada (ya restaurada?)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Restauración completada" -ForegroundColor Green
Write-Host ""

