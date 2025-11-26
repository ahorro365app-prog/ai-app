# Script de Testing de Error Handling - Core API (PowerShell)
# Verifica que los endpoints manejan errores correctamente

# Colores para output
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$CYAN = "Cyan"
$GRAY = "Gray"

Write-Host "`n🧪 Testing de Error Handling - Core API`n" -ForegroundColor $CYAN

# Configuración
$API_URL = if ($env:NEXT_PUBLIC_API_URL) { $env:NEXT_PUBLIC_API_URL } else { "http://localhost:3000" }
$BASE_URL = "$API_URL/api"

# Contadores
$script:TESTS_PASSED = 0
$script:TESTS_FAILED = 0
$script:TOTAL_TESTS = 0

# Función para ejecutar test
function Run-Test {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null,
        [int]$ExpectedStatus,
        [string]$ExpectedMessage = $null
    )
    
    $script:TOTAL_TESTS++
    
    Write-Host "Test $($script:TOTAL_TESTS): $TestName" -ForegroundColor $YELLOW
    Write-Host "   Endpoint: $Method $Endpoint" -ForegroundColor $GRAY
    
    try {
        # Ejecutar request
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Data) {
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -Body $Data `
                -ErrorAction SilentlyContinue
        } else {
            $response = Invoke-WebRequest -Uri "$BASE_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -ErrorAction SilentlyContinue
        }
        
        $httpCode = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        # Verificar status code
        if ($httpCode -eq $ExpectedStatus) {
            Write-Host "   ✅ Status code correcto: $httpCode" -ForegroundColor $GREEN
            
            # Verificar mensaje (si se especificó)
            if ($ExpectedMessage) {
                if ($body.error -like "*$ExpectedMessage*" -or $body.message -like "*$ExpectedMessage*") {
                    Write-Host "   ✅ Mensaje encontrado: $ExpectedMessage" -ForegroundColor $GREEN
                    $script:TESTS_PASSED++
                } else {
                    Write-Host "   ❌ Mensaje no encontrado. Esperado: $ExpectedMessage" -ForegroundColor $RED
                    Write-Host "   Respuesta: $($body | ConvertTo-Json -Depth 3)" -ForegroundColor $GRAY
                    $script:TESTS_FAILED++
                }
            } else {
                $script:TESTS_PASSED++
            }
            
            # Verificar que NO expone detalles internos
            $bodyJson = $body | ConvertTo-Json -Depth 5
            if ($bodyJson -match "(stack|trace|at |Error:|P\d{4}|PGRST|relation|column|does not exist)") {
                Write-Host "   ⚠️  ADVERTENCIA: Posible exposición de detalles internos" -ForegroundColor $RED
                Write-Host "   Revisar: $bodyJson" -ForegroundColor $GRAY
            } else {
                Write-Host "   ✅ No expone detalles internos" -ForegroundColor $GREEN
            }
        } else {
            Write-Host "   ❌ Status code incorrecto. Esperado: $ExpectedStatus, Obtenido: $httpCode" -ForegroundColor $RED
            Write-Host "   Respuesta: $($body | ConvertTo-Json -Depth 3)" -ForegroundColor $GRAY
            $script:TESTS_FAILED++
        }
    } catch {
        $httpCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        if ($httpCode -eq $ExpectedStatus) {
            Write-Host "   ✅ Status code correcto: $httpCode" -ForegroundColor $GREEN
            $script:TESTS_PASSED++
        } else {
            Write-Host "   ❌ Status code incorrecto. Esperado: $ExpectedStatus, Obtenido: $httpCode" -ForegroundColor $RED
            if ($errorBody) {
                Write-Host "   Respuesta: $errorBody" -ForegroundColor $GRAY
            }
            $script:TESTS_FAILED++
        }
    }
    
    Write-Host ""
}

# Verificar que el servidor está corriendo
Write-Host "Verificando que el servidor está corriendo...`n" -ForegroundColor $CYAN
try {
    $healthCheck = Invoke-WebRequest -Uri "$BASE_URL/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Servidor conectado`n" -ForegroundColor $GREEN
} catch {
    Write-Host "⚠️  No se pudo conectar al servidor en $BASE_URL" -ForegroundColor $YELLOW
    Write-Host "   Asegúrate de que el servidor esté corriendo:" -ForegroundColor $GRAY
    Write-Host "   cd packages/core-api && npm run dev" -ForegroundColor $GRAY
    Write-Host ""
    Write-Host "   O configura NEXT_PUBLIC_API_URL:" -ForegroundColor $GRAY
    Write-Host "   `$env:NEXT_PUBLIC_API_URL='http://localhost:3000'" -ForegroundColor $GRAY
    Write-Host ""
    exit 1
}

# Tests de Validación (400)
Write-Host "📋 Tests de Validación (400 Bad Request)`n" -ForegroundColor $CYAN

Run-Test `
    -TestName "Validación: Token FCM requerido" `
    -Method "POST" `
    -Endpoint "/notifications/register-token" `
    -Data '{"userId":"123e4567-e89b-12d3-a456-426614174000"}' `
    -ExpectedStatus 400 `
    -ExpectedMessage "Token FCM requerido"

Run-Test `
    -TestName "Validación: Código de referido inválido" `
    -Method "POST" `
    -Endpoint "/referrals/validate-code" `
    -Data '{"code":"ABC123"}' `
    -ExpectedStatus 400 `
    -ExpectedMessage "8 caracteres"

# Tests de Recurso No Encontrado (404)
Write-Host "📋 Tests de Recurso No Encontrado (404 Not Found)`n" -ForegroundColor $CYAN

Run-Test `
    -TestName "Not Found: Template inexistente" `
    -Method "GET" `
    -Endpoint "/notifications/templates/00000000-0000-0000-0000-000000000000" `
    -ExpectedStatus 404 `
    -ExpectedMessage "no encontrado"

# Tests de Errores Internos (500)
Write-Host "📋 Tests de Errores Internos (500 Internal Server Error)`n" -ForegroundColor $CYAN

Run-Test `
    -TestName "Error interno: UUID inválido" `
    -Method "POST" `
    -Endpoint "/notifications/send" `
    -Data '{"userId":"invalid-uuid","title":"Test","body":"Test"}' `
    -ExpectedStatus 400

# Resumen
Write-Host "📊 Resumen de Tests`n" -ForegroundColor $CYAN
Write-Host "   Total: $($script:TOTAL_TESTS)" -ForegroundColor $GRAY
Write-Host "   ✅ Pasados: $($script:TESTS_PASSED)" -ForegroundColor $GREEN
Write-Host "   ❌ Fallidos: $($script:TESTS_FAILED)" -ForegroundColor $RED
Write-Host ""

if ($script:TESTS_FAILED -eq 0) {
    Write-Host "🎉 Todos los tests pasaron`n" -ForegroundColor $GREEN
    exit 0
} else {
    Write-Host "⚠️  Algunos tests fallaron. Revisar arriba.`n" -ForegroundColor $YELLOW
    exit 1
}

