# Script para verificar y forzar variables de WhatsApp en .env.local

Write-Host ""
Write-Host "Verificando variables de WhatsApp en .env.local..." -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: Archivo .env.local no encontrado" -ForegroundColor Red
    Write-Host "Creando archivo .env.local..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File -Force | Out-Null
}

# Leer contenido actual
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue

if ($null -eq $content) {
    $content = ""
}

# Variables requeridas
$requiredVars = @{
    "WHATSAPP_ACCESS_TOKEN" = "Tu token de acceso de WhatsApp"
    "WHATSAPP_PHONE_NUMBER_ID" = "ID del numero de telefono de WhatsApp"
    "WHATSAPP_API_VERSION" = "v24.0"
}

$missingVars = @()
$needsUpdate = $false
$newContent = $content

Write-Host "Variables a verificar:" -ForegroundColor Yellow
Write-Host ""

foreach ($varName in $requiredVars.Keys) {
    $varValue = $requiredVars[$varName]
    
    # Verificar si la variable existe
    if ($content -match "(?m)^\s*$varName\s*=") {
        $match = $content | Select-String -Pattern "(?m)^\s*$varName\s*=\s*(.+)$"
        if ($match) {
            $currentValue = $match.Matches.Groups[1].Value.Trim()
            
            if ($currentValue -eq "" -or $currentValue -match "^(your_|tu_|ejemplo|example|TU_VALOR)") {
                Write-Host "ADVERTENCIA: $varName existe pero tiene valor placeholder" -ForegroundColor Yellow
                Write-Host "   Valor actual: $currentValue" -ForegroundColor Gray
                $missingVars += $varName
                $needsUpdate = $true
            } else {
                Write-Host "OK: $varName esta configurado" -ForegroundColor Green
                $displayValue = if ($currentValue.Length -gt 20) { $currentValue.Substring(0, 20) + "..." } else { $currentValue }
                Write-Host "   Valor: $displayValue" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "ERROR: $varName NO esta configurado" -ForegroundColor Red
        $missingVars += $varName
        $needsUpdate = $true
    }
}

Write-Host ""

if ($needsUpdate) {
    Write-Host "Actualizando .env.local..." -ForegroundColor Cyan
    Write-Host ""
    
    # Agregar seccion de WhatsApp si no existe
    if ($content -notmatch "#.*WHATSAPP|#.*WhatsApp") {
        if ($content -ne "" -and $content -notmatch "\n\s*$") {
            $newContent += "`n"
        }
        $newContent += "# ===========================================`n"
        $newContent += "# WHATSAPP CLOUD API CONFIGURACION`n"
        $newContent += "# ===========================================`n"
        $newContent += "# Obten estos valores en: https://developers.facebook.com/apps`n"
        $newContent += "# 1. Ve a tu App > WhatsApp > API Setup`n"
        $newContent += "# 2. Copia Temporary access token o genera un token permanente`n"
        $newContent += "# 3. Copia Phone number ID`n"
        $newContent += "`n"
    }
    
    # Agregar o actualizar variables faltantes
    foreach ($varName in $missingVars) {
        $varDescription = $requiredVars[$varName]
        
        # Si la variable existe pero tiene placeholder, reemplazarla
        if ($newContent -match "(?m)^\s*$varName\s*=") {
            if ($varName -eq "WHATSAPP_API_VERSION") {
                $newContent = $newContent -replace "(?m)^\s*$varName\s*=.*", "$varName=$varDescription"
            } else {
                Write-Host "ADVERTENCIA: $varName existe pero necesita un valor real" -ForegroundColor Yellow
                Write-Host "   Por favor, edita .env.local manualmente y agrega tu valor para $varName" -ForegroundColor Gray
            }
        } else {
            # Agregar variable nueva
            if ($varName -eq "WHATSAPP_API_VERSION") {
                $newContent += "$varName=$varDescription`n"
            } else {
                $newContent += "# $varDescription`n"
                $newContent += "$varName=TU_VALOR_AQUI`n"
                $newContent += "`n"
            }
        }
    }
    
    # Guardar archivo
    try {
        $newContent | Set-Content $envFile -Encoding UTF8 -NoNewline
        Write-Host "OK: Archivo .env.local actualizado" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Error guardando archivo: $_" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "IMPORTANTE: Edita .env.local y reemplaza TU_VALOR_AQUI con tus valores reales:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($varName in $missingVars) {
        if ($varName -ne "WHATSAPP_API_VERSION") {
            Write-Host "   $varName" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Para obtener los valores:" -ForegroundColor Cyan
    Write-Host "   1. Ve a: https://developers.facebook.com/apps" -ForegroundColor White
    Write-Host "   2. Selecciona tu App" -ForegroundColor White
    Write-Host "   3. WhatsApp > API Setup" -ForegroundColor White
    Write-Host "   4. Copia Temporary access token o genera uno permanente" -ForegroundColor White
    Write-Host "   5. Copia Phone number ID" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "OK: Todas las variables de WhatsApp estan configuradas correctamente" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Verificando que el servidor puede leer las variables..." -ForegroundColor Cyan
Write-Host ""

# Verificar que las variables esten en el formato correcto
$envContent = Get-Content $envFile -Raw
$hasWhatsAppToken = $envContent -match "WHATSAPP_ACCESS_TOKEN\s*=\s*[^\s]+" -and $envContent -notmatch "WHATSAPP_ACCESS_TOKEN\s*=\s*(TU_VALOR|your_|ejemplo)"
$hasPhoneNumberId = $envContent -match "WHATSAPP_PHONE_NUMBER_ID\s*=\s*[^\s]+" -and $envContent -notmatch "WHATSAPP_PHONE_NUMBER_ID\s*=\s*(TU_VALOR|your_|ejemplo)"

if ($hasWhatsAppToken -and $hasPhoneNumberId) {
    Write-Host "OK: Variables configuradas correctamente" -ForegroundColor Green
    Write-Host "   Reinicia el servidor (Ctrl+C y luego npm run dev) para que cargue las nuevas variables" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "ADVERTENCIA: Algunas variables aun necesitan valores reales" -ForegroundColor Yellow
    Write-Host "   Edita .env.local y agrega tus valores antes de reiniciar el servidor" -ForegroundColor Yellow
    Write-Host ""
}
