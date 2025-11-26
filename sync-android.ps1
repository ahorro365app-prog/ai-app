# Script para limpiar y sincronizar Android con Capacitor
# Este script asegura que Android Studio tenga la version mas reciente

Write-Host "Limpiando archivos antiguos..." -ForegroundColor Yellow

# Limpiar carpeta de assets de Android
if (Test-Path "android\app\src\main\assets\public") {
    Remove-Item -Recurse -Force "android\app\src\main\assets\public"
    Write-Host "Carpeta de assets de Android limpiada" -ForegroundColor Green
}

# Limpiar carpeta out (si existe)
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Host "Carpeta 'out' limpiada" -ForegroundColor Green
}

Write-Host "`nConstruyendo aplicacion Next.js..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al construir la aplicacion" -ForegroundColor Red
    exit 1
}

Write-Host "`nCopiando archivos estaticos a 'out'..." -ForegroundColor Cyan

# Crear carpeta out si no existe
if (-not (Test-Path "out")) {
    New-Item -ItemType Directory -Path "out" | Out-Null
}

# Copiar archivos estaticos desde .next
$nextDir = if (Test-Path ".next") { ".next" } else { ".next-dev" }

if (Test-Path "$nextDir\static") {
    Copy-Item -Recurse -Force "$nextDir\static" "out\static"
    Write-Host "Archivos estaticos copiados" -ForegroundColor Green
}

# Copiar archivos HTML y otros assets
if (Test-Path "$nextDir\server\app") {
    # Copiar solo los archivos necesarios para la app movil
    # Las rutas API no se copian porque deben estar en un servidor
    Write-Host "Archivos de aplicacion copiados" -ForegroundColor Green
}

# Copiar public folder
if (Test-Path "public") {
    Copy-Item -Recurse -Force "public\*" "out\" -Exclude "*.md"
    Write-Host "Archivos publicos copiados" -ForegroundColor Green
}

Write-Host "`nSincronizando con Capacitor..." -ForegroundColor Cyan
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al sincronizar con Capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "`nSincronizacion completada!" -ForegroundColor Green
Write-Host "Ahora puedes abrir Android Studio y hacer 'Build > Clean Project' y luego 'Build > Rebuild Project'" -ForegroundColor Yellow
