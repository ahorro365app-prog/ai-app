# Script para verificar el formato del teléfono de un usuario
# Uso: .\check-user-phone.ps1 -Phone "59176990076"

param(
    [Parameter(Mandatory=$true)]
    [string]$Phone
)

Write-Host "`n🔍 Verificando usuario con teléfono: $Phone`n" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor DarkGray

# Normalizar número
$phoneWithPlus = if ($Phone -match '^\+') { $Phone } else { "+$Phone" }
$phoneWithoutPlus = if ($Phone -match '^\+') { $Phone.Substring(1) } else { $Phone }

Write-Host "Formatos a buscar:" -ForegroundColor Cyan
Write-Host "  • Con +: $phoneWithPlus" -ForegroundColor Gray
Write-Host "  • Sin +: $phoneWithoutPlus`n" -ForegroundColor Gray

Write-Host "💡 Para verificar en Supabase, ejecuta esta consulta SQL:`n" -ForegroundColor Yellow
Write-Host "SELECT id, email, telefono, created_at" -ForegroundColor White
Write-Host "FROM usuarios" -ForegroundColor White
Write-Host "WHERE telefono = '$phoneWithPlus'" -ForegroundColor Gray
Write-Host "   OR telefono = '$phoneWithoutPlus';`n" -ForegroundColor Gray

Write-Host "O busca variaciones:" -ForegroundColor Cyan
Write-Host "SELECT id, email, telefono, created_at" -ForegroundColor White
Write-Host "FROM usuarios" -ForegroundColor White
Write-Host "WHERE telefono LIKE '%$phoneWithoutPlus%';`n" -ForegroundColor Gray

