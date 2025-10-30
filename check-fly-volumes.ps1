Write-Host "📋 Verificando volumes en Fly.io..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Ejecuta en Git Bash:" -ForegroundColor Yellow
Write-Host "  flyctl volumes list -a ahorro365-baileys-worker" -ForegroundColor White
Write-Host ""
Write-Host "Ejecuta este comando para conectar por SSH:" -ForegroundColor Yellow
Write-Host "  flyctl ssh console -a ahorro365-baileys-worker" -ForegroundColor White
Write-Host ""
Write-Host "Dentro del SSH, ejecuta:" -ForegroundColor Cyan
Write-Host "  ls -la /app/auth_info/" -ForegroundColor White
Write-Host "  exit" -ForegroundColor White
Write-Host ""
Write-Host "Luego para copiar auth_info:" -ForegroundColor Yellow
Write-Host "  flyctl sftp shell -a ahorro365-baileys-worker" -ForegroundColor White
Write-Host ""
Write-Host "Dentro de SFTP:" -ForegroundColor Cyan
Write-Host "  put -r auth_info /app/auth_info" -ForegroundColor White
Write-Host "  exit" -ForegroundColor White

