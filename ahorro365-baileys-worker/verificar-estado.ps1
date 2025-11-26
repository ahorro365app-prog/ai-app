# Script para verificar y gestionar el estado del Worker de WhatsApp en Fly.io

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("status", "stop", "start", "restart", "logs")]
    [string]$Accion = "status"
)

$APP_NAME = "ahorro365-baileys-worker"
$WORKER_URL = "https://ahorro365-baileys-worker.fly.dev"

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "📱 WhatsApp Worker - Fly.io" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

# Verificar si flyctl está instalado
$flyctlPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"
if (-not (Test-Path $flyctlPath)) {
    Write-Host "❌ flyctl no encontrado en: $flyctlPath" -ForegroundColor Red
    Write-Host "`n💡 Instalar flyctl:" -ForegroundColor Yellow
    Write-Host "   pwsh -Command `"iwr https://fly.io/install.ps1 -useb | iex`"`n" -ForegroundColor White
    exit 1
}

switch ($Accion) {
    "status" {
        Write-Host "🔍 Verificando estado del Worker...`n" -ForegroundColor Cyan
        
        # 1. Verificar endpoint de health
        Write-Host "1️⃣ Verificando endpoint /health..." -ForegroundColor Yellow
        try {
            $healthResponse = Invoke-WebRequest -Uri "$WORKER_URL/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
            if ($healthResponse.StatusCode -eq 200) {
                $healthData = $healthResponse.Content | ConvertFrom-Json
                Write-Host "   ✅ Worker responde correctamente" -ForegroundColor Green
                Write-Host "   📊 Estado: $($healthData.status)" -ForegroundColor White
                Write-Host "   🕐 Timestamp: $($healthData.timestamp)`n" -ForegroundColor White
            }
        } catch {
            Write-Host "   ❌ Worker NO responde (posiblemente detenido)" -ForegroundColor Red
            Write-Host "   💡 Error: $($_.Exception.Message)`n" -ForegroundColor Gray
        }
        
        # 2. Verificar endpoint de status
        Write-Host "2️⃣ Verificando conexión WhatsApp /status..." -ForegroundColor Yellow
        try {
            $statusResponse = Invoke-WebRequest -Uri "$WORKER_URL/status" -Method GET -TimeoutSec 10 -ErrorAction Stop
            if ($statusResponse.StatusCode -eq 200) {
                $statusData = $statusResponse.Content | ConvertFrom-Json
                Write-Host "   ✅ Estado de WhatsApp obtenido" -ForegroundColor Green
                Write-Host "   🔌 Conectado: $($statusData.connected)" -ForegroundColor $(if ($statusData.connected) { "Green" } else { "Red" })
                Write-Host "   ⏱️  Última sincronización: $($statusData.lastSync)" -ForegroundColor White
                Write-Host "   📈 Uptime: $($statusData.uptime)%`n" -ForegroundColor White
            }
        } catch {
            Write-Host "   ⚠️  No se pudo obtener estado de WhatsApp" -ForegroundColor Yellow
            Write-Host "   💡 Error: $($_.Exception.Message)`n" -ForegroundColor Gray
        }
        
        # 3. Verificar estado de máquinas en Fly.io
        Write-Host "3️⃣ Verificando estado de máquinas en Fly.io..." -ForegroundColor Yellow
        try {
            $machinesOutput = & $flyctlPath machines list -a $APP_NAME 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ Comando ejecutado correctamente" -ForegroundColor Green
                Write-Host "`n   📋 Estado de máquinas:" -ForegroundColor Cyan
                Write-Host $machinesOutput -ForegroundColor White
            } else {
                Write-Host "   ⚠️  Error al listar máquinas" -ForegroundColor Yellow
                Write-Host $machinesOutput -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error ejecutando flyctl: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    }
    
    "stop" {
        Write-Host "⏸️  Deteniendo Worker...`n" -ForegroundColor Yellow
        
        # Obtener Machine ID
        Write-Host "1️⃣ Obteniendo Machine ID..." -ForegroundColor Cyan
        try {
            $machinesOutput = & $flyctlPath machines list -a $APP_NAME 2>&1
            if ($LASTEXITCODE -eq 0) {
                # Intentar extraer Machine ID (primera columna después de headers)
                $lines = $machinesOutput -split "`n"
                $machineId = $null
                foreach ($line in $lines) {
                    if ($line -match '^(\w+)\s+') {
                        $machineId = $matches[1]
                        break
                    }
                }
                
                if ($machineId) {
                    Write-Host "   ✅ Machine ID encontrado: $machineId" -ForegroundColor Green
                    Write-Host "`n2️⃣ Deteniendo máquina..." -ForegroundColor Cyan
                    
                    $stopOutput = & $flyctlPath machines stop $machineId -a $APP_NAME 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "   ✅ Worker detenido correctamente" -ForegroundColor Green
                    } else {
                        Write-Host "   ⚠️  Error al detener: $stopOutput" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ⚠️  No se pudo extraer Machine ID" -ForegroundColor Yellow
                    Write-Host "   💡 Ejecuta manualmente:" -ForegroundColor White
                    Write-Host "      flyctl machines list -a $APP_NAME" -ForegroundColor Gray
                    Write-Host "      flyctl machines stop <MACHINE_ID> -a $APP_NAME" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ❌ Error al listar máquinas" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    }
    
    "start" {
        Write-Host "▶️  Iniciando Worker...`n" -ForegroundColor Green
        
        # Obtener Machine ID
        Write-Host "1️⃣ Obteniendo Machine ID..." -ForegroundColor Cyan
        try {
            $machinesOutput = & $flyctlPath machines list -a $APP_NAME 2>&1
            if ($LASTEXITCODE -eq 0) {
                $lines = $machinesOutput -split "`n"
                $machineId = $null
                foreach ($line in $lines) {
                    if ($line -match '^(\w+)\s+') {
                        $machineId = $matches[1]
                        break
                    }
                }
                
                if ($machineId) {
                    Write-Host "   ✅ Machine ID encontrado: $machineId" -ForegroundColor Green
                    Write-Host "`n2️⃣ Iniciando máquina..." -ForegroundColor Cyan
                    
                    $startOutput = & $flyctlPath machines start $machineId -a $APP_NAME 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "   ✅ Worker iniciado correctamente" -ForegroundColor Green
                        Write-Host "   ⏳ Espera 10-20 segundos para que se inicie completamente`n" -ForegroundColor Yellow
                    } else {
                        Write-Host "   ⚠️  Error al iniciar: $startOutput" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ⚠️  No se pudo extraer Machine ID" -ForegroundColor Yellow
                    Write-Host "   💡 Ejecuta manualmente:" -ForegroundColor White
                    Write-Host "      flyctl machines list -a $APP_NAME" -ForegroundColor Gray
                    Write-Host "      flyctl machines start <MACHINE_ID> -a $APP_NAME" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ❌ Error al listar máquinas" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    }
    
    "restart" {
        Write-Host "🔄 Reiniciando Worker...`n" -ForegroundColor Cyan
        
        # Obtener Machine ID
        Write-Host "1️⃣ Obteniendo Machine ID..." -ForegroundColor Cyan
        try {
            $machinesOutput = & $flyctlPath machines list -a $APP_NAME 2>&1
            if ($LASTEXITCODE -eq 0) {
                $lines = $machinesOutput -split "`n"
                $machineId = $null
                foreach ($line in $lines) {
                    if ($line -match '^(\w+)\s+') {
                        $machineId = $matches[1]
                        break
                    }
                }
                
                if ($machineId) {
                    Write-Host "   ✅ Machine ID encontrado: $machineId" -ForegroundColor Green
                    Write-Host "`n2️⃣ Reiniciando máquina..." -ForegroundColor Cyan
                    
                    $restartOutput = & $flyctlPath machines restart $machineId -a $APP_NAME 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "   ✅ Worker reiniciado correctamente" -ForegroundColor Green
                        Write-Host "   ⏳ Espera 10-20 segundos para que se reinicie completamente`n" -ForegroundColor Yellow
                    } else {
                        Write-Host "   ⚠️  Error al reiniciar: $restartOutput" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "   ⚠️  No se pudo extraer Machine ID" -ForegroundColor Yellow
                    Write-Host "   💡 Ejecuta manualmente:" -ForegroundColor White
                    Write-Host "      flyctl machines list -a $APP_NAME" -ForegroundColor Gray
                    Write-Host "      flyctl machines restart <MACHINE_ID> -a $APP_NAME" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ❌ Error al listar máquinas" -ForegroundColor Red
            }
        } catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    }
    
    "logs" {
        Write-Host "📋 Obteniendo logs del Worker...`n" -ForegroundColor Cyan
        
        try {
            Write-Host "💡 Presiona Ctrl+C para detener los logs`n" -ForegroundColor Yellow
            & $flyctlPath logs -a $APP_NAME
        } catch {
            Write-Host "   ❌ Error obteniendo logs: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`n═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray
    }
}

Write-Host "💡 Uso del script:" -ForegroundColor Yellow
Write-Host "   .\verificar-estado.ps1 status    # Ver estado actual" -ForegroundColor White
Write-Host "   .\verificar-estado.ps1 stop      # Detener worker" -ForegroundColor White
Write-Host "   .\verificar-estado.ps1 start     # Iniciar worker" -ForegroundColor White
Write-Host "   .\verificar-estado.ps1 restart   # Reiniciar worker" -ForegroundColor White
Write-Host "   .\verificar-estado.ps1 logs      # Ver logs en tiempo real`n" -ForegroundColor White

