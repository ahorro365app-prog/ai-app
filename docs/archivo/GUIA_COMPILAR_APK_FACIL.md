# 🚀 Guía Rápida: Compilar APK sin Android Studio

## ✅ Método Más Fácil (Recomendado)

### Opción 1: Script Automático (1 comando)

```bash
npm run build:apk
```

Este comando:
1. ✅ Compila la app Next.js
2. ✅ Copia archivos estáticos
3. ✅ Sincroniza con Capacitor
4. ✅ Compila el APK automáticamente

**Resultado**: APK en `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📋 Métodos Alternativos

### Opción 2: Gradle Directo (Más rápido)

Si ya ejecutaste `npm run build:android`, puedes compilar directamente:

**Windows:**
```bash
cd android
gradlew.bat assembleDebug
```

**Mac/Linux:**
```bash
cd android
./gradlew assembleDebug
```

### Opción 3: Android Studio (Si prefieres GUI)

1. Abre Android Studio
2. File → Open → Selecciona la carpeta `android`
3. Build → Build Bundle(s) / APK(s) → Build APK(s)
4. Espera a que compile
5. El APK estará en `app/build/outputs/apk/debug/`

---

## 📱 Instalar el APK

### En tu dispositivo Android:

1. **Habilita "Fuentes desconocidas"**:
   - Settings → Security → Unknown Sources (activar)

2. **Transfiere el APK**:
   - Conecta tu dispositivo por USB
   - Copia `app-debug.apk` al dispositivo
   - O usa `adb install app-debug.apk`

3. **Instala**:
   - Abre el archivo APK en tu dispositivo
   - Sigue las instrucciones

### Con ADB (desde tu PC):

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔧 Requisitos Previos

### 1. Java JDK (requerido para Gradle)

**⚠️ IMPORTANTE**: El plugin `@capacitor/push-notifications` requiere **Java 21**.

**Verificar si tienes Java:**
```bash
java -version
```

**Si no tienes Java 21:**
- **Opción 1 (Recomendada)**: Descarga Java 21 desde: https://adoptium.net/temurin/releases/?version=21
- **Opción 2**: Instala Android Studio (incluye Java 21 automáticamente)
- **Ubicación típica de Java 21 en Android Studio**: `%LOCALAPPDATA%\Android\Android Studio\jbr`

### 2. Android SDK (opcional, solo si quieres usar ADB)

Si quieres instalar directamente desde la PC:
- Descarga Android SDK Platform Tools: https://developer.android.com/tools/releases/platform-tools
- O instala Android Studio (incluye SDK)

---

## ⚠️ Solución de Problemas

### Error: "gradlew no se reconoce como comando"

**Solución:**
```bash
cd android
# Windows:
.\gradlew.bat assembleDebug
# Mac/Linux:
chmod +x gradlew
./gradlew assembleDebug
```

### Error: "Java no encontrado" o "invalid source release: 21"

**Solución:**
1. **El plugin de push notifications requiere Java 21** (no Java 17)
2. Instala Java 21 desde: https://adoptium.net/temurin/releases/?version=21
3. O instala Android Studio (incluye Java 21 automáticamente)
4. Configura JAVA_HOME:
   ```bash
   # Windows (PowerShell):
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
   # O si usas Android Studio:
   $env:JAVA_HOME = "$env:LOCALAPPDATA\Android\Android Studio\jbr"
   
   # Mac/Linux:
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
   ```

### Error: "SDK no encontrado"

**Solución:**
1. Abre `android/local.properties`
2. Agrega:
   ```properties
   sdk.dir=C:\\Users\\TuUsuario\\AppData\\Local\\Android\\Sdk
   ```
   (Ajusta la ruta según tu instalación)

---

## 🎯 Comparación de Métodos

| Método | Velocidad | Facilidad | Requisitos |
|--------|-----------|-----------|------------|
| **npm run build:apk** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Java JDK |
| **Gradle directo** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Java JDK |
| **Android Studio** | ⭐⭐⭐ | ⭐⭐ | Android Studio completo |

---

## 📝 Notas Importantes

- **APK Debug**: Más grande, incluye símbolos de debug
- **APK Release**: Más pequeño, optimizado, requiere firma
- **Tamaño esperado**: ~3-5 MB (después de nuestras optimizaciones)

---

## 🚀 Próximos Pasos

Una vez que tengas el APK:

1. **Probar en dispositivo físico**
2. **Compartir con testers**
3. **Firmar para producción** (cuando estés listo para publicar)

---

**💡 Recomendación**: Usa `npm run build:apk` - es el método más fácil y rápido.


