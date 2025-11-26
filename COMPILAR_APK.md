# 🚀 Compilar APK - Instrucciones Rápidas

## ✅ Configuración Verificada

- ✅ Java 21 instalado: `C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot`
- ✅ `android/local.properties` configurado correctamente
- ✅ Script `build-apk.js` actualizado para detectar Java 21

## 📦 Compilar APK (Método Recomendado)

Ejecuta este comando en tu terminal:

```bash
npm run build:apk
```

Este comando automáticamente:
1. ✅ Compila la app Next.js (con todas las actualizaciones recientes)
2. ✅ Copia archivos estáticos para Capacitor
3. ✅ Sincroniza con Android
4. ✅ Compila el APK con Java 21 (soporte para notificaciones push en segundo plano)

## 📍 Ubicación del APK

Una vez compilado, el APK estará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔧 Si hay problemas

### Error: "EPERM: operation not permitted"
```bash
# Limpia la carpeta .next
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build:apk
```

### Error: "Java no encontrado"
Verifica que Java 21 esté instalado:
```bash
java -version
```

Debería mostrar: `openjdk version "21.0.9"`

## 📝 Actualizaciones Incluidas en esta Compilación

- ✅ Validación de fechas (solo hoy/ayer)
- ✅ Límites diarios basados en `fecha_creacion`
- ✅ Seguridad mejorada (rate limiting fail-closed, timeouts)
- ✅ Logs sanitizados (sin información sensible)
- ✅ Java 21 para notificaciones push en segundo plano/pantalla apagada

