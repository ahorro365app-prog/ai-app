# Script para probar manualmente la verificación del webhook
# Simula la petición GET que Meta envía

param(
    [string]$BaseUrl = "http://localhost:3002",
    [string]$VerifyToken = "7edf98ac6d544020a4c49b6ff9ed28893ad9464e401ba8658b5ddd860a4ab876",
    [string]$Challenge = "test-challenge-12345"
)

Write-Host "`n🧪 Probando verificación de webhook`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

$url = "$BaseUrl/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=$VerifyToken&hub.challenge=$Challenge"

Write-Host "📡 URL de prueba:" -ForegroundColor Yellow
Write-Host "   $url`n" -ForegroundColor Gray

Write-Host "🔄 Enviando petición GET...`n" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
    Write-Host "   Body: $($response.Content)" -ForegroundColor White
    
    if ($response.StatusCode -eq 200 -and $response.Content -eq $Challenge) {
        Write-Host "`n🎉 ¡Webhook verificado correctamente!`n" -ForegroundColor Green
        Write-Host "   El endpoint está funcionando y debería funcionar con Meta.`n" -ForegroundColor Gray
    } else {
        Write-Host "`n⚠️  Respuesta inesperada" -ForegroundColor Yellow
        Write-Host "   Esperado: Status 200, Body = '$Challenge'" -ForegroundColor Gray
        Write-Host "   Recibido: Status $($response.StatusCode), Body = '$($response.Content)'`n" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error al hacer la petición:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        Write-Host "   Response Body: $responseBody`n" -ForegroundColor Yellow
    }
    
    Write-Host "💡 Verifica que:" -ForegroundColor Cyan
    Write-Host "   • El servidor Next.js esté corriendo en $BaseUrl" -ForegroundColor Gray
    Write-Host "   • El endpoint /api/webhooks/whatsapp exista" -ForegroundColor Gray
    Write-Host "   • WHATSAPP_WEBHOOK_VERIFY_TOKEN esté configurado correctamente`n" -ForegroundColor Gray
}

Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

