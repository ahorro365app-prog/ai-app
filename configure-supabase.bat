@echo off
echo 🔧 Configurador Automático de Supabase para Ahorro365
echo.

REM Verificar si .env.local existe
if not exist ".env.local" (
    echo ❌ El archivo .env.local no existe
    echo 📝 Ejecutando setup-env.bat primero...
    call setup-env.bat
    echo.
)

echo 🔍 Verificando configuración actual...
echo.

REM Leer valores actuales
for /f "tokens=2 delims==" %%a in ('findstr "NEXT_PUBLIC_SUPABASE_URL" .env.local') do set CURRENT_URL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local') do set CURRENT_KEY=%%a

echo 📋 Configuración actual:
echo    URL: %CURRENT_URL%
echo    KEY: %CURRENT_KEY:~0,20%...
echo.

REM Verificar si está configurado
if "%CURRENT_URL%"=="your_supabase_url_here" (
    echo ❌ Supabase no está configurado
    echo.
    echo 🔑 Para configurar Supabase:
    echo    1. Ve a https://supabase.com/dashboard
    echo    2. Selecciona tu proyecto
    echo    3. Ve a Settings → API
    echo    4. Copia la "Project URL" y "anon public" key
    echo.
    
    set /p SUPABASE_URL="📝 Ingresa la Project URL: "
    set /p SUPABASE_KEY="📝 Ingresa la anon public key: "
    
    if not "%SUPABASE_URL%"=="" if not "%SUPABASE_KEY%"=="" (
        echo.
        echo 💾 Actualizando configuración...
        
        REM Crear backup
        copy .env.local .env.local.backup >nul
        
        REM Actualizar valores
        powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_URL=.*', 'NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL%' | Set-Content .env.local"
        powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_SUPABASE_ANON_KEY=.*', 'NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_KEY%' | Set-Content .env.local"
        
        echo ✅ Configuración actualizada
        echo.
        echo 🚀 Próximos pasos:
        echo    1. Reinicia el servidor: npm run dev
        echo    2. Verifica que no haya errores en la consola
        echo    3. La aplicación debería funcionar correctamente
    ) else (
        echo ❌ No se ingresaron valores válidos
    )
) else (
    echo ✅ Supabase ya está configurado
    echo.
    echo 🧪 Para probar la configuración:
    echo    1. Ejecuta: npm run dev
    echo    2. Ve a http://localhost:3001
    echo    3. Verifica que no haya errores de Supabase
)

echo.
echo 📚 Archivos de ayuda:
echo    - CONFIGURACION_ENV.md (guía completa)
echo    - setup-env.bat (crear archivo .env.local)
echo    - http://localhost:3001/config (interfaz de configuración)
echo.
pause
