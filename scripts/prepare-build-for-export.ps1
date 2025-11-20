# Script PowerShell para preparar el build con output: 'export'
# Renombra temporalmente src/app/api/ a src/app/_api/ para que Next.js lo ignore

Write-Host ""
Write-Host "🔧 Preparando build para export estático..." -ForegroundColor Yellow
Write-Host ""

$rootDir = Get-Location
$apiDir = Join-Path $rootDir "src\app\api"
$apiDirRenamed = Join-Path $rootDir "src\app\_api"

# Verificar si existe la carpeta api
if (Test-Path $apiDir) {
    Write-Host "📁 Renombrando src/app/api/ a src/app/_api/ (temporal)..." -ForegroundColor Cyan
    
    # Si ya existe _api, eliminarla primero
    if (Test-Path $apiDirRenamed) {
        Write-Host "⚠️  Carpeta _api ya existe, eliminando..." -ForegroundColor Yellow
        Remove-Item -Path $apiDirRenamed -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Renombrar la carpeta
    try {
        Rename-Item -Path $apiDir -NewName "_api" -Force
        Write-Host "✅ Carpeta renombrada correctamente" -ForegroundColor Green
        Write-Host "   Next.js ignorará _api/ durante el build" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "❌ Error renombrando carpeta: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Intenta cerrar cualquier proceso que tenga la carpeta abierta" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}
else {
    Write-Host "⚠️  Carpeta src/app/api/ no encontrada (ya renombrada?)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ Preparación completada. Puedes ejecutar: npm run build" -ForegroundColor Green
Write-Host ""
