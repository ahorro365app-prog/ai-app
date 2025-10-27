#!/bin/bash

echo "🚀 Compilando Ahorro365 APK..."
echo

cd android

echo "📱 Generando APK con versionado automático..."
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo
    echo "✅ APK generada exitosamente!"
    echo "📁 Ubicación: android/app/build/outputs/apk/release/app-release.apk"
    echo
    echo "📋 Información de la versión:"
    cat app/version.properties
    echo
    echo "🎉 ¡Compilación completada!"
else
    echo
    echo "❌ Error en la compilación"
    echo "🔧 Revisa los errores arriba"
fi

