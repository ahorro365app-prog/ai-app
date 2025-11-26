# 📱 Guía para Compilar la App en Android Studio

## 📋 Requisitos Previos

1. **Android Studio** instalado (última versión recomendada)
2. **Java JDK 17 o 21** (Android Studio incluye JDK, pero verifica)
3. **Node.js y npm** instalados
4. **Capacitor CLI** instalado globalmente (opcional, pero recomendado)

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Instalar Dependencias (si no lo has hecho)
```bash
npm install
```

### 1.2 Construir y Sincronizar para Android (Recomendado)
```bash
npm run build:android
```

Este comando hace todo en uno:
1. Construye la aplicación Next.js (`npm run build`)
2. Copia los archivos estáticos necesarios a `out/`
3. Sincroniza con Capacitor (`npx cap sync android`)

**Alternativa (paso a paso):**
```bash
# 1. Construir la app
npm run build

# 2. Copiar archivos estáticos para Capacitor
node scripts/copy-static-for-capacitor.js

# 3. Sincronizar con Capacitor
npx cap sync android
```

**⚠️ IMPORTANTE:** Si Android Studio sigue mostrando una versión antigua:
1. Ejecuta `npm run build:android` nuevamente
2. En Android Studio: **Build → Clean Project**
3. Luego: **Build → Rebuild Project**
4. Si persiste, cierra Android Studio, elimina `android/.gradle` y vuelve a abrir

## 🚀 Paso 2: Abrir en Android Studio

### 2.1 Abrir el Proyecto
1. Abre **Android Studio**
2. Selecciona **"Open"** o **"File → Open"**
3. Navega a la carpeta `android/` de tu proyecto
4. Selecciona la carpeta `android` (no la raíz del proyecto)
5. Haz clic en **"OK"**

### 2.2 Esperar a que Gradle Sincronice
- Android Studio comenzará a sincronizar Gradle automáticamente
- Esto puede tardar varios minutos la primera vez
- Verás el progreso en la barra inferior
- **No cierres Android Studio** durante este proceso

### 2.3 Verificar que Todo Esté Correcto
- Si hay errores, aparecerán en la pestaña **"Build"** o **"Problems"**
- Los errores más comunes son:
  - **SDK no encontrado**: Ve a **File → Project Structure → SDK Location** y configura el Android SDK
  - **Gradle sync failed**: Revisa la versión de Gradle en `android/gradle/wrapper/gradle-wrapper.properties`

## 📦 Paso 3: Configurar el Proyecto (Primera Vez)

### 3.1 Verificar SDK
1. Ve a **File → Project Structure** (o `Ctrl+Alt+Shift+S`)
2. En **"SDK Location"**, verifica que el **Android SDK** esté configurado
3. Si no está configurado, haz clic en **"Edit"** y selecciona la ubicación del SDK

### 3.2 Verificar Versiones
- **Compile SDK Version**: Debe ser 34 o superior
- **Min SDK Version**: Debe ser 22 o superior
- **Target SDK Version**: Debe ser 34 o superior

Estas configuraciones están en `android/app/build.gradle` y `android/build.gradle`.

## 🔨 Paso 4: Compilar la App

### 4.1 Compilar APK de Debug (Para Pruebas)

**Opción A: Desde Android Studio**
1. En la barra superior, selecciona **"app"** en el dropdown
2. Haz clic en el botón **"Build"** → **"Build Bundle(s) / APK(s)"** → **"Build APK(s)"**
3. O usa el atajo: `Ctrl+F9` (Windows/Linux) o `Cmd+F9` (Mac)
4. Espera a que termine la compilación
5. Cuando termine, verás una notificación: **"APK(s) generated successfully"**
6. Haz clic en **"locate"** para ver el APK

**Ubicación del APK:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Opción B: Desde Terminal (en la carpeta android)**
```bash
cd android
./gradlew assembleDebug
```

En Windows:
```bash
cd android
gradlew.bat assembleDebug
```

### 4.2 Compilar APK de Release (Para Publicar)

**⚠️ IMPORTANTE**: Para compilar en Release, necesitas configurar la firma (keystore).

#### 4.2.1 Crear Keystore (Primera Vez)

1. Abre una terminal en la carpeta `android/app`
2. Ejecuta:
```bash
keytool -genkey -v -keystore ahorro365-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ahorro365
```

3. Completa la información solicitada:
   - **Password**: Guarda esta contraseña, la necesitarás
   - **Nombre, Organización, etc.**: Completa con tus datos

4. El archivo `ahorro365-release-key.jks` se creará en `android/app/`

#### 4.2.2 Configurar Firma en build.gradle

Edita `android/app/build.gradle` y agrega antes de `android {`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Y dentro de `android {`, agrega antes de `buildTypes {`:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}
```

Y modifica `buildTypes { release {` para incluir:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### 4.2.3 Crear keystore.properties

Crea el archivo `android/keystore.properties`:

```properties
storeFile=app/ahorro365-release-key.jks
keyAlias=ahorro365
storePassword=TU_PASSWORD_AQUI
keyPassword=TU_PASSWORD_AQUI
```

**⚠️ IMPORTANTE**: 
- Agrega `keystore.properties` a `.gitignore` (NO subas este archivo a Git)
- Guarda el archivo `.jks` en un lugar seguro (NO lo subas a Git)

#### 4.2.4 Compilar Release

**Desde Android Studio:**
1. **Build** → **"Generate Signed Bundle / APK"**
2. Selecciona **"APK"**
3. Selecciona tu keystore
4. Ingresa las contraseñas
5. Selecciona **"release"** como build variant
6. Haz clic en **"Finish"**

**Desde Terminal:**
```bash
cd android
./gradlew assembleRelease
```

En Windows:
```bash
cd android
gradlew.bat assembleRelease
```

**Ubicación del APK Release:**
```
android/app/build/outputs/apk/release/app-release.apk
```

## 📱 Paso 5: Probar la App

### 5.1 En un Dispositivo Físico

1. **Habilita el Modo Desarrollador** en tu Android:
   - Ve a **Configuración** → **Acerca del teléfono**
   - Toca **"Número de compilación"** 7 veces
   - Aparecerá **"Eres un desarrollador"**

2. **Habilita Depuración USB**:
   - Ve a **Configuración** → **Opciones de desarrollador**
   - Activa **"Depuración USB"**

3. **Conecta tu dispositivo**:
   - Conecta el dispositivo por USB
   - Acepta el diálogo de depuración USB en el dispositivo

4. **Ejecutar desde Android Studio**:
   - Selecciona tu dispositivo en el dropdown de dispositivos
   - Haz clic en el botón **"Run"** (▶️) o presiona `Shift+F10`

### 5.2 En un Emulador

1. **Crear un AVD (Android Virtual Device)**:
   - Ve a **Tools** → **Device Manager**
   - Haz clic en **"Create Device"**
   - Selecciona un dispositivo (ej: Pixel 5)
   - Selecciona una imagen del sistema (ej: Android 13)
   - Haz clic en **"Finish"**

2. **Ejecutar en el Emulador**:
   - Inicia el emulador desde Device Manager
   - Selecciona el emulador en el dropdown
   - Haz clic en **"Run"** (▶️)

## 🔍 Solución de Problemas Comunes

### Error: "SDK location not found"
**Solución**: Ve a **File → Project Structure → SDK Location** y configura la ruta del Android SDK.

### Error: "Gradle sync failed"
**Solución**: 
1. Ve a **File → Invalidate Caches / Restart**
2. Selecciona **"Invalidate and Restart"**
3. Espera a que Android Studio reinicie y sincronice

### Error: "Build failed" - Problemas de memoria
**Solución**: Edita `android/gradle.properties` y aumenta:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### Error: "Could not find or load main class"
**Solución**: 
1. Ve a **File → Project Structure → Project**
2. Verifica que **"Gradle version"** y **"Android Gradle Plugin version"** sean compatibles

### La app se cierra al abrirla
**Solución**:
1. Revisa **Logcat** en Android Studio para ver el error
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de haber ejecutado `npm run build` antes de `npx cap sync`

## 📝 Comandos Útiles

### Sincronizar después de cambios en el código web:
```bash
npm run build
npx cap sync android
```

### Limpiar y reconstruir:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Ver logs en tiempo real:
```bash
cd android
./gradlew assembleDebug --info
```

## ✅ Checklist Antes de Compilar

- [ ] `npm run build` ejecutado exitosamente
- [ ] `npx cap sync android` ejecutado exitosamente
- [ ] Android Studio abierto y Gradle sincronizado
- [ ] SDK de Android configurado correctamente
- [ ] Dispositivo/Emulador conectado (para probar)
- [ ] Variables de entorno configuradas (si es necesario)

## 🎯 Próximos Pasos

Después de compilar exitosamente:

1. **Probar la app** en diferentes dispositivos
2. **Optimizar el APK** (reducir tamaño, habilitar ProGuard si es necesario)
3. **Firmar el APK** para distribución
4. **Subir a Google Play Console** (si planeas publicar)

## 📚 Recursos Adicionales

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Android Studio](https://developer.android.com/studio)
- [Firmar tu app](https://developer.android.com/studio/publish/app-signing)

