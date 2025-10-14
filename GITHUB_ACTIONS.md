# 🚀 GitHub Actions - Compilación Automática de APK

## 📱 ¿Qué hace esto?

Este workflow de GitHub Actions compila automáticamente tu aplicación **Ahorro365** en un APK de Android cada vez que:

- ✅ Haces `push` a la rama `main` o `master`
- ✅ Creas un Pull Request
- ✅ Ejecutas manualmente el workflow
- ✅ Creas un tag (para releases)

## 🔧 Workflows Disponibles

### 1. **Build APK** (`.github/workflows/build-apk.yml`)
- **Propósito**: Compila APK de desarrollo (debug)
- **Trigger**: Push, PR, ejecución manual
- **Output**: `app-debug.apk`

### 2. **Build Release** (`.github/workflows/build-release.yml`)
- **Propósito**: Compila APK de producción (release)
- **Trigger**: Tags (v1.0.0, v2.1.3, etc.)
- **Output**: `app-release.apk` + GitHub Release

## 🚀 Cómo Usar

### **Opción 1: Compilación Automática**
```bash
# 1. Sube tu código a GitHub
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 2. Ve a GitHub → Actions → "Build Android APK"
# 3. Descarga el APK desde "Artifacts"
```

### **Opción 2: Compilación Manual**
1. Ve a tu repositorio en GitHub
2. Click en **"Actions"**
3. Selecciona **"Build Android APK"**
4. Click en **"Run workflow"**
5. Descarga el APK cuando termine

### **Opción 3: Release con Tag**
```bash
# Crear un tag para release
git tag v1.0.0
git push origin v1.0.0

# Esto creará automáticamente un GitHub Release con el APK
```

## 📁 Estructura de Archivos

```
.github/
└── workflows/
    ├── build-apk.yml      # APK de desarrollo
    └── build-release.yml  # APK de producción
```

## 🎯 Ventajas de GitHub Actions

- ✅ **Sin problemas de Java** - Usa Java 21 en la nube
- ✅ **Compilación automática** - Cada cambio genera un APK
- ✅ **Historial de versiones** - Todos los APKs se guardan
- ✅ **Acceso desde cualquier lugar** - Descarga desde GitHub
- ✅ **Sin configuración local** - Todo en la nube

## 📱 Descargar APK

1. Ve a **GitHub Actions** en tu repositorio
2. Click en el workflow más reciente
3. En la sección **"Artifacts"** encontrarás:
   - `app-debug-apk` - APK de desarrollo
   - `app-release-apk` - APK de producción (solo en releases)

## 🔍 Solución de Problemas

### **Error: "Java version"**
- ✅ **Solucionado**: GitHub Actions usa Java 21 automáticamente

### **Error: "Gradle build failed"**
- ✅ **Solucionado**: Cache de Gradle configurado

### **Error: "APK not found"**
- ✅ **Verifica**: Que el build haya terminado exitosamente
- ✅ **Espera**: El proceso toma 5-10 minutos

## 🎉 ¡Listo!

Con esta configuración, tendrás **APKs automáticos** cada vez que actualices tu código. ¡No más problemas de Java o Android Studio! 🚀
