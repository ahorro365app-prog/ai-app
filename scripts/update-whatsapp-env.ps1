# Script para actualizar variables de WhatsApp en .env.local
# Uso: .\scripts\update-whatsapp-env.ps1 -Token "tu_token" -PhoneNumberId "tu_id"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$PhoneNumberId,
    
    [string]$ApiVersion = "v24.0"
)

$envFile = ".env.local"

Write-Host ""
Write-Host "Actualizando variables de WhatsApp en .env.local..." -ForegroundColor Cyan
Write-Host ""

# Leer contenido actual o crear archivo nuevo
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        $content = ""
    }
} else {
    $content = ""
    Write-Host "Creando archivo .env.local..." -ForegroundColor Yellow
}

# Normalizar valores (remover espacios y comillas)
$Token = $Token.Trim().Trim('"').Trim("'")
$PhoneNumberId = $PhoneNumberId.Trim().Trim('"').Trim("'")
$ApiVersion = $ApiVersion.Trim().Trim('"').Trim("'")

# Verificar que los valores no esten vacios
if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "ERROR: Token no puede estar vacio" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($PhoneNumberId)) {
    Write-Host "ERROR: Phone Number ID no puede estar vacio" -ForegroundColor Red
    exit 1
}

# Agregar seccion de WhatsApp si no existe
if ($content -notmatch "#.*WHATSAPP|#.*WhatsApp") {
    if ($content -ne "" -and $content -notmatch "\n\s*$") {
        $content += "`n"
    }
    $content += "# ===========================================`n"
    $content += "# WHATSAPP CLOUD API CONFIGURACION`n"
    $content += "# ===========================================`n"
    $content += "`n"
}

# Actualizar o agregar WHATSAPP_ACCESS_TOKEN
if ($content -match "(?m)^\s*WHATSAPP_ACCESS_TOKEN\s*=") {
    $content = $content -replace "(?m)^\s*WHATSAPP_ACCESS_TOKEN\s*=.*", "WHATSAPP_ACCESS_TOKEN=$Token"
    Write-Host "OK: WHATSAPP_ACCESS_TOKEN actualizado" -ForegroundColor Green
} else {
    $content += "WHATSAPP_ACCESS_TOKEN=$Token`n"
    Write-Host "OK: WHATSAPP_ACCESS_TOKEN agregado" -ForegroundColor Green
}

# Actualizar o agregar WHATSAPP_PHONE_NUMBER_ID
if ($content -match "(?m)^\s*WHATSAPP_PHONE_NUMBER_ID\s*=") {
    $content = $content -replace "(?m)^\s*WHATSAPP_PHONE_NUMBER_ID\s*=.*", "WHATSAPP_PHONE_NUMBER_ID=$PhoneNumberId"
    Write-Host "OK: WHATSAPP_PHONE_NUMBER_ID actualizado" -ForegroundColor Green
} else {
    $content += "WHATSAPP_PHONE_NUMBER_ID=$PhoneNumberId`n"
    Write-Host "OK: WHATSAPP_PHONE_NUMBER_ID agregado" -ForegroundColor Green
}

# Actualizar o agregar WHATSAPP_API_VERSION
if ($content -match "(?m)^\s*WHATSAPP_API_VERSION\s*=") {
    $content = $content -replace "(?m)^\s*WHATSAPP_API_VERSION\s*=.*", "WHATSAPP_API_VERSION=$ApiVersion"
    Write-Host "OK: WHATSAPP_API_VERSION actualizado" -ForegroundColor Green
} else {
    $content += "WHATSAPP_API_VERSION=$ApiVersion`n"
    Write-Host "OK: WHATSAPP_API_VERSION agregado" -ForegroundColor Green
}

# Guardar archivo
try {
    $content | Set-Content $envFile -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "OK: Archivo .env.local actualizado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Valores configurados:" -ForegroundColor Cyan
    Write-Host "  WHATSAPP_ACCESS_TOKEN: $($Token.Substring(0, [Math]::Min(20, $Token.Length)))..." -ForegroundColor Gray
    Write-Host "  WHATSAPP_PHONE_NUMBER_ID: $PhoneNumberId" -ForegroundColor Gray
    Write-Host "  WHATSAPP_API_VERSION: $ApiVersion" -ForegroundColor Gray
    Write-Host ""
    Write-Host "IMPORTANTE: Reinicia el servidor (Ctrl+C y luego npm run dev) para que cargue las nuevas variables" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR: No se pudo guardar el archivo: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

