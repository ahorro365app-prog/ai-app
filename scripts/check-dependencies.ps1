# Script PowerShell para verificar seguridad de dependencias
# Ejecuta npm audit y verifica vulnerabilidades

Write-Host "🔍 Verificando seguridad de dependencias..." -ForegroundColor Cyan
Write-Host ""

$errors = 0

# Función para verificar dependencias en un directorio
function Check-Dependencies {
    param(
        [string]$Dir,
        [string]$Name
    )
    
    Write-Host "📦 Verificando $Name..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$Dir/package.json")) {
        Write-Host "⚠️  No se encontró package.json en $Dir" -ForegroundColor Yellow
        return 0
    }
    
    Push-Location $Dir
    
    try {
        # Ejecutar npm audit
        $auditResult = npm audit --audit-level=moderate 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Name`: Sin vulnerabilidades críticas o moderadas" -ForegroundColor Green
            return 0
        } else {
            Write-Host "❌ $Name`: Se encontraron vulnerabilidades" -ForegroundColor Red
            Write-Host ""
            Write-Host "Ejecuta 'npm audit fix' para intentar corregir automáticamente" -ForegroundColor Yellow
            Write-Host "O 'npm audit' para ver detalles" -ForegroundColor Yellow
            return 1
        }
    } finally {
        Pop-Location
    }
}

# Verificar cada componente
if (Test-Path "package.json") {
    $result = Check-Dependencies "." "App Principal"
    if ($result -ne 0) { $errors++ }
}

if (Test-Path "admin-dashboard") {
    $result = Check-Dependencies "admin-dashboard" "Admin Dashboard"
    if ($result -ne 0) { $errors++ }
}

if (Test-Path "packages/core-api") {
    $result = Check-Dependencies "packages/core-api" "Core API"
    if ($result -ne 0) { $errors++ }
}

Write-Host ""
if ($errors -eq 0) {
    Write-Host "✅ Todas las dependencias están seguras" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Se encontraron vulnerabilidades en $errors componente(s)" -ForegroundColor Red
    exit 1
}


