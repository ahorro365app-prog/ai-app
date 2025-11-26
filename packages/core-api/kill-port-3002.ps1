# Script para detener el proceso que usa el puerto 3002
# Uso: .\kill-port-3002.ps1

Write-Host "`n🔍 Buscando proceso en puerto 3002...`n" -ForegroundColor Cyan

$port = 3002
$connections = netstat -ano | Select-String ":$port.*LISTENING"

if ($connections) {
    Write-Host "✅ Proceso encontrado usando el puerto $port:`n" -ForegroundColor Yellow
    
    foreach ($connection in $connections) {
        $parts = $connection -split '\s+'
        $pid = $parts[-1]
        
        if ($pid -match '^\d+$') {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  PID: $pid" -ForegroundColor Cyan
                Write-Host "  Nombre: $($process.ProcessName)" -ForegroundColor Cyan
                Write-Host "  Ruta: $($process.Path)" -ForegroundColor Gray
                Write-Host ""
                
                Write-Host "¿Deseas detener este proceso? (S/N): " -ForegroundColor Yellow -NoNewline
                $response = Read-Host
                
                if ($response -eq "S" -or $response -eq "s") {
                    try {
                        Stop-Process -Id $pid -Force
                        Write-Host "`n✅ Proceso $pid detenido correctamente`n" -ForegroundColor Green
                        Write-Host "💡 Ahora puedes ejecutar 'npm run dev' de nuevo`n" -ForegroundColor Cyan
                    } catch {
                        Write-Host "`n❌ Error al detener el proceso: $_`n" -ForegroundColor Red
                    }
                } else {
                    Write-Host "`n⚠️  Proceso no detenido. El puerto $port seguirá ocupado.`n" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    Write-Host "✅ No se encontró ningún proceso usando el puerto $port`n" -ForegroundColor Green
    Write-Host "💡 Puedes ejecutar 'npm run dev' ahora`n" -ForegroundColor Cyan
}

