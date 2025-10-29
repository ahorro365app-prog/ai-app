# Script para iniciar todos los servicios de Ahorro365

Write-Host "🚀 Iniciando servicios de Ahorro365..." -ForegroundColor Green
Write-Host ""

# 1. Baileys Worker (Puerto 3003)
Write-Host "📱 Iniciando Baileys Worker en puerto 3003..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ahorro365-baileys-worker; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# 2. Admin Dashboard (Puerto 3001)
Write-Host "🎛️  Iniciando Admin Dashboard en puerto 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin-dashboard; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. App Principal (Puerto 3000)
Write-Host "🌐 Iniciando App Principal en puerto 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Todos los servicios están iniciando..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs de los servicios:" -ForegroundColor Yellow
Write-Host "   - App Principal:     http://localhost:3000" -ForegroundColor White
Write-Host "   - Admin Dashboard:   http://localhost:3001" -ForegroundColor White
Write-Host "   - Baileys Worker:    http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "💡 Puedes verificar el estado en:" -ForegroundColor Yellow
Write-Host "   - Baileys QR:        http://localhost:3003/qr" -ForegroundColor White
Write-Host "   - Baileys Health:    http://localhost:3003/health" -ForegroundColor White
Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


