# 🚀 Configuración del Repositorio GitHub

## 📝 Pasos para Configurar GitHub Actions

### 1. **Crear Repositorio en GitHub**
1. Ve a [GitHub.com](https://github.com) y haz login
2. Click en **"New repository"** (botón verde)
3. Configuración:
   - **Repository name**: `ahorro365-app`
   - **Description**: `Aplicación de gestión financiera personal - Ahorro365`
   - **Visibility**: `Private` (recomendado)
   - **❌ NO marques** "Initialize with README"

### 2. **Conectar Repositorio Local**
Después de crear el repo en GitHub, ejecuta estos comandos:

```bash
# Agregar el repositorio remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/ahorro365-app.git

# Subir el código
git branch -M main
git push -u origin main
```

### 3. **Activar GitHub Actions**
1. Ve a tu repositorio en GitHub
2. Click en **"Actions"** (pestaña superior)
3. Click en **"I understand my workflows, go ahead and enable them"**
4. ¡Listo! 🎉

### 4. **Probar la Compilación**
1. En GitHub, ve a **"Actions"**
2. Verás el workflow **"Build Android APK"**
3. Click en **"Run workflow"** → **"Run workflow"**
4. Espera 5-10 minutos
5. Descarga el APK desde **"Artifacts"**

## 🎯 ¡APK Automático Listo!

Con esta configuración tendrás:
- ✅ **APK automático** cada vez que hagas `git push`
- ✅ **Sin problemas de Java** (usa Java 21 en la nube)
- ✅ **Historial de versiones** (todos los APKs guardados)
- ✅ **Acceso desde cualquier lugar**

## 📱 Descargar APK

1. GitHub → **Actions** → **"Build Android APK"**
2. Click en el workflow más reciente
3. En **"Artifacts"** encontrarás `app-debug-apk`
4. Click para descargar el APK

¡Ya no más problemas de Android Studio! 🚀
