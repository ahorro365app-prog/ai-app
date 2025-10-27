@echo off
echo 🚀 Compilando Ahorro365 APK...
echo.

cd android

echo 📱 Generando APK con versionado automático...
call gradlew assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ APK generada exitosamente!
    echo 📁 Ubicación: android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo 📋 Información de la versión:
    type app\version.properties
    echo.
    echo 🎉 ¡Compilación completada!
) else (
    echo.
    echo ❌ Error en la compilación
    echo 🔧 Revisa los errores arriba
)

pause

