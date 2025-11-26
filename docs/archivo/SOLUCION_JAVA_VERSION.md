# 🔧 Solución: Error "invalid source release: 21"

## ❌ Problema

El proyecto Android está configurado para Java 17, pero tienes Java 8 instalado.

## ✅ Solución: Instalar Java 17

### Opción 1: Usar Adoptium (Recomendado - Más fácil)

1. **Descarga Java 17:**
   - Ve a: https://adoptium.net/temurin/releases/
   - Selecciona:
     - Version: **17 (LTS)**
     - Operating System: **Windows**
     - Architecture: **x64**
     - Package Type: **JDK**
   - Descarga el instalador `.msi`

2. **Instala Java 17:**
   - Ejecuta el instalador descargado
   - Sigue las instrucciones (Next, Next, Install)
   - **IMPORTANTE**: Marca la opción "Set JAVA_HOME variable" si aparece

3. **Verifica la instalación:**
   ```bash
   java -version
   ```
   Deberías ver algo como: `openjdk version "17.0.x"`

4. **Si no funciona, configura JAVA_HOME manualmente:**
   ```powershell
   # Verificar dónde se instaló (normalmente):
   # C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
   
   # Buscar la versión más reciente instalada:
   Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory | Where-Object { $_.Name -like "jdk-17*" } | Sort-Object Name -Descending | Select-Object -First 1
   
   # Configurar JAVA_HOME (PowerShell como Administrador):
   $javaPath = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"  # Usa la versión más reciente
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, "User")
   $env:JAVA_HOME = $javaPath  # Para esta sesión
   ```

### Opción 2: Usar Chocolatey (Si lo tienes instalado)

```bash
choco install openjdk17
```

### Opción 3: Usar Scoop (Si lo tienes instalado)

```bash
scoop install openjdk17
```

---

## 🔄 Después de Instalar Java 17

1. **Cierra y vuelve a abrir PowerShell/CMD** (para que cargue las nuevas variables)

2. **Verifica la versión:**
   ```bash
   java -version
   ```

3. **Intenta compilar nuevamente:**
   ```bash
   npm run build:apk
   ```

---

## ⚠️ Nota Importante

El archivo `android/app/capacitor.build.gradle` se regenera cada vez que ejecutas `npx cap sync`. Si vuelves a ejecutar `npx cap sync`, puede que vuelva a Java 21.

**Solución permanente**: Después de instalar Java 17, puedes:
- Instalar Java 21 (más reciente, pero no es necesario)
- O mantener Java 17 y editar `capacitor.build.gradle` cada vez que sincronices

---

## 📝 Cambios Realizados

He cambiado la configuración de Java 21 a Java 17 en:
- ✅ `android/app/capacitor.build.gradle`
- ✅ `android/capacitor-cordova-android-plugins/build.gradle`

Pero **necesitas instalar Java 17** para que funcione.


